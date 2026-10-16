<template>
  <div class="ori-page">
    <PageHero
      :title="event ? event.name : 'Orienteering'"
      crumb="Detail Event"
      icon="mdi:map-marker-path"
      :trail="[{ label: 'Orienteering', to: { name: 'orienteering' } }]"
      :subtitle="subtitle"
      :stats="stats"
    >
      <!-- gambar event menggantikan ikon di header -->
      <template v-if="heroImage" #icon>
        <span class="ori-hero-img" :class="{ 'is-logo': heroIsLogo }"><img :src="heroImage" :alt="event.name" /></span>
      </template>
      <template v-if="event" #actions>
        <div class="ori-hero-actions">
          <button type="button" class="ori-btn ori-btn--light" @click="openEventForm">
            <Icon icon="mdi:pencil-outline" /> Edit Event & Kategori
          </button>
          <button type="button" class="ori-btn ori-btn--light ori-btn--light-danger" @click="openResetEvent">
            <Icon icon="mdi:restore-alert" /> Reset Event
          </button>
        </div>
      </template>
    </PageHero>

    <div class="ori-wrap">
      <div v-if="loading" class="ori-empty">Memuat event…</div>
      <div v-else-if="!event" class="ori-empty ori-empty--error">
        {{ error || "Event tidak ditemukan." }}
        <button type="button" class="ori-btn ori-btn--ghost ml-2" @click="reloadAll">Coba lagi</button>
      </div>

      <template v-else>
        <!-- ===== SI READER (dipakai tab Readout & Peserta) ===== -->
        <div class="ori-reader" :class="{ 'is-on': isConnected }">
          <div class="ori-reader__title">
            <Icon icon="mdi:card-account-details-outline" />
            SI Card Reader
            <span class="ori-pill" :class="isConnected ? 'ori-pill--ok' : 'ori-pill--off'">
              <span class="ori-pill__dot"></span>
              {{ isConnected ? (isReadingCard ? "Membaca kartu…" : "Terhubung") : "Tidak terhubung" }}
            </span>
            <span v-if="captureForForm" class="ori-pill ori-pill--warn">
              <Icon icon="mdi:card-search-outline" /> Tempelkan kartu peserta untuk mengisi nomor SI Card
              <button type="button" class="ori-link ml-1" @click="captureForForm = false">batal</button>
            </span>
          </div>
          <div class="ori-reader__controls">
            <b-form-select v-model="selectedPath" :options="portOptions" :disabled="isConnected" size="sm" class="ori-port" />
            <button type="button" class="ori-btn ori-btn--ghost" :disabled="isConnected" @click="refreshPorts">
              <Icon icon="mdi:refresh" /> Refresh
            </button>
            <button
              type="button"
              class="ori-btn"
              :class="isConnected ? 'ori-btn--danger-ghost' : 'ori-btn--primary'"
              :disabled="isConnecting || (!isConnected && !selectedPath)"
              @click="toggleConnect"
            >
              <Icon :icon="isConnected ? 'mdi:lan-disconnect' : 'mdi:lan-connect'" />
              {{ isConnecting ? "Menghubungkan…" : isConnected ? "Putuskan" : "Hubungkan" }}
            </button>
          </div>
        </div>

        <!-- ===== JENIS ORIENTEERING (Sprint/Middle Distance, dst.) ===== -->
        <div v-if="races.length" class="ori-races">
          <span class="ori-races__label"><Icon icon="mdi:run-fast" /> Jenis Orienteering</span>
          <BucketButtonGroup
            :value="activeRaceId"
            :options="raceOptions"
            aria-label="Pilih jenis Orienteering"
            @input="requestRaceChange"
          />
          <span class="ori-races__hint">Start list, course, readout & hasil di bawah ini untuk <b>{{ activeRaceName }}</b>.</span>
        </div>

        <!-- ===== TABS ===== -->
        <div class="ori-tabs" role="tablist">
          <button
            v-for="t in tabs"
            :key="t.key"
            type="button"
            role="tab"
            class="ori-tab"
            :class="{ active: tab === t.key }"
            :aria-selected="tab === t.key"
            @click="tab = t.key"
          >
            <Icon :icon="t.icon" /> {{ t.label }}
            <span v-if="t.count !== undefined" class="ori-tab__count">{{ t.count }}</span>
          </button>
        </div>

        <!-- ================= TAB: READOUT ================= -->
        <section v-if="tab === 'readout'" class="ori-panel">
          <div v-if="!classes.length || !participants.length" class="ori-hint">
            <Icon icon="mdi:information-outline" />
            Lengkapi dulu
            <a href="#" @click.prevent="tab = 'classes'">Kategori & Course</a> dan
            <a href="#" @click.prevent="tab = 'participants'">Peserta & SI Card</a> supaya kartu bisa dikenali.
          </div>

          <div v-if="unsaved.length" class="ori-alert">
            <Icon icon="mdi:cloud-alert-outline" />
            {{ unsaved.length }} hasil baca kartu BELUM tersimpan (koneksi database bermasalah).
            <button type="button" class="ori-btn ori-btn--primary ml-2" :disabled="retrying" @click="retryUnsaved">
              {{ retrying ? "Menyimpan…" : "Simpan ulang" }}
            </button>
          </div>

          <div v-if="!lastRead" class="ori-empty">
            <Icon icon="mdi:card-bulleted-outline" class="ori-empty__icon" />
            <p class="mb-1 font-weight-bold">{{ isConnected ? "Menunggu kartu…" : "Hubungkan SI Card Reader" }}</p>
            <p class="text-muted mb-0">Hasil langsung tampil di sini begitu kartu dibaca.</p>
          </div>

          <div v-else-if="lastRead.unknown" class="ori-result ori-result--unknown">
            <div class="ori-result__status">KARTU TIDAK DIKENAL</div>
            <div class="ori-result__name">SI Card {{ lastRead.siCard }}</div>
            <p class="mb-2">Nomor kartu ini belum terdaftar ke peserta mana pun (hasil baca sudah disimpan).</p>
            <button type="button" class="ori-btn ori-btn--primary" @click="registerFromCard(lastRead.siCard)">
              <Icon icon="mdi:account-plus-outline" /> Daftarkan peserta
            </button>
          </div>

          <div v-else class="ori-result" :class="'ori-result--' + statusTone(lastRead.result.status)">
            <div class="ori-result__top">
              <div>
                <div class="ori-result__status">{{ statusLabel(lastRead.result.status) }}</div>
                <div class="ori-result__name">{{ lastRead.result.name }}</div>
                <div class="ori-result__meta">
                  {{ lastRead.result.className }} · SI {{ lastRead.result.siCard }}
                  <span v-if="lastRead.result.club"> · {{ lastRead.result.club }}</span>
                </div>
              </div>
              <div class="ori-result__time">{{ lastRead.result.time }}</div>
            </div>
            <div v-if="lastRead.result.missing.length" class="ori-result__missing">
              Pos terlewat/salah urutan:
              <span v-for="m in lastRead.result.missing" :key="m.order" class="ori-chip ori-chip--bad">
                #{{ m.order }} · {{ m.code }}
              </span>
            </div>
            <div class="ori-splits">
              <table class="ori-table ori-table--compact">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Pos</th>
                    <th>Jam</th>
                    <th class="text-right">Leg</th>
                    <th class="text-right">Kumulatif</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="s in lastRead.result.splits" :key="s.order" :class="{ 'is-missing': !s.found }">
                    <td>{{ s.order }}</td>
                    <td class="font-weight-bold">{{ s.code }}</td>
                    <td>{{ s.punchTime || "—" }}</td>
                    <td class="text-right">{{ fmt(s.legSec) }}</td>
                    <td class="text-right">{{ fmt(s.cumSec) }}</td>
                  </tr>
                  <tr>
                    <td>F</td>
                    <td class="font-weight-bold">Finish</td>
                    <td>{{ lastRead.result.finish || "—" }}</td>
                    <td class="text-right">{{ fmt(lastRead.result.finishLegSec) }}</td>
                    <td class="text-right font-weight-bold">{{ lastRead.result.time }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-if="lastRead.result.extra && lastRead.result.extra.length" class="small text-muted mt-2 mb-0">
                Punch di luar course (diabaikan):
                {{ lastRead.result.extra.map((e) => e.station).join(", ") }}
              </p>
            </div>
          </div>

          <div v-if="recent.length" class="ori-recent">
            <div class="ori-section-title">Baca terakhir (sesi ini)</div>
            <table class="ori-table">
              <thead>
                <tr>
                  <th>Jam baca</th>
                  <th>SI Card</th>
                  <th>Nama</th>
                  <th>Kelas</th>
                  <th class="text-right">Waktu</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in recent" :key="r.key" class="is-clickable" @click="lastRead = r">
                  <td>{{ r.at }}</td>
                  <td>{{ r.siCard }}</td>
                  <td>{{ r.unknown ? "— belum terdaftar —" : r.result.name }}</td>
                  <td>{{ r.unknown ? "-" : r.result.className }}</td>
                  <td class="text-right font-weight-bold">{{ r.unknown ? "-" : r.result.time }}</td>
                  <td>
                    <span class="ori-status" :class="'ori-status--' + (r.unknown ? 'warn' : statusTone(r.result.status))">
                      {{ r.unknown ? "Tidak dikenal" : statusLabel(r.result.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ================= TAB: PESERTA ================= -->
        <section v-if="tab === 'participants'" class="ori-panel">
          <!-- Tambah Peserta + Import Start List: bisa disembunyikan (default tersembunyi) -->
          <button
            ref="entryToggle"
            type="button"
            class="ori-entry-toggle"
            :class="{ open: showEntry }"
            :aria-expanded="showEntry ? 'true' : 'false'"
            @click="showEntry = !showEntry"
          >
            <Icon :icon="form._id ? 'mdi:account-edit-outline' : 'mdi:account-plus-outline'" />
            <span>{{ form._id ? "Edit Peserta" : "Tambah Peserta" }} &amp; Import Start List</span>
            <small class="ml-auto">{{ showEntry ? "Sembunyikan" : "Tampilkan" }}</small>
            <Icon :icon="showEntry ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="ori-entry-toggle__chev" />
          </button>
          <div v-show="showEntry" class="ori-entry">
          <div class="ori-form">
            <div class="ori-section-title">{{ form._id ? "Edit Peserta" : "Tambah Peserta" }}</div>
            <div class="ori-form__grid">
              <b-form-group label-for="ori-p-name">
                <template #label>Nama <span class="text-danger" title="Wajib diisi">*</span></template>
                <b-form-input id="ori-p-name" ref="nameInput" v-model="form.name" placeholder="Nama peserta" />
              </b-form-group>
              <b-form-group label-for="ori-p-class">
                <template #label>Kategori <span class="text-danger" title="Wajib diisi">*</span></template>
                <b-form-select id="ori-p-class" v-model="form.classId" :options="classOptions" />
              </b-form-group>
              <b-form-group label="BIB" label-for="ori-p-bib">
                <b-form-input id="ori-p-bib" v-model="form.bib" placeholder="mis. 193" />
              </b-form-group>
              <b-form-group label="No. Start" label-for="ori-p-no">
                <b-form-input id="ori-p-no" v-model="form.startNo" type="number" min="1" placeholder="mis. 1" />
              </b-form-group>
              <b-form-group label="Nomor SI Card (opsional)" label-for="ori-p-si" class="ori-si-group">
                <div class="d-flex" style="gap: 6px">
                  <b-form-input id="ori-p-si" v-model="form.siCard" type="number" min="1" placeholder="mis. 1421234" />
                  <button
                    type="button"
                    class="ori-btn ori-btn--ghost text-nowrap"
                    :disabled="!isConnected"
                    :title="isConnected ? 'Tempelkan kartu ke reader' : 'Hubungkan SI Card Reader dulu'"
                    @click="captureForForm = true"
                  >
                    <Icon icon="mdi:card-search-outline" /> Baca dari kartu
                  </button>
                </div>
              </b-form-group>
              <b-form-group label="Club (opsional)" label-for="ori-p-club">
                <b-form-input id="ori-p-club" v-model="form.club" placeholder="mis. Orienteering Jakarta" />
              </b-form-group>
              <b-form-group label="Nationality" label-for="ori-p-nat">
                <b-form-input id="ori-p-nat" v-model="form.nationality" placeholder="mis. Indonesia" />
              </b-form-group>
              <b-form-group label="IOF ID" label-for="ori-p-iof">
                <b-form-input id="ori-p-iof" v-model="form.iofId" placeholder="mis. 57288" />
              </b-form-group>
              <b-form-group label="Ranking IOF" label-for="ori-p-rank">
                <b-form-input id="ori-p-rank" v-model="form.iofRanking" type="number" min="1" placeholder="—" />
              </b-form-group>
              <b-form-group label="Jadwal Start (WIB)" label-for="ori-p-start" description="Starting Order — hanya info jadwal, TIDAK dipakai menghitung waktu (waktu selalu dari SI Card).">
                <b-form-input id="ori-p-start" v-model="form.scheduledStart" type="time" step="1" />
              </b-form-group>
              <b-form-group label="Status manual" label-for="ori-p-status">
                <b-form-select id="ori-p-status" v-model="form.manualStatus" :options="manualStatusOptions" />
              </b-form-group>
            </div>
            <p v-if="formError" class="text-danger small mb-2">{{ formError }}</p>
            <div class="d-flex" style="gap: 6px">
              <button type="button" class="ori-btn ori-btn--primary" :disabled="savingParticipant" @click="saveParticipant">
                <Icon icon="mdi:content-save-outline" /> {{ form._id ? "Simpan Perubahan" : "Tambah Peserta" }}
              </button>
              <button v-if="form._id" type="button" class="ori-btn ori-btn--ghost" @click="resetForm">Batal</button>
            </div>
          </div>

          <div class="ori-import">
            <div>
              <div class="ori-section-title mb-1"><Icon icon="mdi:file-upload-outline" /> Import Start List</div>
              <div class="small text-muted">
                CSV / Excel dgn kolom: Category, No, Start Time (WIB), Full Name, IOF ID, Ranking IOF, BIB, Club,
                Nationality, Sportident Number. Masuk ke <b>{{ activeRaceName }}</b>; peserta yang sudah ada
                (BIB/IOF ID/nama+kategori sama) diperbarui, bukan dobel.
              </div>
            </div>
            <div class="d-flex" style="gap: 6px">
              <button type="button" class="ori-btn ori-btn--ghost" @click="downloadTemplate">
                <Icon icon="mdi:download-outline" /> Template
              </button>
              <button type="button" class="ori-btn ori-btn--primary" @click="$refs.importFile.click()">
                <Icon icon="mdi:upload-outline" /> Upload CSV / Excel
              </button>
              <input ref="importFile" type="file" accept=".csv,.xlsx,.xls" class="d-none" @change="onImportFile" />
            </div>
          </div>
          </div>

          <div class="d-flex align-items-center justify-content-between mt-3 mb-2" style="gap: 8px">
            <div class="ori-section-title mb-0">Daftar Peserta — {{ activeRaceName }} ({{ participants.length }})</div>
            <div class="d-flex align-items-center" style="gap: 6px">
              <button
                type="button"
                class="ori-btn ori-btn--primary text-nowrap"
                :disabled="!participantsWithoutSi.length"
                :title="participantsWithoutSi.length ? 'Baca SI Card lalu assign ke peserta yang belum punya' : 'Semua peserta sudah punya SI Card'"
                @click="openAssign"
              >
                <Icon icon="mdi:card-account-details-outline" /> Daftarkan SI Card
                <span class="ori-btn__badge">{{ participantsWithoutSi.length }}</span>
              </button>
              <button
                type="button"
                class="ori-btn ori-btn--danger-ghost text-nowrap"
                :disabled="!participants.length"
                @click="openResetParticipants('')"
              >
                <Icon icon="mdi:account-multiple-remove-outline" /> Reset Peserta &amp; SI Card
              </button>
            </div>
          </div>
          <!-- Filter & sort Daftar Peserta -->
          <div class="ori-pfilter">
            <div class="ori-pfilter__search">
              <Icon icon="mdi:magnify" />
              <input v-model="search" type="search" placeholder="Cari nama, club, BIB, SI Card, IOF ID…" />
            </div>
            <b-form-select v-model="pFilter.classId" size="sm" :options="filterClassOptions" class="ori-pfilter__sel" />
            <b-form-select
              v-if="raceTypes.length > 1"
              v-model="pFilter.typeId"
              size="sm"
              :options="filterTypeOptions"
              class="ori-pfilter__sel"
            />
            <b-form-select v-model="pFilter.si" size="sm" :options="filterSiOptions" class="ori-pfilter__sel" />
            <b-form-select v-model="pFilter.status" size="sm" :options="filterStatusOptions" class="ori-pfilter__sel" />
            <b-form-select
              v-if="filterNationalityOptions.length > 2"
              v-model="pFilter.nationality"
              size="sm"
              :options="filterNationalityOptions"
              class="ori-pfilter__sel"
            />
            <div class="ori-pfilter__meta">
              <span>
                Menampilkan <b>{{ filteredParticipants.length }}</b> dari {{ participants.length }}
                <template v-if="pSort.key">
                  · urut {{ sortLabel }} {{ pSort.dir === "asc" ? "↑" : "↓" }}
                </template>
              </span>
              <button v-if="hasPFilter" type="button" class="ori-pfilter__clear" @click="clearPFilter">
                <Icon icon="mdi:filter-remove-outline" /> Reset filter
              </button>
            </div>
          </div>
          <table class="ori-table">
            <thead>
              <tr>
                <th
                  v-for="col in participantColumns"
                  :key="col.key"
                  class="ori-th-sort"
                  :class="{ 'is-sorted': pSort.key === col.key }"
                  :aria-sort="pSort.key === col.key ? (pSort.dir === 'asc' ? 'ascending' : 'descending') : 'none'"
                  :title="`Urutkan berdasarkan ${col.label}`"
                  @click="toggleSort(col.key)"
                >
                  {{ col.label }}
                  <Icon
                    class="ori-th-sort__icon"
                    :icon="pSort.key !== col.key ? 'mdi:swap-vertical' : pSort.dir === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                  />
                </th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filteredParticipants" :key="p._id">
                <td class="text-muted">{{ p.startNo || "-" }}</td>
                <td class="font-weight-bold">{{ p.name }}</td>
                <td class="text-nowrap">
                  <span class="font-weight-bold">{{ classShort(p.classId).name }}</span>
                  <span v-if="classShort(p.classId).type" class="ori-type-mini">{{ classShort(p.classId).type }}</span>
                </td>
                <td>{{ p.bib || "-" }}</td>
                <td>
                  <span v-if="p.siCard">{{ p.siCard }}</span>
                  <span v-else class="ori-status ori-status--muted">Belum ada</span>
                </td>
                <td>{{ p.club || "-" }}</td>
                <td class="text-nowrap">
                  <img
                    v-if="flagOf(p.nationality)"
                    :src="flagOf(p.nationality)"
                    :alt="p.nationality"
                    :title="p.nationality"
                    class="ori-flag"
                    loading="lazy"
                    @error="$event.target.style.display = 'none'"
                  />
                  {{ p.nationality || "-" }}
                </td>
                <td>{{ (p.scheduledStart || "").slice(0, 5) || "-" }}</td>
                <td>
                  <template v-if="resultByParticipant[p._id]">
                    <span class="ori-status" :class="'ori-status--' + statusTone(resultByParticipant[p._id].status)">
                      {{ statusLabel(resultByParticipant[p._id].status) }}
                    </span>
                    <span v-if="resultByParticipant[p._id].timeSec" class="ml-1 font-weight-bold">
                      {{ resultByParticipant[p._id].time }}
                    </span>
                  </template>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="text-right text-nowrap">
                  <button type="button" class="ori-icon-btn" title="Edit" @click="editParticipant(p)">
                    <Icon icon="mdi:pencil-outline" />
                  </button>
                  <button type="button" class="ori-icon-btn ori-icon-btn--danger" title="Hapus" @click="deleteParticipant(p)">
                    <Icon icon="mdi:trash-can-outline" />
                  </button>
                </td>
              </tr>
              <tr v-if="!filteredParticipants.length">
                <td colspan="10" class="text-center text-muted py-3">
                  <template v-if="participants.length">
                    Tidak ada peserta yang cocok dengan filter.
                    <button type="button" class="ori-pfilter__clear ml-1" @click="clearPFilter">Reset filter</button>
                  </template>
                  <template v-else>Belum ada peserta di {{ activeRaceName }}.</template>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- ================= TAB: KELAS & COURSE ================= -->
        <section v-if="tab === 'classes'" class="ori-panel">
          <!-- jenis aktif: course yang diedit di bawah HANYA utk jenis ini -->
          <div v-if="races.length" class="ori-crace">
            <div class="ori-crace__main">
              <span class="ori-crace__label"><Icon icon="mdi:map-marker-path" /> Course untuk</span>
              <span class="ori-crace__name">
                {{ activeRaceName }}
                <small v-if="activeRace && activeRace.location">· {{ activeRace.location }}</small>
              </span>
              <span v-if="classDraftDirty" class="ori-status ori-status--warn ml-auto">Belum disimpan</span>
            </div>
            <div v-if="hiddenRaceTypes.length" class="ori-crace__hidden">
              <Icon icon="mdi:eye-off-outline" />
              Tidak dipertandingkan di {{ activeRaceName }}:
              <b>{{ hiddenRaceTypes.map((t) => t.name).join(", ") }}</b>
              — atur di <a href="#" @click.prevent="openEventForm">Edit Event &amp; Kategori</a>.
            </div>
            <div v-if="races.length > 1" class="ori-crace__races">
              <button
                v-for="r in courseCoverage"
                :key="r.id"
                type="button"
                class="ori-crace__race"
                :class="{ active: r.id === activeRaceId }"
                @click="requestRaceChange(r.id)"
              >
                <b>{{ r.name }}</b>
                <span :class="r.done === r.total && r.total ? 'is-ok' : 'is-warn'">
                  {{ r.done }}/{{ r.total }} kategori ada course
                </span>
              </button>
            </div>
          </div>
          <div class="ori-hint">
            <Icon icon="mdi:information-outline" />
            Kategori &amp; Type berlaku untuk semua jenis, tetapi <b>course disimpan per jenis</b> — yang Anda isi
            di bawah hanya untuk <b>{{ activeRaceName }}</b>. Classic: pos harus dikunjungi <b>sesuai urutan</b>.
            Isi kode pos dipisah koma/spasi, mis. <code>33, 31, 35, 34, 37</code>. Pos yang sama boleh muncul lebih
            dari sekali. Mengubah course otomatis menghitung ulang hasil.
          </div>
          <div v-for="g in classDraftGroups" :key="g.typeId || '__none'" class="ori-type-group">
            <div class="ori-type-group__head">
              <span class="ori-type-tag">{{ g.typeName }}</span>
              <span v-if="typeRaceLabel(g.typeId)" class="ori-type-only">{{ typeRaceLabel(g.typeId) }}</span>
              <span class="text-muted small">{{ g.items.length }} kategori</span>
              <button type="button" class="ori-btn ori-btn--ghost ml-auto" @click="addClass(g.typeId)">
                <Icon icon="mdi:plus" /> Kategori
              </button>
            </div>
            <div v-for="c in g.items" :key="c.id" class="ori-class">
              <div class="ori-class__head">
                <b-form-input v-model="c.name" placeholder="Nama kategori (mis. M21 Men)" class="ori-class__name" />
                <span class="text-muted small">{{ parseControls(c.controlsText).length }} pos ·
                  {{ participantCountByClass[c.id] || 0 }} peserta di {{ activeRaceName }}</span>
                <button
                  type="button"
                  class="ori-icon-btn ml-auto"
                  :disabled="!participantCountByClass[c.id]"
                  :title="`Reset peserta & SI Card kategori ini (${activeRaceName})`"
                  @click="openResetParticipants(c.id)"
                >
                  <Icon icon="mdi:account-multiple-remove-outline" />
                </button>
                <button type="button" class="ori-icon-btn ori-icon-btn--danger" title="Hapus kategori" @click="removeClass(c)">
                  <Icon icon="mdi:trash-can-outline" />
                </button>
              </div>
              <b-form-textarea
                v-model="c.controlsText"
                rows="2"
                placeholder="Urutan kode pos, mis. 33, 31, 35, 34, 37, 42"
              />
              <!-- course kategori ini di jenis LAIN (tersimpan) -->
              <div v-if="otherRacesFor(c).length" class="ori-class__others">
                <span v-for="r in otherRacesFor(c)" :key="r.id" class="ori-class__other" :class="{ 'is-empty': !savedCourse(c, r.id).length }">
                  {{ r.name }}:
                  <template v-if="savedCourse(c, r.id).length">{{ savedCourse(c, r.id).length }} pos</template>
                  <template v-else>belum diatur</template>
                </span>
              </div>
              <div class="ori-class__chips">
                <span class="ori-chip ori-chip--start">S</span>
                <span v-for="(code, j) in parseControls(c.controlsText)" :key="j" class="ori-chip">
                  {{ j + 1 }}·{{ code }}
                </span>
                <span class="ori-chip ori-chip--start">F</span>
              </div>
            </div>
            <p v-if="!g.items.length" class="text-muted small mb-0">Belum ada kategori di type ini.</p>
          </div>
          <p v-if="!classDraftGroups.length" class="text-muted">
            Belum ada Type Event & kategori — klik <b>Edit Event & Kategori</b> di atas.
          </p>
          <div class="d-flex mt-2" style="gap: 6px">
            <button type="button" class="ori-btn ori-btn--ghost" @click="openEventForm">
              <Icon icon="mdi:shape-outline" /> Kelola Type & Kategori
            </button>
            <button type="button" class="ori-btn ori-btn--primary" :disabled="savingClasses" @click="saveClasses">
              <Icon icon="mdi:content-save-outline" />
              {{ savingClasses ? "Menyimpan…" : races.length ? `Simpan Course ${activeRaceName}` : "Simpan Course" }}
            </button>
          </div>
        </section>

        <!-- ================= TAB: HASIL ================= -->
        <section v-if="tab === 'results'" class="ori-panel">
          <div class="d-flex align-items-center mb-2" style="gap: 6px">
            <button type="button" class="ori-btn ori-btn--ghost" :disabled="loadingResults" @click="loadResults">
              <Icon icon="mdi:refresh" /> {{ loadingResults ? "Memuat…" : "Refresh" }}
            </button>
            <button type="button" class="ori-btn ori-btn--ghost" :disabled="!results" @click="exportExcel">
              <Icon icon="mdi:microsoft-excel" /> Export Excel
            </button>
          </div>
          <div v-if="results && results.unknownCards.length" class="ori-alert">
            <Icon icon="mdi:card-remove-outline" />
            Kartu terbaca tapi belum terdaftar:
            <span v-for="u in results.unknownCards" :key="u.siCard" class="ori-chip ori-chip--warn is-clickable" @click="registerFromCard(u.siCard)">
              {{ u.siCard }}
            </span>
          </div>
          <div class="ori-section-title">Hasil — {{ activeRaceName }}</div>
          <div v-if="!results || !results.classes.length" class="ori-empty">Belum ada kategori.</div>
          <!-- Filter & sort tab Hasil -->
          <div v-else class="ori-pfilter">
            <div class="ori-pfilter__search">
              <Icon icon="mdi:magnify" />
              <input v-model="rFilter.q" type="search" placeholder="Cari nama, club, BIB, SI Card…" />
            </div>
            <b-form-select
              v-if="raceTypes.length > 1"
              v-model="rFilter.typeId"
              size="sm"
              :options="filterTypeOptions"
              class="ori-pfilter__sel"
            />
            <b-form-select v-model="rFilter.classId" size="sm" :options="resultClassOptions" class="ori-pfilter__sel" />
            <b-form-select v-model="rFilter.status" size="sm" :options="filterStatusOptions" class="ori-pfilter__sel" />
            <b-form-select
              v-if="filterNationalityOptions.length > 2"
              v-model="rFilter.nationality"
              size="sm"
              :options="filterNationalityOptions"
              class="ori-pfilter__sel"
            />
            <div class="ori-pfilter__meta">
              <span>
                Menampilkan <b>{{ resultShownCount }}</b> dari {{ resultRows.length }} peserta ·
                {{ resultShownClassCount }} kategori
                <template v-if="rSort.key !== 'rank' || rSort.dir !== 'asc'">
                  · urut {{ resultSortLabel }} {{ rSort.dir === "asc" ? "↑" : "↓" }}
                </template>
              </span>
              <b-form-checkbox v-model="rFilter.hideEmpty" switch class="small">Sembunyikan kategori kosong</b-form-checkbox>
              <div class="ori-view-toggle ml-auto" role="group" aria-label="Tampilan hasil">
                <button type="button" :class="{ on: rView === 'summary' }" @click="rView = 'summary'">
                  <Icon icon="mdi:format-list-numbered" /> Ringkas
                </button>
                <button type="button" :class="{ on: rView === 'splits' }" @click="rView = 'splits'">
                  <Icon icon="mdi:map-marker-path" /> Split per pos
                </button>
              </div>
              <button v-if="hasRFilter" type="button" class="ori-pfilter__clear" @click="clearRFilter">
                <Icon icon="mdi:filter-remove-outline" /> Reset filter
              </button>
            </div>
          </div>
          <div v-if="results && results.classes.length && !filteredResultGroups.length" class="ori-empty">
            Tidak ada hasil yang cocok dengan filter.
            <button type="button" class="ori-pfilter__clear ml-1" @click="clearRFilter">Reset filter</button>
          </div>
          <template v-for="g in filteredResultGroups">
          <div :key="'tg-' + (g.typeId || 'none')" class="ori-type-divider">
            <span class="ori-type-tag ori-type-tag--lg">{{ g.typeName }}</span>
          </div>
          <div v-for="c in g.items" :key="c.classId" class="ori-class-result">
            <div class="ori-section-title">
              {{ c.className }}
              <span class="text-muted small font-weight-normal">
                · {{ c.controls.length }} pos ·
                <template v-if="c.shown.length !== c.results.length">{{ c.shown.length }} dari </template>{{ c.results.length }} peserta
              </span>
              <span v-if="!c.controls.length && c.results.length" class="ori-status ori-status--warn ml-1">
                Course belum diatur — semua kartu dianggap OK
              </span>
            </div>
            <table v-if="rView === 'summary'" class="ori-table">
              <thead>
                <tr>
                  <th
                    v-for="col in resultColumns"
                    :key="col.key"
                    class="ori-th-sort"
                    :class="{ 'is-sorted': rSort.key === col.key, 'text-right': col.right }"
                    :style="col.style"
                    :aria-sort="rSort.key === col.key ? (rSort.dir === 'asc' ? 'ascending' : 'descending') : 'none'"
                    :title="`Urutkan berdasarkan ${col.label}`"
                    @click="col.sortable !== false && toggleResultSort(col.key)"
                  >
                    {{ col.label }}
                    <Icon
                      v-if="col.sortable !== false"
                      class="ori-th-sort__icon"
                      :icon="rSort.key !== col.key ? 'mdi:swap-vertical' : rSort.dir === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                    />
                  </th>
                  <th class="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in c.shown" :key="r.participantId">
                  <td class="font-weight-bold">{{ r.rank || "-" }}</td>
                  <td class="font-weight-bold">{{ r.name }}</td>
                  <td>{{ r.bib || "-" }}</td>
                  <td>{{ r.club || "-" }}</td>
                  <td class="text-nowrap">
                    <img
                      v-if="flagOf(r.nationality)"
                      :src="flagOf(r.nationality)"
                      :alt="r.nationality"
                      :title="r.nationality"
                      class="ori-flag"
                      loading="lazy"
                      @error="$event.target.style.display = 'none'"
                    />
                    {{ r.nationality || "-" }}
                  </td>
                  <td>{{ r.siCard || "-" }}</td>
                  <td class="text-nowrap small text-muted" title="Jadwal start (Starting Order) — info, tidak dipakai menghitung">
                    {{ (r.scheduledStart || "").slice(0, 5) || "-" }}
                  </td>
                  <td class="text-nowrap small">
                    <template v-if="r.readAt">
                      <span v-if="r.start">{{ clockHms(r.start) }}</span>
                      <span v-else class="text-danger font-weight-bold" title="Kartu tanpa punch Start">tanpa Start</span>
                      <span class="text-muted"> → </span>
                      <span>{{ r.finish ? clockHms(r.finish) : "-" }}</span>
                    </template>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td class="text-right font-weight-bold">{{ r.status === "OK" ? r.time : "-" }}</td>
                  <td class="text-right text-muted">{{ r.rank && r.behindSec ? "+" + fmt(r.behindSec) : "-" }}</td>
                  <td>
                    <span class="ori-status" :class="'ori-status--' + statusTone(r.status)">{{ statusLabel(r.status) }}</span>
                    <span v-if="r.status === 'MP'" class="small text-muted ml-1">
                      ({{ r.missing.map((m) => m.code).join(", ") }})
                    </span>
                    <span v-if="r.edited" class="ori-edited ml-1" :title="'Dikoreksi operator: ' + (r.editNote || '-')">
                      <Icon icon="mdi:pencil" /> Diedit
                    </span>
                  </td>
                  <td class="text-right">
                    <button type="button" class="ori-icon-btn" title="Edit hasil" @click="openResultEdit(r, c)">
                      <Icon icon="mdi:pencil-outline" />
                    </button>
                  </td>
                </tr>
                <tr v-if="!c.shown.length">
                  <td colspan="12" class="text-center text-muted py-3">
                    {{ c.results.length ? "Tidak ada peserta yang cocok dengan filter." : "Belum ada peserta di kategori ini." }}
                  </td>
                </tr>
              </tbody>
            </table>
            <!-- Split per pos: waktu kumulatif + leg tiap pos course, peringkat leg -->
            <div v-else class="ori-split-wrap">
              <table class="ori-table ori-split">
                <thead>
                  <tr>
                    <th class="ori-split__sticky ori-split__rank">Rank</th>
                    <th class="ori-split__sticky ori-split__name">Nama</th>
                    <th v-for="(code, i) in c.controls" :key="'h' + i" class="text-center">
                      {{ i + 1 }}<small class="d-block ori-split__code">({{ code }})</small>
                    </th>
                    <th class="text-center">F<small class="d-block ori-split__code">Finish</small></th>
                    <th>Status</th>
                    <th class="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="t in splitRowsOf(c)" :key="t.row.participantId">
                    <td class="ori-split__sticky ori-split__rank font-weight-bold">{{ t.row.rank || "-" }}</td>
                    <td class="ori-split__sticky ori-split__name">
                      <div class="font-weight-bold text-nowrap">
                        <img
                          v-if="flagOf(t.row.nationality)"
                          :src="flagOf(t.row.nationality)"
                          :alt="t.row.nationality"
                          :title="t.row.nationality"
                          class="ori-flag"
                          @error="$event.target.style.display = 'none'"
                        />{{ t.row.name }}
                      </div>
                      <small class="text-muted text-nowrap">{{ t.row.club || "-" }}</small>
                    </td>
                    <td
                      v-for="(leg, i) in t.legs"
                      :key="'l' + i"
                      class="ori-split__cell"
                      :class="{
                        'is-best': leg.best,
                        'is-missed': leg.missed,
                        'is-edited': t.row.splits[i] && t.row.splits[i].edited,
                        'is-clickable': i < c.controls.length,
                      }"
                      :title="i < c.controls.length ? 'Klik untuk edit split pos ' + (i + 1) : ''"
                      @click="i < c.controls.length && openResultEdit(t.row, c, i + 1)"
                    >
                      <template v-if="leg.missed"><span class="ori-split__miss">terlewat</span></template>
                      <template v-else-if="leg.cumSec !== null || leg.legSec !== null">
                        <div class="ori-split__cum">
                          {{ leg.cumSec !== null ? fmt(leg.cumSec) : "-" }}
                          <span v-if="leg.cumRank" class="ori-split__pos">({{ leg.cumRank }})</span>
                        </div>
                        <div class="ori-split__leg">
                          {{ leg.legSec !== null ? "+" + fmt(leg.legSec) : "" }}
                          <span v-if="leg.legRank" class="ori-split__lrank">{{ leg.legRank }}</span>
                        </div>
                      </template>
                      <span v-else class="text-muted">-</span>
                    </td>
                    <td class="text-nowrap">
                      <span class="ori-status" :class="'ori-status--' + statusTone(t.row.status)">{{ statusLabel(t.row.status) }}</span>
                      <span v-if="t.row.edited" class="ori-edited ml-1" :title="'Dikoreksi operator: ' + (t.row.editNote || '-')">
                        <Icon icon="mdi:pencil" />
                      </span>
                    </td>
                    <td class="text-right">
                      <button type="button" class="ori-icon-btn" title="Edit hasil" @click="openResultEdit(t.row, c)">
                        <Icon icon="mdi:pencil-outline" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!c.shown.length">
                    <td :colspan="c.controls.length + 5" class="text-center text-muted py-3">Tidak ada peserta.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          </template>
        </section>
      </template>
    </div>

    <b-modal
      v-model="importState.show"
      :title="`Import Start List — ${activeRaceName}`"
      size="lg"
      centered
      scrollable
      :ok-title="importState.running ? 'Mengimpor…' : `Import ${importState.rows.length} peserta`"
      cancel-title="Batal"
      :ok-disabled="importState.running || !importState.rows.length || !!importState.missing.length"
      :no-close-on-backdrop="importState.running"
      @ok.prevent="confirmImport"
    >
      <p class="mb-2"><Icon icon="mdi:file-outline" /> <b>{{ importState.fileName }}</b></p>
      <div v-if="importState.missing.length" class="ori-alert">
        Kolom wajib tidak ditemukan: {{ importState.missing.map((m) => (m === "category" ? "Category" : "Full Name")).join(", ") }}.
        Gunakan Template.
      </div>
      <template v-else>
        <div class="ori-import-sum">
          <div><b>{{ importState.rows.length }}</b> peserta siap diimpor</div>
          <div><b>{{ importState.rows.filter((r) => r.siCard).length }}</b> sudah punya SI Card</div>
          <div><b>{{ importState.rows.filter((r) => !r.siCard).length }}</b> belum punya SI Card</div>
          <div :class="{ 'text-danger': importState.errors.length }"><b>{{ importState.errors.length }}</b> baris dilewati</div>
        </div>
        <table class="ori-table ori-table--compact mt-2">
          <thead>
            <tr>
              <th>Kategori</th>
              <th class="text-right">Peserta</th>
              <th>Type Event</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in importPreviewCategories" :key="c.name">
              <td class="font-weight-bold">{{ c.name }}</td>
              <td class="text-right">{{ c.count }}</td>
              <td><span class="ori-type-tag">{{ c.typeName }}</span></td>
              <td>
                <span v-if="c.isNew" class="ori-status ori-status--warn">Kategori baru (dibuat otomatis)</span>
                <span v-else class="ori-status ori-status--ok">Sudah ada</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="small text-muted mt-2 mb-0">
          Type Event otomatis: kategori berakhiran <b>E</b> (mis. W21E) = World Ranking Event, lainnya = National Event.
        </p>
        <div v-if="importState.errors.length" class="mt-2">
          <div class="font-weight-bold small text-danger mb-1">Baris yang dilewati:</div>
          <ul class="small mb-0">
            <li v-for="e in importState.errors" :key="e.rowNo">Baris {{ e.rowNo }}<span v-if="e.name"> ({{ e.name }})</span>: {{ e.message }}</li>
          </ul>
        </div>
      </template>
    </b-modal>

    <!-- ===== Edit Hasil (koreksi operator; kartu mentah tidak diubah) ===== -->
    <b-modal
      v-model="resEdit.show"
      :title="resEdit.row ? `Edit Hasil — ${resEdit.row.name}` : 'Edit Hasil'"
      size="lg"
      centered
      no-close-on-backdrop
      hide-footer
    >
      <template v-if="resEdit.row">
        <div class="ori-redit-head">
          <span class="ori-type-mini">{{ resEdit.cls.className }}</span>
          <span class="text-muted small">{{ activeRaceName }} · SI {{ resEdit.row.siCard || "—" }}</span>
          <span v-if="resEdit.row.edited" class="ori-edited ml-auto"><Icon icon="mdi:pencil" /> Sudah dikoreksi</span>
        </div>

        <div class="ori-redit-orig">
          <div class="ori-redit-orig__title">Data asli dari SI Card</div>
          <div class="ori-redit-grid">
            <div><small>Start</small><b>{{ resEdit.row.cardStart ? clockHms(resEdit.row.cardStart) : "tidak ada" }}</b></div>
            <div><small>Finish</small><b>{{ resEdit.row.cardFinish ? clockHms(resEdit.row.cardFinish) : "tidak ada" }}</b></div>
            <div><small>Waktu</small><b>{{ resEdit.row.autoTimeSec !== null && resEdit.row.autoTimeSec !== undefined ? fmt(resEdit.row.autoTimeSec) : "-" }}</b></div>
            <div><small>Status otomatis</small><b>{{ resEdit.row.autoStatus ? statusLabel(resEdit.row.autoStatus) : "Belum baca kartu" }}</b></div>
          </div>
        </div>

        <div class="ori-form__grid mt-3">
          <b-form-group label="Start (koreksi)" label-for="ori-re-start" description="Kosong = pakai punch kartu">
            <b-form-input id="ori-re-start" v-model="resEdit.form.start" type="time" step="1" />
          </b-form-group>
          <b-form-group label="Finish (koreksi)" label-for="ori-re-finish" description="Kosong = pakai punch kartu">
            <b-form-input id="ori-re-finish" v-model="resEdit.form.finish" type="time" step="1" />
          </b-form-group>
          <b-form-group label="Koreksi waktu (±)" label-for="ori-re-adj" description="Penalti/bonus, mis. +1:00 atau -0:30">
            <b-form-input id="ori-re-adj" v-model="resEdit.form.adjust" placeholder="+0:00" />
          </b-form-group>
          <b-form-group label="Status" label-for="ori-re-status">
            <b-form-select id="ori-re-status" v-model="resEdit.form.status" :options="resultStatusOptions" />
          </b-form-group>
        </div>
        <!-- Edit split per pos -->
        <div v-if="resEdit.cls.controls.length" class="ori-redit-splits">
          <div class="ori-redit-orig__title">Split per pos ({{ resEdit.cls.controls.length }} pos)</div>
          <table class="ori-redit-stable">
            <thead>
              <tr>
                <th>#</th>
                <th>Kode</th>
                <th>Punch kartu</th>
                <th>Jam punch (koreksi)</th>
                <th title="Unit pos rusak / punch tidak terekam">Dianggap dipunch</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(code, i) in resEdit.cls.controls"
                :key="i"
                :class="{ 'is-missed': !origPunch(i + 1), 'is-edited': punchEdited(i + 1) }"
              >
                <td class="font-weight-bold">{{ i + 1 }}</td>
                <td>{{ code }}</td>
                <td class="text-nowrap">
                  <span v-if="origPunch(i + 1)">{{ clockHms(origPunch(i + 1)) }}</span>
                  <span v-else class="text-danger font-weight-bold">terlewat</span>
                </td>
                <td>
                  <b-form-input
                    :id="'ori-re-p' + (i + 1)"
                    v-model="resEdit.form.punches[i + 1].time"
                    type="time"
                    step="1"
                    size="sm"
                    class="ori-redit-time"
                  />
                </td>
                <td class="text-center">
                  <b-form-checkbox v-model="resEdit.form.punches[i + 1].ok" :disabled="!!resEdit.form.punches[i + 1].time" />
                </td>
              </tr>
            </tbody>
          </table>
          <small class="text-muted">
            Kosong = pakai punch kartu. Isi jam untuk mengoreksi / menambah punch pos, atau centang "Dianggap dipunch"
            bila unit pos rusak (tanpa waktu). Status MP/OK & split dihitung ulang otomatis.
          </small>
        </div>

        <b-form-group label-for="ori-re-note" class="mt-3">
          <template #label>Alasan / catatan koreksi <span class="text-danger" title="Wajib diisi">*</span></template>
          <b-form-input id="ori-re-note" v-model="resEdit.form.note" maxlength="300" placeholder="mis. unit pos 33 rusak, punch tercatat di backup" />
        </b-form-group>

        <div class="ori-redit-preview">
          <Icon icon="mdi:calculator-variant-outline" />
          <span>Pratinjau waktu: <b>{{ resultEditPreview }}</b></span>
          <span class="text-muted small ml-auto">Peringkat diurutkan ulang otomatis setelah disimpan.</span>
        </div>
        <p v-if="resEdit.error" class="text-danger small mb-2">{{ resEdit.error }}</p>

        <div class="d-flex mt-3" style="gap: 6px">
          <button
            v-if="resEdit.row.edited"
            type="button"
            class="ori-btn ori-btn--danger-ghost"
            :disabled="resEdit.saving"
            @click="saveResultEdit(true)"
          >
            <Icon icon="mdi:restore" /> Hapus koreksi
          </button>
          <button type="button" class="ori-btn ori-btn--ghost ml-auto" @click="resEdit.show = false">Batal</button>
          <button type="button" class="ori-btn ori-btn--primary" :disabled="resEdit.saving" @click="saveResultEdit(false)">
            <Icon icon="mdi:content-save-outline" /> {{ resEdit.saving ? "Menyimpan…" : "Simpan & Hitung Ulang" }}
          </button>
        </div>
      </template>
    </b-modal>

    <!-- ===== Daftarkan SI Card cepat: baca kartu dulu -> assign ke peserta tanpa SI Card ===== -->
    <b-modal
      v-model="assign.show"
      title="Daftarkan SI Card"
      size="lg"
      centered
      scrollable
      hide-footer
      no-close-on-backdrop
      @hidden="closeAssign"
    >
      <div class="ori-asg-top">
        <span class="small text-muted">
          <b>{{ activeRaceName }}</b> · {{ participantsWithoutSi.length }} peserta belum punya SI Card
        </span>
        <span v-if="assign.count" class="ori-pill ori-pill--ok ml-auto">{{ assign.count }} terdaftar di sesi ini</span>
      </div>

      <div v-if="assign.last" class="ori-asg-last">
        <Icon icon="mdi:check-circle" /> SI Card <b>{{ assign.last.siCard }}</b> → <b>{{ assign.last.name }}</b>
        <span class="text-muted">({{ assign.last.className }})</span>
      </div>

      <!-- LANGKAH 1: baca kartu -->
      <div v-if="assign.step === 'read'" class="ori-asg-read">
        <div class="ori-asg-wave" :class="{ off: !isConnected }">
          <Icon icon="mdi:contactless-payment-circle-outline" />
        </div>
        <div class="ori-asg-title">
          {{ isConnected ? "Tempelkan SI Card ke reader…" : "SI Card Reader belum terhubung" }}
        </div>
        <div class="small text-muted mb-3">
          {{ isConnected ? "Nomor kartu terbaca otomatis, lalu pilih pesertanya." : "Hubungkan reader di panel SI Card Reader, atau ketik nomor kartunya di bawah." }}
        </div>
        <div class="ori-asg-manual">
          <b-form-input
            v-model="assign.manual"
            type="number"
            min="1"
            placeholder="atau ketik nomor SI Card"
            @keydown.enter.prevent="useManualCard"
          />
          <button type="button" class="ori-btn ori-btn--ghost" :disabled="!assign.manual" @click="useManualCard">
            Gunakan
          </button>
        </div>
      </div>

      <!-- kartu sudah dipakai peserta lain -->
      <div v-else-if="assign.step === 'used'" class="ori-asg-used">
        <div class="ori-asg-card"><Icon icon="mdi:card-bulleted-outline" /> {{ assign.card }}</div>
        <p class="mb-3">
          SI Card ini sudah dipakai oleh <b>{{ assign.owner.name }}</b> ({{ classShort(assign.owner.classId).name }})
          di {{ activeRaceName }}.
        </p>
        <div class="d-flex flex-wrap" style="gap: 6px">
          <button type="button" class="ori-btn ori-btn--primary" @click="restartAssign">
            <Icon icon="mdi:card-search-outline" /> Baca kartu lain
          </button>
          <button type="button" class="ori-btn ori-btn--danger-ghost" @click="assignMoveFromOwner">
            <Icon icon="mdi:swap-horizontal" /> Pindahkan ke peserta lain
          </button>
        </div>
      </div>

      <!-- LANGKAH 2: pilih peserta -->
      <div v-else class="ori-asg-pick">
        <div class="ori-asg-pick__head">
          <div class="ori-asg-card"><Icon icon="mdi:card-bulleted-outline" /> {{ assign.card }}</div>
          <div class="small text-muted">
            <template v-if="assign.moveFrom">
              Dipindahkan dari <b>{{ assign.moveFrom.name }}</b> —
            </template>
            Pilih peserta untuk kartu ini. Tempel kartu lain untuk mengganti nomor.
          </div>
          <button type="button" class="ori-link ml-auto" @click="restartAssign">Batal</button>
        </div>
        <div class="ori-asg-filter">
          <b-form-input ref="assignSearch" v-model="assign.q" size="sm" placeholder="Cari nama / BIB / club…" />
          <b-form-select v-model="assign.classId" size="sm" :options="assignClassOptions" />
        </div>
        <div class="ori-asg-list">
          <button
            v-for="p in assignCandidates"
            :key="p._id"
            type="button"
            class="ori-asg-item"
            :disabled="assign.saving"
            @click="assignTo(p)"
          >
            <span class="ori-asg-item__cat">{{ classShort(p.classId).name }}</span>
            <span class="ori-asg-item__main">
              <b>{{ p.name }}</b>
              <small>{{ [p.bib ? "BIB " + p.bib : "", p.club, p.nationality].filter(Boolean).join(" · ") || "-" }}</small>
            </span>
            <span class="ori-asg-item__go"><Icon icon="mdi:arrow-right-circle" /></span>
          </button>
          <div v-if="!assignCandidates.length" class="text-center text-muted py-4 small">
            Tidak ada peserta tanpa SI Card yang cocok.
          </div>
        </div>
      </div>

      <div class="ori-asg-foot">
        <b-form-checkbox v-model="assign.auto" switch class="small">Lanjut ke kartu berikutnya setelah assign</b-form-checkbox>
        <button type="button" class="ori-btn ori-btn--ghost ml-auto" @click="assign.show = false">Selesai</button>
      </div>
    </b-modal>

    <!-- ===== Reset Peserta & SI Card (per kategori / semua, jenis aktif) ===== -->
    <b-modal
      v-model="resetP.show"
      title="Reset Peserta & SI Card"
      centered
      ok-variant="danger"
      :ok-title="resetP.running ? 'Memproses…' : resetPOkTitle"
      cancel-title="Batal"
      :ok-disabled="resetP.running || !resetPTarget.count"
      :no-close-on-backdrop="resetP.running"
      @ok.prevent="doResetParticipants"
    >
      <p class="small text-muted mb-3">
        Berlaku untuk <b>{{ activeRaceName }}</b> saja. Jenis lain, kategori &amp; course tidak berubah.
      </p>
      <b-form-group label="Kategori" label-for="ori-reset-class">
        <b-form-select id="ori-reset-class" v-model="resetP.classId" :options="resetClassOptions" />
      </b-form-group>
      <b-form-group>
        <template #label>Yang direset <span class="text-danger" title="Wajib diisi">*</span></template>
        <label class="ori-reset-opt" :class="{ on: resetP.mode === 'delete' }">
          <input v-model="resetP.mode" type="radio" value="delete" />
          <span>
            <b>Hapus peserta</b>
            <small>Peserta, nomor SI Card &amp; hasil baca kartunya dihapus. Bisa diimpor ulang dari Start List.</small>
          </span>
        </label>
        <label class="ori-reset-opt" :class="{ on: resetP.mode === 'si' }">
          <input v-model="resetP.mode" type="radio" value="si" />
          <span>
            <b>Kosongkan SI Card saja</b>
            <small>Peserta tetap ada; nomor SI Card dikosongkan &amp; hasil baca kartu lamanya dihapus.</small>
          </span>
        </label>
      </b-form-group>
      <div class="ori-reset-sum" :class="{ 'is-empty': !resetPTarget.count }">
        <template v-if="!resetPTarget.count">
          {{ resetP.mode === "si" ? "Tidak ada peserta dengan SI Card" : "Tidak ada peserta" }} di pilihan ini.
        </template>
        <template v-else-if="resetP.mode === 'delete'">
          <b>{{ resetPTarget.count }}</b> peserta akan dihapus
          <span v-if="resetPTarget.withSi">(termasuk {{ resetPTarget.withSi }} nomor SI Card)</span> beserta hasil baca kartunya.
        </template>
        <template v-else>
          Nomor SI Card <b>{{ resetPTarget.count }}</b> peserta akan dikosongkan beserta hasil baca kartunya.
        </template>
        <div class="small mt-1">Tindakan ini tidak bisa dibatalkan.</div>
      </div>
    </b-modal>

    <!-- ===== Reset Event (semua jenis) ===== -->
    <b-modal
      v-model="resetE.show"
      title="Reset Event"
      centered
      ok-variant="danger"
      :ok-title="resetE.running ? 'Memproses…' : 'Reset Event'"
      cancel-title="Batal"
      :ok-disabled="resetE.running || !resetEConfirmed"
      :no-close-on-backdrop="resetE.running"
      @ok.prevent="doResetEvent"
    >
      <div class="ori-reset-sum">
        <div class="mb-1"><b>Akan dihapus di semua jenis ({{ races.length || 1 }}):</b></div>
        <ul class="mb-1 pl-3">
          <li>{{ resetE.summary ? resetE.summary.participants : "…" }} peserta (start list)</li>
          <li>{{ resetE.summary ? resetE.summary.siCards : "…" }} nomor SI Card terdaftar</li>
          <li>{{ resetE.summary ? resetE.summary.readouts : "…" }} hasil baca kartu &amp; seluruh hasil / Live Result</li>
        </ul>
        <div class="small">Nama, tanggal, poster/logo, jenis &amp; Type Event tetap.</div>
      </div>
      <b-form-checkbox v-model="resetE.clearClasses" class="mt-3">
        Kosongkan juga <b>kategori &amp; course</b> ({{ classes.length }} kategori)
      </b-form-checkbox>
      <b-form-group class="mt-3 mb-0" label-for="ori-reset-confirm">
        <template #label>
          Ketik <b>{{ event && event.name }}</b> untuk konfirmasi <span class="text-danger" title="Wajib diisi">*</span>
        </template>
        <b-form-input id="ori-reset-confirm" v-model="resetE.confirmText" autocomplete="off" />
      </b-form-group>
    </b-modal>

    <b-modal
      v-model="showEventForm"
      title="Edit Event & Kategori"
      size="xl"
      centered
      scrollable
      ok-title="Simpan"
      cancel-title="Batal"
      :ok-disabled="savingEvent || eventFormUploading || !eventForm || !eventForm.name.trim() || !eventForm.startDate"
      @ok.prevent="saveEventForm"
    >
      <OriEventForm
        v-if="showEventForm && eventForm"
        :key="eventFormKey"
        v-model="eventForm"
        :participant-count="participantCountByClass"
        @uploading="eventFormUploading = $event"
      />
    </b-modal>
  </div>
</template>

<script>
import PageHero from "@/components/common/PageHero.vue";
import OriEventForm from "@/components/orienteering/OriEventForm.vue";
import { ipcRequest } from "@/utils/ipcRequest";
import { listPorts } from "@/utils/serialConnection.js";
import { createSportIdentReader } from "@/utils/sportIdentReader.js";
import * as XLSX from "xlsx";
import { exportRowsToExcel, exportSheetsToExcel } from "@/utils/exportExcel";
import {
  parseControls,
  formatDuration,
  STATUS_LABEL,
  IMPORT_COLUMNS,
  normalizeImportRows,
  courseOf,
  typeNameForCategory,
  filterParticipants,
  sortParticipants,
  NOT_READ,
  sortResultRows,
  OVERRIDE_STATUSES,
  buildSplitTable,
  clockToSeconds,
  runElapsed,
  parseAdjust,
  classesForRace,
  classAppliesToRace,
  typeAppliesToRace,
} from "@/lib/orienteering";
import { flagUrl } from "@/lib/countryFlag";

// kolom tab Hasil yang bisa di-sort (key = sortResultRows())
const RESULT_COLUMNS = [
  { key: "rank", label: "Rank", style: "width: 70px" },
  { key: "name", label: "Nama" },
  { key: "bib", label: "BIB" },
  { key: "club", label: "Club" },
  { key: "nationality", label: "Negara" },
  { key: "si", label: "SI Card" },
  { key: "start", label: "Starting Order" }, // jadwal start — info saja, TIDAK dihitung
  { key: "punch", label: "Start / Finish (SI)", sortable: false },
  { key: "time", label: "Waktu", right: true },
  { key: "behind", label: "Selisih", right: true },
  { key: "status", label: "Status" },
];
const EMPTY_RFILTER = () => ({ q: "", typeId: "", classId: "", status: "", nationality: "", hideEmpty: false });

// kolom Daftar Peserta yang bisa di-sort (key = sortParticipants())
const PARTICIPANT_COLUMNS = [
  { key: "no", label: "No" },
  { key: "name", label: "Nama" },
  { key: "category", label: "Kategori" },
  { key: "bib", label: "BIB" },
  { key: "si", label: "SI Card" },
  { key: "club", label: "Club" },
  { key: "nationality", label: "Negara" },
  { key: "start", label: "Jadwal Start" }, // Starting Order, BUKAN punch SI Card
  { key: "result", label: "Hasil" },
];
const EMPTY_PFILTER = () => ({ classId: "", typeId: "", si: "", status: "", nationality: "" });
import tone from "@/assets/tone/tone_message.mp3";

const EMPTY_FORM = () => ({
  _id: "",
  name: "",
  classId: "",
  siCard: "",
  startNo: "",
  bib: "",
  iofId: "",
  iofRanking: "",
  club: "",
  nationality: "",
  scheduledStart: "",
  manualStatus: "",
});
const RACE_KEY = (eventId) => `ori:activeRace:${eventId}`;

export default {
  name: "OrienteeringEventDetail",
  components: { PageHero, OriEventForm },
  data() {
    return {
      loading: true,
      error: "",
      event: null,
      participants: [],
      results: null,
      loadingResults: false,
      tab: "readout",
      activeRaceId: "",
      importState: { show: false, fileName: "", rows: [], errors: [], missing: [], running: false },
      // reader
      ports: [],
      selectedPath: "",
      reader: null,
      isConnected: false,
      isConnecting: false,
      isReadingCard: false,
      captureForForm: false,
      // readout
      lastRead: null,
      recent: [],
      unsaved: [],
      retrying: false,
      // participant form
      form: EMPTY_FORM(),
      formError: "",
      savingParticipant: false,
      search: "",
      pFilter: EMPTY_PFILTER(),
      pSort: { key: "", dir: "asc" }, // "" = urutan bawaan (kategori, No, nama)
      participantColumns: PARTICIPANT_COLUMNS,
      rFilter: EMPTY_RFILTER(),
      rView: "summary", // "summary" | "splits" (waktu antar pos)
      resEdit: { show: false, row: null, cls: null, form: {}, saving: false, error: "" },
      rSort: { key: "rank", dir: "asc" },
      resultColumns: RESULT_COLUMNS,
      showEntry: false,
      // widget Daftarkan SI Card (step: read -> pick | used)
      assign: {
        show: false, step: "read", card: null, owner: null, moveFrom: null,
        q: "", classId: "", manual: "", saving: false, auto: true, count: 0, last: null,
      }, // panel Tambah Peserta & Import (default tersembunyi)
      // classes
      classDraft: [],
      savingClasses: false,
      // modal edit event & kategori
      showEventForm: false,
      eventForm: null,
      eventFormKey: 0,
      savingEvent: false,
      eventFormUploading: false,
      // reset
      resetP: { show: false, classId: "", mode: "delete", running: false },
      resetE: { show: false, summary: null, clearClasses: false, confirmText: "", running: false },
      manualStatusOptions: [
        { value: "", text: "— (otomatis dari kartu)" },
        { value: "DSQ", text: "DSQ (diskualifikasi)" },
        { value: "DNS", text: "DNS (tidak start)" },
      ],
    };
  },
  computed: {
    eventId() {
      return String(this.$route.params.id || "");
    },
    classes() {
      return (this.event && this.event.classes) || [];
    },
    types() {
      return (this.event && this.event.types) || [];
    },
    races() {
      return (this.event && this.event.races) || [];
    },
    // header: logo event, cadangan poster
    heroIsLogo() {
      return !!(this.event && this.event.logo && this.event.logo.url);
    },
    heroImage() {
      if (!this.event) return "";
      if (this.heroIsLogo) return this.event.logo.url;
      return (this.event.image && this.event.image.url) || "";
    },
    raceOptions() {
      return this.races.map((r) => ({ value: r.id, text: r.location ? `${r.name} · ${r.location}` : r.name }));
    },
    activeRace() {
      return this.races.find((x) => x.id === this.activeRaceId) || null;
    },
    otherRaces() {
      return this.races.filter((r) => r.id !== this.activeRaceId);
    },
    // Type & kategori yang dipertandingkan di jenis aktif
    raceTypes() {
      return this.types.filter((t) => typeAppliesToRace(t, this.activeRaceId));
    },
    hiddenRaceTypes() {
      return this.types.filter((t) => !typeAppliesToRace(t, this.activeRaceId));
    },
    raceClasses() {
      return classesForRace(this.event, this.activeRaceId);
    },
    // per jenis: berapa kategori yang course-nya sudah diisi (data tersimpan)
    courseCoverage() {
      return this.races.map((r) => {
        const list = classesForRace(this.event, r.id);
        return { id: r.id, name: r.name, total: list.length, done: list.filter((c) => courseOf(c, r.id).length).length };
      });
    },
    // draft tab Kategori & Course berbeda dgn yang tersimpan (jenis aktif)
    classDraftDirty() {
      if (this.classDraft.length !== this.classes.length) return true;
      const saved = new Map(this.classes.map((c) => [c.id, c]));
      return this.classDraft.some((d) => {
        const c = saved.get(d.id);
        if (!c) return true;
        return (
          d.name.trim() !== c.name ||
          (d.typeId || "") !== (c.typeId || "") ||
          parseControls(d.controlsText).join(",") !== courseOf(c, this.activeRaceId).join(",")
        );
      });
    },
    activeRaceName() {
      const r = this.races.find((x) => x.id === this.activeRaceId);
      return r ? r.name : "Event ini";
    },
    importPreviewCategories() {
      const known = new Set(this.classes.map((c) => c.name.trim().toUpperCase()));
      const counts = new Map();
      this.importState.rows.forEach((r) => counts.set(r.category, (counts.get(r.category) || 0) + 1));
      return Array.from(counts.entries()).map(([name, count]) => {
        const existing = this.classes.find((c) => c.name.trim().toUpperCase() === name.trim().toUpperCase());
        const typeName = existing && this.typeNameById[existing.typeId]
          ? this.typeNameById[existing.typeId]
          : typeNameForCategory(name);
        return { name, count, typeName, isNew: !known.has(name.trim().toUpperCase()) };
      });
    },
    typeNameById() {
      const m = {};
      this.types.forEach((t) => (m[t.id] = t.name));
      return m;
    },
    // [{ typeId, typeName, items }] urut sesuai urutan type; kategori tanpa
    // type (event lama) dikumpulkan di "Tanpa Type".
    // hanya kategori yang dipertandingkan di jenis aktif (draft tetap memuat
    // SEMUA kategori supaya course jenis lain ikut tersimpan utuh)
    classDraftGroups() {
      return this.groupByType(
        this.classDraft.filter((c) => classAppliesToRace(this.event, c, this.activeRaceId)),
        (c) => c.typeId
      );
    },
    resultGroups() {
      return this.groupByType(this.results ? this.results.classes : [], (c) => c.typeId);
    },
    // filter (kategori/type/status/negara/cari) + sort DI DALAM tiap kategori;
    // rank tetap peringkat resmi kategori tsb.
    filteredResultGroups() {
      const f = this.rFilter;
      const filtering = !!(f.q.trim() || f.status || f.nationality);
      return this.resultGroups
        .filter((g) => !f.typeId || g.typeId === f.typeId)
        .map((g) => ({
          ...g,
          items: g.items
            .filter((c) => !f.classId || c.classId === f.classId)
            .map((c) => {
              const rows = filterParticipants(
                c.results,
                { q: f.q, status: f.status, nationality: f.nationality },
                { resultOf: (r) => r }
              );
              return { ...c, shown: sortResultRows(rows, this.rSort.key, this.rSort.dir) };
            })
            // saat memfilter peserta / "sembunyikan kosong": kategori tanpa baris disembunyikan
            .filter((c) => (filtering || f.hideEmpty ? c.shown.length : true)),
        }))
        .filter((g) => g.items.length);
    },
    resultStatusOptions() {
      return [{ value: "", text: "Otomatis (dari SI Card)" }].concat(
        OVERRIDE_STATUSES.map((s) => ({ value: s, text: this.statusLabel(s) }))
      );
    },
    // pratinjau sederhana: (finish - start) + koreksi; status final dihitung server
    resultEditPreview() {
      const r = this.resEdit.row;
      if (!r) return "-";
      const f = this.resEdit.form;
      if (f.status && f.status !== "OK") return this.statusLabel(f.status);
      const st = clockToSeconds(f.start || r.cardStart);
      const fi = clockToSeconds(f.finish || r.cardFinish);
      if (st === null || fi === null) return st === null ? "Tanpa Start" : "Tanpa Finish";
      let adj = 0;
      try {
        adj = parseAdjust(f.adjust);
      } catch (_e) {
        return "koreksi waktu tidak valid";
      }
      return this.fmt(Math.max(0, runElapsed(st, fi) + adj));
    },
    resultShownCount() {
      return this.filteredResultGroups.reduce((n, g) => n + g.items.reduce((m, c) => m + c.shown.length, 0), 0);
    },
    resultShownClassCount() {
      return this.filteredResultGroups.reduce((n, g) => n + g.items.length, 0);
    },
    resultClassOptions() {
      const classes = this.results ? this.results.classes : [];
      const groups = this.groupByType(classes, (c) => c.typeId).map((g) => ({
        label: g.typeName,
        options: g.items.map((c) => ({ value: c.classId, text: `${c.className} (${c.results.length})` })),
      }));
      return [{ value: "", text: "Semua kategori" }].concat(groups);
    },
    hasRFilter() {
      const f = this.rFilter;
      return !!(f.q.trim() || f.typeId || f.classId || f.status || f.nationality || f.hideEmpty) ||
        this.rSort.key !== "rank" || this.rSort.dir !== "asc";
    },
    resultSortLabel() {
      const c = RESULT_COLUMNS.find((x) => x.key === this.rSort.key);
      return c ? c.label : "";
    },
    subtitle() {
      if (!this.event) return "";
      const bits = [];
      const fmt = (v) => {
        const d = new Date(v);
        return isNaN(d) ? v : d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
      };
      const a = this.event.startDate || this.event.date;
      const b = this.event.endDate;
      if (a) bits.push(b && b !== a ? `${fmt(a)} – ${fmt(b)}` : fmt(a));
      if (this.event.location) bits.push(this.event.location);
      if (this.races.length) {
        bits.push(this.races.map((r) => (r.location ? `${r.name} (${r.location})` : r.name)).join(" · "));
      }
      if (this.types.length) bits.push(this.types.map((t) => t.name).join(" & "));
      return bits.join(" · ") || "Event orienteering";
    },
    resultRows() {
      return this.results ? this.results.classes.reduce((all, c) => all.concat(c.results), []) : [];
    },
    resultByParticipant() {
      const map = {};
      this.resultRows.forEach((r) => (map[r.participantId] = r));
      return map;
    },
    stats() {
      const finished = this.resultRows.filter((r) => r.status !== "DNS").length;
      const ok = this.resultRows.filter((r) => r.status === "OK").length;
      return [
        { label: "Type Event", value: this.types.length },
        { label: "Kategori", value: this.classes.length },
        { label: "Peserta", value: this.participants.length, tone: "info" },
        { label: "Sudah baca", value: finished },
        { label: "OK", value: ok, tone: "success" },
      ];
    },
    tabs() {
      return [
        { key: "readout", label: "Readout", icon: "mdi:card-bulleted-outline" },
        { key: "participants", label: "Peserta & SI Card", icon: "mdi:account-group-outline", count: this.participants.length },
        { key: "classes", label: "Kategori & Course", icon: "mdi:map-marker-path", count: this.raceClasses.length },
        { key: "results", label: "Hasil", icon: "mdi:trophy-outline" },
      ];
    },
    portOptions() {
      if (!this.ports.length) return [{ value: "", text: "Port tidak ditemukan — klik Refresh" }];
      return this.ports.map((p) => ({ value: p.path, text: p.path }));
    },
    // dikelompokkan per Type Event (optgroup)
    classOptions() {
      const groups = this.groupByType(this.raceClasses, (c) => c.typeId).map((g) => ({
        label: g.typeName,
        options: g.items.map((c) => ({ value: c.id, text: c.name })),
      }));
      return [{ value: "", text: "— pilih kategori —", disabled: true }].concat(groups);
    },
    resetClassOptions() {
      const count = (id) => this.participants.filter((p) => p.classId === id).length;
      const groups = this.groupByType(this.raceClasses, (c) => c.typeId).map((g) => ({
        label: g.typeName,
        options: g.items.map((c) => ({ value: c.id, text: `${c.name} (${count(c.id)} peserta)` })),
      }));
      return [{ value: "", text: `Semua kategori (${this.participants.length} peserta)` }].concat(groups);
    },
    resetPTarget() {
      const inScope = this.participants.filter((p) => !this.resetP.classId || p.classId === this.resetP.classId);
      const withSi = inScope.filter((p) => p.siCard).length;
      return { count: this.resetP.mode === "si" ? withSi : inScope.length, withSi };
    },
    resetPOkTitle() {
      const n = this.resetPTarget.count;
      return this.resetP.mode === "si" ? `Kosongkan ${n} SI Card` : `Hapus ${n} Peserta`;
    },
    resetEConfirmed() {
      return !!this.event && this.resetE.confirmText.trim() === String(this.event.name || "").trim();
    },
    participantCountByClass() {
      const m = {};
      this.participants.forEach((p) => (m[p.classId] = (m[p.classId] || 0) + 1));
      return m;
    },
    participantsWithoutSi() {
      return this.participants.filter((p) => !p.siCard);
    },
    assignCandidates() {
      const list = filterParticipants(
        this.participantsWithoutSi,
        { q: this.assign.q, classId: this.assign.classId },
        this.participantCtx
      );
      return sortParticipants(sortParticipants(list, "name", "asc", this.participantCtx), "category", "asc", this.participantCtx);
    },
    assignClassOptions() {
      const count = (id) => this.participantsWithoutSi.filter((p) => p.classId === id).length;
      const opts = this.classes
        .filter((c) => count(c.id))
        .map((c) => ({ value: c.id, text: `${c.name} (${count(c.id)})` }));
      return [{ value: "", text: `Semua kategori (${this.participantsWithoutSi.length})` }].concat(opts);
    },
    participantCtx() {
      const byId = new Map(this.classes.map((c) => [c.id, c]));
      return {
        typeOf: (id) => (byId.get(id) ? byId.get(id).typeId || "" : ""),
        classNameOf: (id) => (byId.get(id) ? byId.get(id).name : ""),
        resultOf: (p) => this.resultByParticipant[p._id] || null,
      };
    },
    filteredParticipants() {
      const list = filterParticipants(this.participants, { ...this.pFilter, q: this.search }, this.participantCtx);
      return sortParticipants(list, this.pSort.key, this.pSort.dir, this.participantCtx);
    },
    hasPFilter() {
      return !!this.search.trim() || Object.values(this.pFilter).some(Boolean) || !!this.pSort.key;
    },
    sortLabel() {
      const c = PARTICIPANT_COLUMNS.find((x) => x.key === this.pSort.key);
      return c ? c.label : "";
    },
    filterClassOptions() {
      const count = (id) => this.participants.filter((p) => p.classId === id).length;
      const groups = this.groupByType(this.raceClasses, (c) => c.typeId).map((g) => ({
        label: g.typeName,
        options: g.items.map((c) => ({ value: c.id, text: `${c.name} (${count(c.id)})` })),
      }));
      return [{ value: "", text: "Semua kategori" }].concat(groups);
    },
    filterTypeOptions() {
      return [{ value: "", text: "Semua Type Event" }].concat(this.raceTypes.map((t) => ({ value: t.id, text: t.name })));
    },
    filterSiOptions() {
      const withSi = this.participants.filter((p) => p.siCard).length;
      return [
        { value: "", text: "SI Card: semua" },
        { value: "with", text: `Sudah ada SI Card (${withSi})` },
        { value: "without", text: `Belum ada SI Card (${this.participants.length - withSi})` },
      ];
    },
    filterStatusOptions() {
      return [
        { value: "", text: "Hasil: semua" },
        { value: NOT_READ, text: "Belum baca kartu" },
        { value: "OK", text: "OK" },
        { value: "MP", text: STATUS_LABEL.MP },
        { value: "DNF", text: STATUS_LABEL.DNF },
        { value: "NO_START", text: STATUS_LABEL.NO_START },
        { value: "DSQ", text: STATUS_LABEL.DSQ },
        { value: "DNS", text: "DNS (manual)" },
      ];
    },
    filterNationalityOptions() {
      const set = new Map();
      this.participants.forEach((p) => {
        const n = String(p.nationality || "").trim();
        if (n) set.set(n.toUpperCase(), n);
      });
      const list = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
      return [{ value: "", text: "Semua negara" }].concat(list.map((n) => ({ value: n, text: n })));
    },
  },
  async mounted() {
    await this.reloadAll();
    this.refreshPorts();
  },
  beforeDestroy() {
    if (this.reader) this.reader.disconnect();
  },
  methods: {
    parseControls,
    fmt(sec) {
      return sec === null || sec === undefined ? "-" : formatDuration(sec);
    },
    statusLabel(s) {
      return STATUS_LABEL[s] || s || "-";
    },
    statusTone(s) {
      return { OK: "ok", MP: "bad", DSQ: "bad", DNF: "warn", NO_START: "warn", DNS: "muted" }[s] || "muted";
    },
    className(id) {
      const c = this.classes.find((x) => x.id === id);
      if (!c) return "-";
      const t = this.typeNameById[c.typeId];
      return t ? `${c.name} · ${t}` : c.name;
    },
    // { name, type } — type disingkat (WRE / National) utk tabel padat
    classShort(id) {
      const c = this.classes.find((x) => x.id === id);
      if (!c) return { name: "-", type: "" };
      const t = this.typeNameById[c.typeId] || "";
      return { name: c.name, type: /world ranking/i.test(t) ? "WRE" : t.replace(/ Event$/i, "") };
    },
    groupByType(list, typeOf) {
      const groups = this.raceTypes.map((t) => ({ typeId: t.id, typeName: t.name, items: [] }));
      const byId = {};
      groups.forEach((g) => (byId[g.typeId] = g));
      const none = { typeId: "", typeName: "Tanpa Type", items: [] };
      (list || []).forEach((item) => (byId[typeOf(item)] || none).items.push(item));
      return groups.concat(none.items.length ? [none] : []);
    },
    openEventForm() {
      this.eventForm = {
        _id: this.event._id,
        name: this.event.name || "",
        image: this.event.image || null,
        liveVisible: this.event.liveVisible !== false,
        logo: this.event.logo || null,
        startDate: this.event.startDate || this.event.date || "",
        endDate: this.event.endDate || "",
        location: this.event.location || "",
        races: this.races,
        types: this.types,
        classes: this.classes,
      };
      this.eventFormKey += 1;
      this.showEventForm = true;
    },
    async saveEventForm() {
      this.savingEvent = true;
      const res = await ipcRequest("ori:event:save", { event: this.eventForm });
      this.savingEvent = false;
      if (!res || !res.ok) {
        this.toast((res && res.error) || "Gagal menyimpan (cek koneksi database).", "danger", "Gagal");
        return;
      }
      this.event = res.data;
      if (!this.races.some((r) => r.id === this.activeRaceId)) {
        this.pickActiveRace();
        await this.loadParticipants();
      }
      this.resetClassDraft();
      this.showEventForm = false;
      this.toast("Event & kategori tersimpan.");
      this.loadResults();
    },
    /* ---------- Daftarkan SI Card (baca kartu -> assign) ---------- */
    openAssign() {
      this.captureForForm = false;
      this.assign = {
        show: true, step: "read", card: null, owner: null, moveFrom: null,
        q: "", classId: "", manual: "", saving: false, auto: true, count: 0, last: null,
      };
    },
    closeAssign() {
      this.assign.show = false;
      this.assign.step = "read";
      this.assign.card = null;
    },
    restartAssign() {
      Object.assign(this.assign, { step: "read", card: null, owner: null, moveFrom: null, manual: "" });
    },
    useManualCard() {
      const n = Number(this.assign.manual);
      if (!Number.isInteger(n) || n <= 0) {
        this.toast("Nomor SI Card tidak valid.", "danger", "Daftarkan SI Card");
        return;
      }
      this.handleAssignCard(n);
    },
    handleAssignCard(cardNumber) {
      const n = Number(cardNumber);
      if (!Number.isInteger(n) || n <= 0) {
        this.toast("Nomor kartu tidak terbaca, coba tempel ulang.", "danger", "Daftarkan SI Card");
        return;
      }
      const owner = this.participants.find((p) => Number(p.siCard) === n) || null;
      Object.assign(this.assign, { card: n, owner, moveFrom: null, manual: "", step: owner ? "used" : "pick" });
      if (!owner) this.$nextTick(() => this.$refs.assignSearch && this.$refs.assignSearch.focus());
    },
    assignMoveFromOwner() {
      Object.assign(this.assign, { moveFrom: this.assign.owner, owner: null, step: "pick" });
    },
    async assignTo(p) {
      const siCard = this.assign.card;
      if (!siCard || this.assign.saving) return;
      this.assign.saving = true;
      const save = (participant) =>
        ipcRequest("ori:participant:save", {
          participant: { ...participant, eventId: this.eventId, raceId: this.activeRaceId },
        });
      // pindah kartu: lepas dulu dari pemilik lama (1 SI Card = 1 peserta per jenis)
      if (this.assign.moveFrom) {
        const off = await save({ ...this.assign.moveFrom, siCard: "" });
        if (!off || !off.ok) {
          this.assign.saving = false;
          this.toast((off && off.error) || "Gagal melepas SI Card dari pemilik lama.", "danger", "Gagal");
          return;
        }
      }
      const res = await save({ ...p, siCard: String(siCard) });
      this.assign.saving = false;
      if (!res || !res.ok) {
        this.toast((res && res.error) || "Gagal menyimpan (cek koneksi database).", "danger", "Gagal");
        await this.loadParticipants();
        return;
      }
      this.assign.count += 1;
      this.assign.last = { siCard, name: p.name, className: this.classShort(p.classId).name };
      await this.loadParticipants();
      this.loadResults(); // kartu yg sudah dibaca sebelumnya langsung jadi hasil peserta ini
      if (this.assign.auto && this.participantsWithoutSi.length) this.restartAssign();
      else this.assign.show = false;
    },

    // tabel split satu kategori (urutan = urutan tampil / sort aktif)
    splitRowsOf(c) {
      return buildSplitTable(c.shown, c.controls.length);
    },

    /* ---------- Edit Hasil ---------- */
    openResultEdit(r, cls, focusOrder) {
      const ov = r.override || {};
      const adj = Number(ov.adjustSec) || 0;
      const punches = {};
      (cls.controls || []).forEach((_code, i) => {
        const v = (ov.punches || {})[i + 1] || "";
        punches[i + 1] = { time: v && v !== "OK" ? v : "", ok: v === "OK" };
      });
      this.resEdit = {
        show: true,
        row: r,
        cls,
        saving: false,
        error: "",
        form: {
          start: ov.start || "",
          finish: ov.finish || "",
          adjust: adj ? `${adj < 0 ? "-" : "+"}${formatDuration(Math.abs(adj))}` : "",
          status: ov.status || "",
          note: ov.note || "",
          punches,
        },
      };
      if (focusOrder) {
        this.$nextTick(() =>
          setTimeout(() => {
            const el = document.getElementById(`ori-re-p${focusOrder}`);
            if (el) el.focus();
          }, 300)
        );
      }
    },
    // punch asli kartu utk pos ke-n (sebelum koreksi)
    origPunch(order) {
      const sp = ((this.resEdit.row && this.resEdit.row.autoSplits) || []).find((x) => x.order === order);
      return sp && sp.found ? sp.punchTime : "";
    },
    punchEdited(order) {
      const p = this.resEdit.form.punches && this.resEdit.form.punches[order];
      return !!(p && (p.time || p.ok));
    },
    async saveResultEdit(clear) {
      if (clear) {
        const ok = await this.$bvModal.msgBoxConfirm(
          `Hapus koreksi hasil ${this.resEdit.row.name}? Hasil kembali murni dari SI Card.`,
          { title: "Hapus koreksi", okTitle: "Hapus", cancelTitle: "Batal", okVariant: "danger", centered: true, size: "sm" }
        );
        if (!ok) return;
      }
      this.resEdit.saving = true;
      this.resEdit.error = "";
      const res = await ipcRequest("ori:result:override", {
        participantId: this.resEdit.row.participantId,
        override: clear
          ? null
          : {
              ...this.resEdit.form,
              punches: Object.fromEntries(
                Object.entries(this.resEdit.form.punches || {}).map(([order, p]) => [order, p.time || (p.ok ? "OK" : "")])
              ),
            },
      });
      this.resEdit.saving = false;
      if (!res || !res.ok) {
        this.resEdit.error = (res && res.error) || "Gagal menyimpan (cek koneksi database).";
        return;
      }
      const name = this.resEdit.row.name;
      this.resEdit.show = false;
      await this.loadResults(); // dihitung & diperingkat ulang otomatis
      this.toast(clear ? `Koreksi ${name} dihapus.` : `Hasil ${name} dikoreksi — peringkat diperbarui.`, "success", "Edit Hasil");
    },

    // bendera kecil dari Nationality ("Indonesia", "INA", "MAS", …); tak dikenal -> ""
    flagOf(nationality) {
      return flagUrl(nationality, 40);
    },
    // jam punch SI Card -> HH:MM:SS
    clockHms(v) {
      const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(String(v || ""));
      return m ? `${m[1].padStart(2, "0")}:${m[2]}:${m[3] || "00"}` : "-";
    },

    /* ---------- filter & sort peserta ---------- */
    // klik kolom: naik -> turun -> kembali ke urutan bawaan
    toggleSort(key) {
      if (this.pSort.key !== key) this.pSort = { key, dir: "asc" };
      else if (this.pSort.dir === "asc") this.pSort = { key, dir: "desc" };
      else this.pSort = { key: "", dir: "asc" };
    },
    // klik kolom tab Hasil: naik -> turun -> kembali ke Rank resmi
    toggleResultSort(key) {
      if (this.rSort.key !== key) this.rSort = { key, dir: "asc" };
      else if (this.rSort.dir === "asc") this.rSort = { key, dir: "desc" };
      else this.rSort = { key: "rank", dir: "asc" };
    },
    clearRFilter() {
      this.rFilter = EMPTY_RFILTER();
      this.rSort = { key: "rank", dir: "asc" };
    },
    clearPFilter() {
      this.pFilter = EMPTY_PFILTER();
      this.search = "";
      this.pSort = { key: "", dir: "asc" };
    },

    /* ---------- reset ---------- */
    openResetParticipants(classId) {
      this.resetP = { show: true, classId: classId || "", mode: "delete", running: false };
    },
    async doResetParticipants() {
      this.resetP.running = true;
      const res = await ipcRequest("ori:participants:reset", {
        eventId: this.eventId,
        raceId: this.activeRaceId,
        classId: this.resetP.classId,
        mode: this.resetP.mode,
      });
      this.resetP.running = false;
      if (!res || !res.ok) {
        this.toast((res && res.error) || "Gagal reset (cek koneksi database).", "danger", "Gagal");
        return;
      }
      const d = res.data;
      this.resetP.show = false;
      this.afterReset();
      await this.loadParticipants();
      this.toast(
        d.mode === "si"
          ? `${d.participants} nomor SI Card dikosongkan, ${d.readouts} hasil baca kartu dihapus.`
          : `${d.participants} peserta & ${d.readouts} hasil baca kartu dihapus.`,
        "success",
        "Reset Peserta & SI Card"
      );
    },
    async openResetEvent() {
      this.resetE = { show: true, summary: null, clearClasses: false, confirmText: "", running: false };
      const res = await ipcRequest("ori:event:reset-summary", { eventId: this.eventId });
      if (res && res.ok) this.resetE.summary = res.data;
    },
    async doResetEvent() {
      if (!this.resetEConfirmed) return;
      this.resetE.running = true;
      const res = await ipcRequest("ori:event:reset", { eventId: this.eventId, clearClasses: this.resetE.clearClasses });
      this.resetE.running = false;
      if (!res || !res.ok) {
        this.toast((res && res.error) || "Gagal reset event (cek koneksi database).", "danger", "Gagal");
        return;
      }
      const d = res.data;
      this.resetE.show = false;
      if (d.event) this.event = d.event;
      this.afterReset();
      this.resetClassDraft();
      await this.loadParticipants();
      this.toast(
        `${d.participants} peserta & ${d.readouts} hasil baca kartu dihapus` + (d.clearedClasses ? ", kategori dikosongkan." : "."),
        "success",
        "Reset Event"
      );
    },
    // bersihkan tampilan readout/hasil lokal yang sudah tidak berlaku
    afterReset() {
      this.lastRead = null;
      this.recent = [];
      this.unsaved = [];
      this.resetForm();
      this.results = null;
      this.loadResults();
    },
    toast(msg, variant = "success", title = "Orienteering") {
      if (this.$bvToast) this.$bvToast.toast(msg, { variant, title, solid: true, autoHideDelay: 2500 });
    },

    /* ---------- loading ---------- */
    async reloadAll() {
      this.loading = true;
      this.error = "";
      const ev = await ipcRequest("ori:event:get", { id: this.eventId });
      if (!ev || !ev.ok) {
        this.loading = false;
        this.error = (ev && ev.error) || "Gagal memuat event (cek koneksi database).";
        return;
      }
      this.event = ev.data;
      // segarkan snapshot Live Result (data lama sebelum fitur ini ada)
      ipcRequest("ori:live:publish", { eventId: this.eventId }).catch(() => {});
      this.pickActiveRace();
      await this.loadParticipants();
      this.loading = false;
      this.resetClassDraft();
      if (!this.classes.length) this.tab = "classes";
      else if (!this.participants.length) this.tab = "participants";
      this.loadResults();
    },
    // Jenis aktif: pilihan terakhir operator utk event ini, kalau masih ada.
    pickActiveRace() {
      let saved = "";
      try {
        saved = localStorage.getItem(RACE_KEY(this.eventId)) || "";
      } catch (_e) {
        saved = "";
      }
      const ids = this.races.map((r) => r.id);
      this.activeRaceId = ids.includes(saved) ? saved : ids[0] || "";
    },
    otherRacesFor(c) {
      return this.otherRaces.filter((r) => classAppliesToRace(this.event, c, r.id));
    },
    typeRaceLabel(typeId) {
      const t = this.types.find((x) => x.id === typeId);
      if (!t || !(t.raceIds || []).length || this.races.length < 2) return "";
      return "Hanya " + this.races.filter((r) => t.raceIds.includes(r.id)).map((r) => r.name).join(" & ");
    },
    savedCourse(c, raceId) {
      const saved = this.classes.find((x) => x.id === c.id);
      return saved ? courseOf(saved, raceId) : [];
    },
    // pindah jenis: course yang sedang diedit di tab Kategori & Course
    // terikat ke jenis aktif -> konfirmasi dulu kalau belum disimpan
    async requestRaceChange(id) {
      if (!id || id === this.activeRaceId) return;
      if (this.classDraftDirty && this.$bvModal) {
        const ok = await this.$bvModal.msgBoxConfirm(
          `Perubahan kategori/course untuk ${this.activeRaceName} belum disimpan. Pindah jenis dan buang perubahan?`,
          { title: "Course belum disimpan", okTitle: "Buang & pindah", cancelTitle: "Tetap di sini", okVariant: "danger", centered: true, size: "sm" }
        );
        if (!ok) return;
      }
      this.activeRaceId = id;
      await this.onRaceChange(id);
    },
    async onRaceChange(id) {
      try {
        localStorage.setItem(RACE_KEY(this.eventId), id);
      } catch (_e) {
        /* noop */
      }
      this.lastRead = null;
      this.captureForForm = false;
      this.resetForm();
      this.resetClassDraft();
      this.results = null;
      await this.loadParticipants();
      this.loadResults();
    },
    async loadParticipants() {
      const ps = await ipcRequest("ori:participants:list", { eventId: this.eventId, raceId: this.activeRaceId });
      if (ps && ps.ok) this.participants = ps.data || [];
    },
    async loadResults() {
      this.loadingResults = true;
      const raceId = this.activeRaceId;
      const res = await ipcRequest("ori:results:get", { eventId: this.eventId, raceId });
      if (raceId !== this.activeRaceId) return; // jenis sudah diganti selama menunggu
      this.loadingResults = false;
      if (res && res.ok) this.results = res.data;
    },

    /* ---------- reader ---------- */
    async refreshPorts() {
      try {
        this.ports = await listPorts();
      } catch (_e) {
        this.ports = [];
      }
      if (!this.selectedPath && this.ports.length) this.selectedPath = this.ports[0].path;
    },
    async toggleConnect() {
      if (this.isConnected) {
        if (this.reader) await this.reader.disconnect();
        this.reader = null;
        this.isConnected = false;
        this.captureForForm = false;
        return;
      }
      this.isConnecting = true;
      this.reader = createSportIdentReader({
        onNotify: (type, detail, title) => this.toast(detail, type === "error" ? "danger" : type, title || "SI Reader"),
        onCardDetected: () => {
          this.isReadingCard = true;
        },
        onCardData: (decoded) => {
          this.isReadingCard = false;
          this.onCard(decoded);
        },
        onCardRemoved: () => {
          this.isReadingCard = false;
        },
      });
      try {
        // connect() -> { ok, error? }; pesan error sudah ditampilkan reader
        // sendiri lewat onNotify.
        const res = await this.reader.connect(this.selectedPath);
        this.isConnected = !!(res && res.ok);
        if (!this.isConnected) this.reader = null;
      } catch (err) {
        this.isConnected = false;
        this.reader = null;
        this.toast((err && err.message) || "Gagal terhubung ke reader.", "danger", "SI Reader");
      } finally {
        this.isConnecting = false;
      }
    },
    beep() {
      try {
        new Audio(tone).play();
      } catch (_e) {
        /* noop */
      }
    },
    async onCard(card) {
      this.beep();
      // widget Daftarkan SI Card terbuka -> kartu dipakai utk assign, BUKAN readout
      if (this.assign.show) {
        this.handleAssignCard(card.card_number);
        return;
      }
      if (this.captureForForm) {
        this.captureForForm = false;
        this.form.siCard = String(card.card_number || "");
        this.tab = "participants";
        this.toast(`Nomor SI Card ${card.card_number} terisi.`, "info");
        return;
      }
      await this.saveReadout(card, this.activeRaceId);
    },
    async saveReadout(card, raceId) {
      const res = await ipcRequest("ori:readout:save", { eventId: this.eventId, raceId, card });
      if (!res || !res.ok) {
        this.unsaved.push({ card, raceId });
        this.toast(
          `Hasil kartu ${card.card_number} belum tersimpan: ${(res && res.error) || "database tidak merespons"}. Disimpan sementara — klik "Simpan ulang".`,
          "danger",
          "Gagal menyimpan"
        );
        return false;
      }
      const d = res.data;
      if (raceId !== this.activeRaceId) {
        this.loadResults();
        return true; // tersimpan (simpan ulang) ke jenis lain — tidak ditampilkan di sini
      }
      const entry = {
        key: `${d.readout._id}`,
        at: new Date().toLocaleTimeString("id-ID"),
        siCard: d.siCard,
        unknown: !d.known,
        result: d.result || null,
      };
      this.lastRead = entry;
      this.recent.unshift(entry);
      if (this.recent.length > 30) this.recent.pop();
      this.tab = "readout";
      this.loadResults();
      return true;
    },
    async retryUnsaved() {
      this.retrying = true;
      const queue = this.unsaved.slice();
      this.unsaved = [];
      for (const item of queue) {
        // gagal lagi -> saveReadout() memasukkannya kembali ke `unsaved`
        // eslint-disable-next-line no-await-in-loop
        await this.saveReadout(item.card, item.raceId);
      }
      this.retrying = false;
    },
    registerFromCard(siCard) {
      this.form = { ...EMPTY_FORM(), siCard: String(siCard) };
      this.formError = "";
      this.tab = "participants";
      this.showEntry = true;
      this.$nextTick(() => this.$refs.nameInput && this.$refs.nameInput.focus());
    },

    /* ---------- participants ---------- */
    resetForm() {
      this.form = EMPTY_FORM();
      this.formError = "";
    },
    editParticipant(p) {
      this.form = {
        _id: p._id,
        name: p.name,
        classId: p.classId,
        siCard: p.siCard ? String(p.siCard) : "",
        startNo: p.startNo ? String(p.startNo) : "",
        bib: p.bib || "",
        iofId: p.iofId || "",
        iofRanking: p.iofRanking ? String(p.iofRanking) : "",
        club: p.club || "",
        nationality: p.nationality || "",
        scheduledStart: p.scheduledStart || "",
        manualStatus: p.manualStatus || "",
      };
      this.formError = "";
      this.showEntry = true;
      this.$nextTick(() => {
        const el = this.$refs.entryToggle;
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    async saveParticipant() {
      this.savingParticipant = true;
      this.formError = "";
      const res = await ipcRequest("ori:participant:save", {
        participant: { ...this.form, eventId: this.eventId, raceId: this.activeRaceId },
      });
      this.savingParticipant = false;
      if (!res || !res.ok) {
        this.formError = (res && res.error) || "Gagal menyimpan (cek koneksi database).";
        return;
      }
      const wasEdit = !!this.form._id;
      this.toast(wasEdit ? "Peserta diperbarui." : `${res.data.name} ditambahkan.`);
      const keepClass = this.form.classId;
      this.form = { ...EMPTY_FORM(), classId: wasEdit ? "" : keepClass };
      await this.loadParticipants();
      this.loadResults();
      this.$nextTick(() => this.$refs.nameInput && this.$refs.nameInput.focus());
    },
    async deleteParticipant(p) {
      const ok = await this.$bvModal.msgBoxConfirm(`Hapus peserta "${p.name}" (SI ${p.siCard})?`, {
        title: "Hapus Peserta",
        okTitle: "Hapus",
        cancelTitle: "Batal",
        okVariant: "danger",
        centered: true,
      });
      if (!ok) return;
      const res = await ipcRequest("ori:participant:delete", { id: p._id });
      if (!res || !res.ok) {
        this.toast((res && res.error) || "Gagal menghapus.", "danger", "Gagal");
        return;
      }
      this.participants = this.participants.filter((x) => x._id !== p._id);
      this.loadResults();
    },

    /* ---------- classes ---------- */
    resetClassDraft() {
      // course yang diedit = course jenis aktif (courseOf: cadangan ke
      // `controls` lama utk event sebelum ada jenis)
      this.classDraft = this.classes.map((c) => ({
        id: c.id,
        name: c.name,
        typeId: c.typeId || "",
        courses: c.courses && typeof c.courses === "object" ? { ...c.courses } : {},
        controls: Array.isArray(c.controls) ? c.controls.slice() : [],
        controlsText: courseOf(c, this.activeRaceId).join(", "),
      }));
    },
    addClass(typeId) {
      this.classDraft.push({
        id: `C${Date.now().toString(36)}`,
        name: "",
        typeId: typeId || "",
        courses: {},
        controls: [],
        controlsText: "",
      });
    },
    async removeClass(c) {
      const n = this.participantCountByClass[c.id] || 0;
      if (n) {
        const ok = await this.$bvModal.msgBoxConfirm(
          `Kategori "${c.name || "-"}" masih dipakai ${n} peserta. Hapus? (Peserta tetap ada, tapi perlu dipindah ke kategori lain.)`,
          { title: "Hapus Kategori", okTitle: "Hapus", cancelTitle: "Batal", okVariant: "danger", centered: true }
        );
        if (!ok) return;
      }
      this.classDraft = this.classDraft.filter((x) => x.id !== c.id);
    },
    async saveClasses() {
      const invalid = this.classDraft.find((c) => !c.name.trim());
      if (invalid) {
        this.toast("Setiap kategori wajib punya nama.", "warning", "Belum lengkap");
        return;
      }
      this.savingClasses = true;
      const res = await ipcRequest("ori:classes:save", {
        eventId: this.eventId,
        classes: this.classDraft.map((c) => {
          const codes = parseControls(c.controlsText);
          return {
            id: c.id,
            name: c.name.trim(),
            typeId: c.typeId || "",
            // simpan ke course jenis aktif; event lama tanpa jenis -> controls
            courses: this.activeRaceId ? { ...c.courses, [this.activeRaceId]: codes } : c.courses,
            controls: this.activeRaceId ? c.controls : codes,
          };
        }),
      });
      this.savingClasses = false;
      if (!res || !res.ok) {
        this.toast((res && res.error) || "Gagal menyimpan (cek koneksi database).", "danger", "Gagal");
        return;
      }
      this.event = res.data;
      this.resetClassDraft();
      this.toast("Course tersimpan — hasil dihitung ulang.");
      this.loadResults();
    },

    /* ---------- export ---------- */
    exportExcel() {
      if (!this.results) return;
      const used = new Set();
      const sheets = this.results.classes.map((c, i) => {
        // nama sheet Excel maks 31 karakter & harus unik
        let name = (c.typeName ? `${c.typeName.replace(/ Event$/i, "")} - ${c.className}` : c.className).slice(0, 28);
        if (used.has(name.toUpperCase())) name = `${name.slice(0, 24)} (${i + 1})`;
        used.add(name.toUpperCase());
        return {
        name,
        rows: c.results.map((r) => ({
          Rank: r.rank || "",
          Nama: r.name,
          BIB: r.bib || "",
          Club: r.club || "",
          Nationality: r.nationality || "",
          "SI Card": r.siCard || "",
          "Starting Order": (r.scheduledStart || "").slice(0, 5),
          "Start (SI Card)": r.start || "",
          "Finish (SI Card)": r.finish || "",
          Waktu: r.status === "OK" ? r.time : "",
          Selisih: r.rank && r.behindSec ? "+" + formatDuration(r.behindSec) : "",
          Status: this.statusLabel(r.status),
          "Type Event": c.typeName || "",
          Kategori: c.className,
          "Pos terlewat": (r.missing || []).map((m) => m.code).join(", "),
          Koreksi: r.edited ? r.editNote || "ya" : "",
          // split antar pos: waktu kumulatif & leg tiap pos course
          ...Object.fromEntries(
            (r.splits || []).flatMap((sp) => [
              [`P${sp.order} (${sp.code})`, sp.found === false ? "terlewat" : sp.cumSec !== null ? formatDuration(sp.cumSec) : ""],
              [`Leg ${sp.order}`, sp.legSec !== null && sp.legSec !== undefined ? formatDuration(sp.legSec) : ""],
            ])
          ),
          "Leg Finish": Number.isFinite(r.finishLegSec) ? formatDuration(r.finishLegSec) : "",
        })),
        };
      });
      exportSheetsToExcel(`Hasil ${this.activeRaceName} - ${this.event.name}`, sheets);
    },

    /* ---------- import start list ---------- */
    downloadTemplate() {
      exportRowsToExcel(
        "Template Start List Orienteering",
        [
          {
            Category: "M21E",
            No: 1,
            "Start Time (WIB)": "08:30",
            "Full Name": "Nama Peserta",
            "IOF ID": "57288",
            "Ranking IOF": "",
            BIB: "193",
            Club: "Nama Club",
            Nationality: "Indonesia",
            "Sportident Number": "8199246",
          },
        ].map((row) => {
          const ordered = {};
          IMPORT_COLUMNS.forEach((k) => (ordered[k] = row[k]));
          return ordered;
        }),
        "Start List"
      );
    },
    onImportFile(e) {
      const file = e.target.files && e.target.files[0];
      e.target.value = ""; // supaya file yg sama bisa dipilih lagi
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const wb = XLSX.read(new Uint8Array(reader.result), { type: "array", raw: true });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const raw = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
          const { rows, errors, missingColumns } = normalizeImportRows(raw);
          this.importState = { show: true, fileName: file.name, rows, errors, missing: missingColumns, running: false };
        } catch (err) {
          this.toast("File tidak bisa dibaca: " + ((err && err.message) || err), "danger", "Import gagal");
        }
      };
      reader.readAsArrayBuffer(file);
    },
    async confirmImport() {
      this.importState.running = true;
      const res = await ipcRequest(
        "ori:participants:import",
        { eventId: this.eventId, raceId: this.activeRaceId, rows: this.importState.rows },
        { timeoutMs: 180000 }
      );
      this.importState.running = false;
      if (!res || !res.ok) {
        this.toast((res && res.error) || "Import gagal (database tidak merespons).", "danger", "Import gagal");
        return;
      }
      const r = res.data;
      this.event = r.event;
      this.resetClassDraft();
      this.importState.show = false;
      const parts = [`${r.inserted} peserta baru`, `${r.updated} diperbarui`];
      if (r.createdCategories.length) parts.push(`${r.createdCategories.length} kategori baru`);
      if (r.errors.length) parts.push(`${r.errors.length} gagal`);
      this.toast(`Import ${this.activeRaceName}: ${parts.join(", ")}.`, r.errors.length ? "warning" : "success", "Import selesai");
      if (r.errors.length) {
        this.$bvModal.msgBoxOk(
          r.errors.map((x) => `Baris ${x.rowNo}${x.name ? ` (${x.name})` : ""}: ${x.message}`).join("\n"),
          { title: "Baris yang gagal diimpor", size: "lg", centered: true, bodyClass: "ori-pre" }
        );
      }
      await this.loadParticipants();
      this.loadResults();
    },
  },
};
</script>

<style scoped>
/* Jarak atas/kiri/kanan & lebar maksimum — sama dgn halaman list lain
   (.list-page di list-pages.css: All Events / All Teams). */
.ori-page {
  max-width: 1320px;
  margin: 28px auto 48px;
  padding: 0 24px;
}
.ori-wrap {
  margin-top: 20px;
}
@media (max-width: 767.98px) {
  .ori-page {
    margin-top: 16px;
    padding: 0 14px;
  }
}
.ori-reader {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #fff;
  border: 1px solid #e6edf6;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 12px;
}
.ori-reader.is-on {
  border-color: #b7e4c7;
}
.ori-reader__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: #0f172a;
}
.ori-reader__controls {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ori-port {
  min-width: 220px;
}
.ori-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
}
.ori-pill__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}
.ori-pill--ok {
  background: #e6f7ed;
  color: #1a7f4b;
}
.ori-pill--off {
  background: #f1f5f9;
  color: #64748b;
}
.ori-pill--warn {
  background: #fff7e6;
  color: #b45309;
}
.ori-link {
  border: none;
  background: none;
  color: inherit;
  text-decoration: underline;
  font-weight: 700;
  padding: 0;
  cursor: pointer;
}
.ori-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  background: #f1f5fb;
  border: 1px solid #e6edf6;
  border-radius: 12px;
  padding: 6px;
  margin-bottom: 12px;
}
.ori-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: #425266;
  font-weight: 700;
  font-size: 0.88rem;
  padding: 8px 14px;
  border-radius: 9px;
  cursor: pointer;
}
.ori-tab:hover {
  background: #fff;
  color: #1c4c7a;
}
.ori-tab.active {
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
  color: #fff;
  box-shadow: 0 4px 14px rgba(28, 76, 122, 0.3);
}
.ori-tab__count {
  font-size: 11px;
  background: rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  padding: 0 7px;
}
.ori-tab.active .ori-tab__count {
  background: rgba(255, 255, 255, 0.25);
}
.ori-panel {
  background: #fff;
  border: 1px solid #e6edf6;
  border-radius: 16px;
  padding: 16px;
}
.ori-section-title {
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 8px;
}
.ori-hint {
  display: flex;
  gap: 6px;
  align-items: baseline;
  flex-wrap: wrap;
  background: #f1f7fd;
  border: 1px solid #d6e8f8;
  color: #1e4f7a;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.86rem;
  margin-bottom: 12px;
}
.ori-alert {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  background: #fdf2f4;
  border: 1px solid #f5d0d8;
  color: #9f1239;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.88rem;
  font-weight: 600;
  margin-bottom: 12px;
}
.ori-empty {
  border: 1px dashed #d6e0ec;
  border-radius: 14px;
  padding: 32px 16px;
  text-align: center;
  color: #475569;
  background: #fbfdff;
}
.ori-empty--error {
  color: #b91c3c;
}
.ori-empty__icon {
  font-size: 40px;
  color: #94a3b8;
  margin-bottom: 6px;
}
/* hasil baca kartu */
.ori-result {
  border-radius: 16px;
  padding: 16px;
  border: 2px solid #e6edf6;
  background: #fbfdff;
}
.ori-result--ok {
  border-color: #86efac;
  background: #f0fdf4;
}
.ori-result--bad {
  border-color: #fca5a5;
  background: #fef2f2;
}
.ori-result--warn,
.ori-result--unknown {
  border-color: #fcd34d;
  background: #fffbeb;
}
.ori-result__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.ori-result__status {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #475569;
}
.ori-result--ok .ori-result__status {
  color: #15803d;
}
.ori-result--bad .ori-result__status {
  color: #b91c1c;
}
.ori-result__name {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}
.ori-result__meta {
  color: #475569;
  font-size: 0.9rem;
}
.ori-result__time {
  font-size: 2.4rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #0f172a;
}
.ori-result__missing {
  margin-top: 10px;
  font-weight: 700;
  color: #b91c1c;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.ori-splits {
  margin-top: 12px;
}
.ori-recent,
.ori-class-result {
  margin-top: 16px;
}
/* tabel */
.ori-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.88rem;
  border: 1px solid #e6edf6;
  border-radius: 12px;
  overflow: hidden;
}
.ori-table th {
  background: #1c4c7a;
  color: #fff;
  font-weight: 700;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 8px 10px;
}
.ori-table td {
  padding: 8px 10px;
  border-top: 1px solid #eef2f7;
  font-variant-numeric: tabular-nums;
  background: #fff;
}
.ori-table tbody tr:nth-child(even) td {
  background: #fbfdff;
}
.ori-table--compact td,
.ori-table--compact th {
  padding: 5px 10px;
}
.ori-table tr.is-missing td {
  background: #fef2f2 !important;
  color: #b91c1c;
}
.is-clickable {
  cursor: pointer;
}
.ori-table tbody tr.is-clickable:hover td {
  background: #eef6fd;
}
.ori-type-mini {
  margin-left: 4px;
  font-size: 10.5px;
  font-weight: 700;
  color: #1c4c7a;
  background: #e6f4fd;
  border-radius: 6px;
  padding: 1px 6px;
}
.ori-status {
  white-space: nowrap;
  display: inline-block;
  font-size: 11.5px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 999px;
}
.ori-status--ok {
  background: #dcfce7;
  color: #15803d;
}
.ori-status--bad {
  background: #fee2e2;
  color: #b91c1c;
}
.ori-status--warn {
  background: #fef3c7;
  color: #b45309;
}
.ori-status--muted {
  background: #f1f5f9;
  color: #64748b;
}
.ori-chip {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 8px;
  background: #eef4fb;
  color: #1c4c7a;
  border: 1px solid #d6e4f3;
}
.ori-chip--start {
  background: #1c4c7a;
  color: #fff;
  border-color: #1c4c7a;
}
.ori-chip--bad {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #fecaca;
}
.ori-chip--warn {
  background: #fef3c7;
  color: #b45309;
  border-color: #fde68a;
}
/* form & kelas */
.ori-btn__badge {
  margin-left: 2px;
  padding: 0 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  font-size: 0.75rem;
  line-height: 1.5;
}
.ori-flag {
  width: 18px;
  height: 12px;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.12);
  margin-right: 5px;
  vertical-align: -1px;
}
.ori-view-toggle {
  display: inline-flex;
  border: 1px solid #dde6f1;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}
.ori-view-toggle button {
  border: none;
  background: transparent;
  padding: 5px 12px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.ori-view-toggle button.on {
  background: #1c4c7a;
  color: #fff;
}
.ori-split-wrap {
  overflow-x: auto;
  border-radius: 12px;
}
.ori-split th,
.ori-split td {
  white-space: nowrap;
}
.ori-split__sticky {
  position: sticky;
  z-index: 1;
  background: #fff;
}
.ori-split thead .ori-split__sticky {
  background: #1c4c7a; /* = .ori-table th */
  z-index: 2;
}
.ori-split__rank {
  left: 0;
  min-width: 52px;
}
.ori-split__name {
  left: 52px;
  min-width: 180px;
  box-shadow: 1px 0 0 #e6edf6;
}
.ori-split__code {
  font-weight: 600;
  opacity: 0.75;
}
.ori-split__cell {
  text-align: center;
  font-variant-numeric: tabular-nums;
  min-width: 78px;
}
.ori-split__cum {
  font-weight: 700;
  color: #0f172a;
}
.ori-split__pos {
  font-weight: 500;
  color: #94a3b8;
  font-size: 0.72rem;
}
.ori-split__leg {
  font-size: 0.75rem;
  color: #64748b;
}
.ori-split__lrank {
  display: inline-block;
  min-width: 16px;
  padding: 0 4px;
  margin-left: 2px;
  border-radius: 999px;
  background: #eef2f7;
  color: #475569;
  font-size: 0.68rem;
  font-weight: 800;
}
.ori-split__cell.is-best {
  background: #ecfdf5;
}
.ori-split__cell.is-best .ori-split__leg {
  color: #047857;
  font-weight: 800;
}
.ori-split__cell.is-best .ori-split__lrank {
  background: #10b981;
  color: #fff;
}
.ori-split__cell.is-clickable {
  cursor: pointer;
}
.ori-split__cell.is-clickable:hover {
  box-shadow: inset 0 0 0 2px #93c5fd;
}
.ori-split__cell.is-edited {
  background: #fff7ed;
}
.ori-split__cell.is-missed {
  background: #fef2f2;
}
.ori-split__miss {
  color: #dc2626;
  font-weight: 800;
  font-size: 0.75rem;
}
.ori-pfilter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 10px;
  border: 1px solid #e6edf6;
  border-radius: 12px;
  background: #fbfdff;
}
.ori-pfilter__search {
  flex: 1 1 240px;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 200px;
  height: 44px; /* = tinggi select global */
  padding: 0 12px;
  border: 1px solid #dde6f1;
  border-radius: 10px;
  background: #fff;
  color: #94a3b8;
}
.ori-pfilter__search input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.85rem;
  color: #0f172a;
}
/* select ikut tinggi global .custom-select (44px !important, admin-pages.css) */
.ori-pfilter__sel {
  width: auto;
  max-width: 220px;
  flex: 0 1 auto;
}
.ori-pfilter__meta {
  flex-basis: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8rem;
  color: #64748b;
}
.ori-pfilter__clear {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  padding: 0;
  color: #b91c3c;
  font-weight: 700;
  font-size: 0.8rem;
}
.ori-pfilter__clear:hover {
  text-decoration: underline;
}
.ori-th-sort {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.ori-th-sort__icon {
  opacity: 0.35;
  font-size: 0.9em;
  vertical-align: -1px;
}
.ori-th-sort:hover .ori-th-sort__icon,
.ori-th-sort.is-sorted .ori-th-sort__icon {
  opacity: 1;
}
.ori-crace__hidden {
  margin-top: 8px;
  font-size: 0.82rem;
  color: #64748b;
}
.ori-type-only {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 1px 8px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}
.ori-crace {
  border: 1px solid #cfe3f7;
  background: linear-gradient(135deg, #f2f8ff, #ffffff);
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 10px;
}
.ori-crace__main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.ori-crace__label {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}
.ori-crace__name {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f2d52;
}
.ori-crace__name small {
  font-weight: 600;
  color: #64748b;
}
.ori-crace__races {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.ori-crace__race {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  padding: 7px 12px;
  border-radius: 10px;
  border: 1px solid #dde6f1;
  background: #fff;
  text-align: left;
  font-size: 0.85rem;
  color: #0f172a;
}
.ori-crace__race.active {
  border-color: #1d6fb8;
  box-shadow: 0 0 0 2px rgba(29, 111, 184, 0.15);
}
.ori-crace__race span {
  font-size: 0.75rem;
  font-weight: 700;
}
.ori-crace__race .is-ok {
  color: #047857;
}
.ori-crace__race .is-warn {
  color: #b45309;
}
.ori-class__others {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 6px 0 4px;
}
.ori-class__other {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 6px;
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}
.ori-class__other.is-empty {
  background: #f8fafc;
  color: #94a3b8;
  border-color: #e2e8f0;
}
.ori-entry-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  border: 1px solid #e6edf6;
  border-radius: 12px;
  background: #fbfdff;
  color: #0f172a;
  font-weight: 800;
  font-size: 0.95rem;
  text-align: left;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.ori-entry-toggle:hover {
  background: #f1f6fd;
  border-color: #cfdcec;
}
.ori-entry-toggle.open {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.ori-entry-toggle small {
  color: #64748b;
  font-weight: 600;
}
.ori-entry-toggle__chev {
  color: #64748b;
  font-size: 1.15rem;
}
.ori-entry {
  border: 1px solid #e6edf6;
  border-top: none;
  border-radius: 0 0 12px 12px;
  padding: 12px;
  margin-bottom: 4px;
}
.ori-form {
  background: #fbfdff;
  border: 1px solid #e6edf6;
  border-radius: 12px;
  padding: 14px;
}
.ori-form__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0 12px;
}
.ori-races {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  background: #fff;
  border: 1px solid #e6edf6;
  border-left: 4px solid #10b981;
  border-radius: 14px;
  padding: 10px 14px;
  margin-bottom: 12px;
}
.ori-races__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 800;
  color: #0f172a;
}
.ori-races__hint {
  font-size: 0.82rem;
  color: #64748b;
  margin-left: auto;
}
.ori-import {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px dashed #b9d4ee;
  border-radius: 12px;
  background: #f5faff;
}
.ori-import-sum {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  font-size: 0.86rem;
}
.ori-import-sum > div {
  background: #f8fafc;
  border: 1px solid #e6edf6;
  border-radius: 10px;
  padding: 8px 10px;
}
.ori-type-group {
  border: 1px solid #e6edf6;
  border-radius: 14px;
  padding: 12px;
  margin-bottom: 12px;
}
.ori-type-group__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.ori-type-tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 999px;
  background: #e6f4fd;
  color: #1c4c7a;
  border: 1px solid #bfe3f8;
}
.ori-type-tag--lg {
  font-size: 13px;
  padding: 4px 12px;
}
.ori-type-divider {
  margin: 18px 0 4px;
  padding-bottom: 6px;
  border-bottom: 2px solid #e6f4fd;
}
.ori-btn--light {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.35);
  color: #fff;
}
.ori-btn--light:hover {
  background: rgba(255, 255, 255, 0.24);
}
.ori-si-group {
  grid-column: span 2;
}
.ori-class {
  border: 1px solid #e6edf6;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
  background: #fbfdff;
}
.ori-class__head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.ori-class__name {
  max-width: 220px;
  font-weight: 700;
}
.ori-class__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}
/* tombol */
.ori-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 10px;
  border: 1px solid transparent;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  background: transparent;
}
.ori-btn:disabled {
  opacity: 0.55;
  cursor: default;
}
.ori-btn--primary {
  background: linear-gradient(135deg, #1c4c7a, #2b7fc0);
  color: #fff;
}
.ori-btn--ghost {
  border-color: #dde6f1;
  color: #334155;
  background: #fff;
}
.ori-btn--ghost:hover:not(:disabled) {
  border-color: #9cc3e6;
  color: #1c4c7a;
}
.ori-btn--danger-ghost {
  border-color: #f5d0d8;
  color: #b91c3c;
  background: #fff;
}
.ori-icon-btn {
  border: 1px solid #dde6f1;
  background: #fff;
  color: #334155;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: 4px;
}
.ori-icon-btn--danger {
  color: #b91c3c;
  border-color: #f5d0d8;
}
</style>

<style>
/* Tombol di slot #actions PageHero — slot memakai scope-id PageHero, jadi global. */
.ori-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ori-hero-actions .ori-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-weight: 700;
  font-size: 0.86rem;
  transition: background 0.15s ease;
}
.ori-hero-actions .ori-btn:hover {
  background: rgba(255, 255, 255, 0.26);
}
.ori-hero-actions .ori-btn--light-danger {
  border-color: rgba(254, 202, 202, 0.55);
  color: #fee2e2;
}
.ori-hero-actions .ori-btn--light-danger:hover {
  background: rgba(220, 38, 38, 0.45);
  color: #fff;
}
/* badge & modal Edit Hasil */
.ori-edited {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 1px 7px;
  border-radius: 999px;
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
  white-space: nowrap;
}
.ori-redit-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.ori-redit-orig {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  padding: 10px 12px;
}
.ori-redit-orig__title {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  margin-bottom: 6px;
}
.ori-redit-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.ori-redit-grid small {
  display: block;
  color: #94a3b8;
  font-size: 0.72rem;
}
.ori-redit-grid b {
  font-variant-numeric: tabular-nums;
}
.ori-redit-splits {
  margin-top: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 12px;
  max-height: 320px;
  overflow-y: auto;
}
.ori-redit-stable {
  width: 100%;
  font-size: 0.85rem;
  margin-bottom: 6px;
}
.ori-redit-stable th {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #94a3b8;
  font-weight: 800;
  padding: 4px 6px;
}
.ori-redit-stable td {
  padding: 3px 6px;
  border-top: 1px solid #f1f5f9;
  font-variant-numeric: tabular-nums;
}
.ori-redit-stable tr.is-missed td {
  background: #fef2f2;
}
.ori-redit-stable tr.is-edited td {
  background: #fff7ed;
}
.ori-redit-time {
  max-width: 140px;
}
.ori-redit-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e3a8a;
}
/* modal Daftarkan SI Card (di-teleport ke <body>) */
.ori-asg-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.ori-asg-last {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
  border-radius: 10px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  font-size: 0.9rem;
}
.ori-asg-read {
  text-align: center;
  padding: 18px 8px 8px;
}
.ori-asg-wave {
  width: 92px;
  height: 92px;
  margin: 0 auto 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 54px;
  color: #1d6fb8;
  background: #e8f2fc;
  animation: ori-asg-pulse 1.6s ease-in-out infinite;
}
.ori-asg-wave.off {
  color: #94a3b8;
  background: #f1f5f9;
  animation: none;
}
@keyframes ori-asg-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(29, 111, 184, 0.35); }
  50% { box-shadow: 0 0 0 16px rgba(29, 111, 184, 0); }
}
.ori-asg-title {
  font-weight: 800;
  font-size: 1.1rem;
  color: #0f172a;
}
.ori-asg-manual {
  display: flex;
  gap: 6px;
  max-width: 340px;
  margin: 0 auto;
}
.ori-asg-card {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 10px;
  background: #0f2d52;
  color: #fff;
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: 0.5px;
  font-variant-numeric: tabular-nums;
}
.ori-asg-used .ori-asg-card {
  margin-bottom: 10px;
}
.ori-asg-pick__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.ori-asg-filter {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 6px;
  margin-bottom: 8px;
}
.ori-asg-list {
  max-height: 46vh;
  overflow-y: auto;
  border: 1px solid #e6edf6;
  border-radius: 12px;
}
.ori-asg-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border: none;
  border-bottom: 1px solid #eef2f7;
  background: #fff;
  text-align: left;
}
.ori-asg-item:last-child {
  border-bottom: none;
}
.ori-asg-item:hover:not(:disabled) {
  background: #f0f7ff;
}
.ori-asg-item__cat {
  flex: none;
  min-width: 58px;
  padding: 2px 8px;
  border-radius: 6px;
  background: #eef4fb;
  color: #1e3a5f;
  font-weight: 800;
  font-size: 0.8rem;
  text-align: center;
}
.ori-asg-item__main {
  flex: 1;
  min-width: 0;
}
.ori-asg-item__main b,
.ori-asg-item__main small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ori-asg-item__main small {
  color: #64748b;
}
.ori-asg-item__go {
  color: #1d6fb8;
  font-size: 1.3rem;
}
.ori-asg-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #eef2f7;
}
/* modal reset (di-teleport ke <body>) */
.ori-reset-opt {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 8px;
  cursor: pointer;
}
.ori-reset-opt.on {
  border-color: #f87171;
  background: #fff5f5;
}
.ori-reset-opt input {
  margin-top: 4px;
}
.ori-reset-opt b {
  display: block;
  color: #0f172a;
}
.ori-reset-opt small {
  color: #64748b;
}
.ori-reset-sum {
  padding: 10px 14px;
  border-radius: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 0.9rem;
}
.ori-reset-sum.is-empty {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #64748b;
}
/* Logo/poster di slot #icon PageHero: slot memakai scope-id PageHero, jadi harus global. */
.ori-hero-img {
  display: inline-flex;
  flex: none;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  background: #fff;
}
.ori-hero-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.ori-hero-img.is-logo img {
  object-fit: contain;
  padding: 6px;
}
/* msgBox daftar baris gagal impor (modal di-teleport ke <body>, jadi global) */
.ori-pre {
  white-space: pre-line;
  font-size: 0.86rem;
}
</style>
