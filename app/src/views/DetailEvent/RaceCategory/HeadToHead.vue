<template>
  <div>
    <div class="card-wrapper p-3 mb-2 mt-5 mx-5">
      <!-- TOP BAR (breadcrumb + datetime) -->
      <div
        class="d-flex align-items-center justify-content-between text-muted small"
      >
        <b-breadcrumb class="mb-0">
          <b-breadcrumb-item to="/">
            <Icon icon="mdi:home-outline" class="mr-1" />
            Dashboard
          </b-breadcrumb-item>
          <b-breadcrumb-item
            :to="{ name: 'detail-event', params: { id: $route.params.id } }"
          >
            {{ dataEventSafe.eventName }}
          </b-breadcrumb-item>
          <b-breadcrumb-item active>
            {{ "Head to Head" }}
          </b-breadcrumb-item>
        </b-breadcrumb>
        <div>{{ currentDateTime }}</div>
      </div>
    </div>

    <!-- HERO -->
    <section class="detail-hero">
      <div class="hero-bg"></div>
      <b-container class="hero-inner">
        <b-row class="align-items-center">
          <b-col cols="auto" class="pr-0">
            <div
              class="hero-logo d-flex align-items-center justify-content-center"
            >
              <template v-if="hasEventLogo">
                <img
                  :src="eventLogoUrl"
                  alt="Event Logo"
                  class="event-logo-img"
                />
              </template>
              <template v-else>
                <img
                  :src="defaultImg"
                  alt="Event Logo"
                  class="event-logo-img"
                />
              </template>
            </div>
          </b-col>

          <b-col>
            <h2 class="h1 font-weight-bold mb-1 text-white">
              {{ dataEventSafe.eventName || "-" }}
            </h2>
            <div class="meta text-white-50">
              <span class="mr-3"
                ><strong class="text-white">Location</strong> :
                {{ dataEventSafe.addressCity || "-" }}</span
              >
              <span class="mr-3"
                ><strong class="text-white">River</strong> :
                {{ dataEventSafe.riverName || "-" }}</span
              >
              <span class="mr-3"
                ><strong class="text-white">Level</strong> :
                {{ dataEventSafe.levelName || "-" }}</span
              >
            </div>
          </b-col>
        </b-row>
      </b-container>
    </section>

    <!-- SUBHEADER -->
    <div class="px-4">
      <div class="card-body">
        <b-row>
          <b-col>
            <div class="meta-panel">
              <div class="meta-row">
                <span class="meta-label">Nomor Lomba</span>
                <span class="meta-value">
                  <span class="badge-chip badge-chip--blue">Head to Head</span>
                </span>
              </div>

              <div class="meta-row">
                <span class="meta-label">Categories</span>
                <span
                  class="meta-value badge-chip badge-chip--blue"
                  :title="titleCategories || '-'"
                >
                  {{ titleCategories || "-" }}
                </span>
              </div>

              <div class="meta-row">
                <!-- Select category: pilih Initial dulu, baru Divisi/Race -->
                <div class="h2h-actionbar__select">
                  <div class="switch-label mb-1">
                    Switch Head to Head Category:
                  </div>

                  <div class="init-tabs mb-2" v-if="initials.length">
                    <button
                      v-for="i in initials"
                      :key="i.id"
                      type="button"
                      class="init-tab"
                      :class="{ active: selectedInitialName === i.name }"
                      @click="selectInitialTab(i)"
                    >
                      {{ i.name }}
                    </button>
                  </div>

                  <b-form-group label-for="h2hBucketSelect" class="mb-0">
                    <b-form-select
                      id="h2hBucketSelect"
                      :options="h2hOptionsForSelectedInitial"
                      v-model="selectedH2HKey"
                      @change="onSelectH2HBucket"
                    />
                  </b-form-group>
                </div>
              </div>
            </div>
          </b-col>

          <b-col>
            <div
              class="d-flex flex-wrap justify-content-end align-items-center controls-bar"
            >
              <!-- selector baud -->
              <div class="btn-baud-group mr-2 mb-2">
                <span class="mr-2 text-muted">Baud Rate :</span>
                <div class="d-inline-flex">
                  <button
                    v-for="br in baudOptions"
                    :key="'baud-' + br"
                    type="button"
                    class="btn-action"
                    :class="
                      baudRate === br ? 'btn-success' : 'btn-outline-secondary'
                    "
                    @click="setBaud(br)"
                    :disabled="isPortConnected"
                    style="margin-right: 6px"
                  >
                    {{ br }}
                  </button>
                </div>
              </div>

                            <!-- connect -->
              <button
                type="button"
                :class="{
                  'btn-danger': isPortConnected,
                  'btn-success': !isPortConnected,
                }"
                class="btn-action btn-connect mb-2"
                :disabled="isConnectingPort"
                @click="connectPort"
              >
                <b-spinner small v-if="isConnectingPort" class="mr-1" />
                <Icon v-else icon="ic:baseline-sync" />
                {{
                  isConnectingPort
                    ? isPortConnected
                      ? "Disconnecting..."
                      : "Connecting..."
                    : isPortConnected
                    ? "Disconnect"
                    : "Connect Racetime"
                }}
              </button>

              <span
                class="status-indicator mb-2 ml-2"
                :class="{
                  connected: isPortConnected,
                  disconnected: !isPortConnected,
                }"
              ></span>

              <!-- break line -->
              <div class="w-100"></div>

              <!-- path pill -->
              <div class="mb-1">
                <span
                  class="path-pill"
                  :class="{ 'path-pill--empty': !selectPath }"
                  :title="selectPath || 'No device selected'"
                >
                  <Icon
                    icon="mdi:usb-port"
                    width="16"
                    height="16"
                    class="mr-1"
                  />
                  <span class="truncate">{{
                    selectPath || "No device selected"
                  }}</span>
                </span>
              </div>

            </div>
          </b-col>
        </b-row>
      </div>
    </div>

    <!-- BRACKET -->
    <div class="px-5 mt-2 mb-4">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <div class="racetime-header">
          <h4>
            Bracket Head To Head —
            {{
              currentRound
                ? currentRound.bronze
                  ? "Final B"
                  : currentRound.name
                : "—"
            }}
          </h4>
          <small class="text-muted">
            Category active: {{ titleCategories || "-" }}
          </small>
          <div class="d-flex align-items-center flex-wrap" style="gap: 8px">
            <div v-if="bracketSizeLabel" class="bracket-size-badge">
              {{ bracketSizeLabel }}
            </div>
            <div v-if="byeCountInfo" class="bracket-bye-info-badge">
              <Icon icon="mdi:information-outline" class="mr-1" />
              {{ byeCountInfo }}
            </div>
          </div>
        </div>
        <div class="toolbar-actions">
          <!-- Build / Edit -->
          <div class="toolbar-actions">
            <!-- Kelompok tombol -->
            <div
              class="btn-group-actions"
              role="group"
              aria-label="Build actions"
            >
              <button
                type="button"
                class="btn-action btn-outline-primary"
                @click="openHeatModal"
                v-b-tooltip.hover="'Lihat semua nomor Heat yang sudah terassign di seluruh kategori H2H event ini'"
              >
                <Icon icon="mdi:view-grid-outline" class="mr-1" />
                Lihat Heat
              </button>

              <button
                type="button"
                class="btn-action btn-outline-secondary ml-2"
                :disabled="isDownloadingBracketPdf"
                @click="downloadBracketPdf"
                v-b-tooltip.hover="'Download tampilan bagan saat ini sebagai PDF'"
              >
                <b-spinner v-if="isDownloadingBracketPdf" small class="mr-1" />
                <Icon v-else icon="mdi:file-pdf-box" class="mr-1" />
                {{ isDownloadingBracketPdf ? "Menyiapkan PDF…" : "Download Bracket (PDF)" }}
              </button>

              <button
                v-if="visibleParticipants && visibleParticipants.length"
                class="btn-action btn-outline-info ml-2"
                @click="toggleBracket"
                v-b-tooltip.hover="
                  showBracket ? 'Sembunyikan bracket' : 'Tampilkan bracket'
                "
                aria-controls="h2h-bracket"
                :aria-expanded="showBracket ? 'true' : 'false'"
              >
                <Icon
                  :icon="
                    showBracket ? 'mdi:eye-off-outline' : 'mdi:eye-outline'
                  "
                  class="mr-1"
                />
                {{ showBracket ? "Hide Bracket" : "Show Bracket" }}
              </button>

              <button
                v-if="currentRound && !currentRound.bronze"
                class="btn-action btn-outline-success"
                @click="advanceToNextRound"
                v-b-tooltip.hover="
                  currentRound && currentRound.size === 4
                    ? 'Pemenang lanjut ke Final A, yang kalah otomatis diarahkan ke Final B'
                    : 'Pindahkan semua pemenang babak ini ke babak berikutnya'
                "
              >
                <Icon icon="mdi:arrow-right-bold-circle-outline" class="mr-1" />
                Advance to Next Round
              </button>
            </div>
          </div>

          <!-- Divider -->
          <div class="toolbar-divider d-none d-md-block"></div>

          <!-- Navigation -->
          <div class="round-nav ml-md-3">
            <button
              class="btn-action btn-outline-secondary"
              @click="prevRound"
              v-b-tooltip.hover="'Ronde sebelumnya'"
            >
              Prev
            </button>

            <b-form-select
              v-model="currentRoundIndex"
              :options="roundOptions"
              class="round-select mx-2"
              v-b-tooltip.hover="'Select Round'"
            />

            <button
              class="btn-action btn-outline-secondary"
              @click="nextRound"
              v-b-tooltip.hover="'Ronde berikutnya'"
            >
              Next
            </button>
          </div>

          <!-- Divider -->
          <div class="toolbar-divider d-none d-md-block"></div>

          <!-- Reset All — dipojok paling kanan, terpisah dari aksi build/edit
               lain krn ini destruktif (hapus SEMUA kategori H2H event ini) -->
          <button
            type="button"
            class="btn-action btn-outline-danger ml-md-3"
            @click="openResetAllModal"
            v-b-tooltip.hover="'Hapus semua data kompetisi H2H (semua kategori) pada event ini'"
          >
            <Icon icon="mdi:restore-alert" class="mr-1" />
            Reset All
          </button>
        </div>
      </div>

      <div
        v-if="isLoadingBracket"
        class="bracket-loading d-flex align-items-center justify-content-center py-5"
      >
        <div class="text-center">
          <b-spinner label="Loading" class="mb-2"></b-spinner>
          <div class="text-muted">Loading bracket & teams…</div>
        </div>
      </div>
      <div
        class="bracket-card"
        :class="{ 'pdf-export-mode': isDownloadingBracketPdf }"
        ref="bracketCaptureArea"
      >
        <div
          v-if="showBracket && visibleParticipants && visibleParticipants.length"
          class="bracket-vtb-wrap"
          role="region"
          aria-label="Tournament Bracket"
        >
          <!-- Tim yang belum punya nomor Heat / belum berpasangan — per babak -->
          <div
            v-for="(round, rIdx) in rounds"
            :key="'pool-' + round.id"
            class="bracket__pool"
            v-if="round.pool && round.pool.length"
          >
            <div class="bracket__pool-title">
              <Icon icon="mdi:timer-sand" class="mr-1" />
              {{ round.bronze ? "Final B" : round.name }} — Menunggu Heat
              ({{ round.pool.length }})
            </div>
            <div class="bracket__pool-list">
              <span
                class="bracket__pool-chip"
                v-for="(t, tIdx) in round.pool"
                :key="'pool-' + rIdx + '-' + tIdx"
              >
                {{ t.name }}
                <CountryFlag :code="flagFor(t.name)" />
              </span>
            </div>
          </div>

          <bracket :rounds="vtbRounds">
            <template slot="player" slot-scope="{ player }">
              <span
                v-if="player.isPlaceholder && poolForRound(player.roundId).length"
                class="vtb-team-name is-placeholder vtb-clickable"
                @click="openAssignPicker(player)"
              >
                {{ player.name }}
              </span>
              <span
                v-else-if="!player.isPlaceholder"
                class="vtb-team-name vtb-clickable"
                @click="openRemoveConfirm(player)"
              >
                <span class="vtb-team-name__label"
                  >{{ player.name
                  }}{{ player.bib ? " (" + player.bib + ")" : "" }}
                  <CountryFlag :code="flagFor(player.name)" />
                </span>
                <span v-if="player.time" class="vtb-team-time">{{ player.time }}</span>
                <span v-if="player.medal" class="vtb-medal-badge">
                  <Icon
                    v-if="player.medal !== 'fourth'"
                    :icon="'mdi:medal'"
                    class="vtb-medal-icon"
                    :class="'vtb-medal-icon--' + player.medal"
                    :title="player.medal === 'gold' ? 'Juara 1' : player.medal === 'silver' ? 'Juara 2' : 'Juara 3'"
                  />
                  <span v-else class="vtb-fourth-label" title="Juara 4">4th</span>
                </span>
              </span>
              <span
                v-else
                class="vtb-team-name"
                :class="{ 'is-placeholder': player.isPlaceholder }"
              >
                {{ player.name }}
              </span>
            </template>
            <template slot="player-extension-bottom" slot-scope="{ match }">
              <div
                class="vtb-match-footer"
                :class="{ 'vtb-match-footer--active': isActiveRoundMatch(match) }"
              >
                <span class="vtb-round-badge">{{ match.roundName }}</span>
                <span
                  v-if="isActiveRoundMatch(match)"
                  class="vtb-active-round-badge"
                  title="Match di babak yang sedang aktif (dipilih lewat Prev/Next Round di bawah)"
                >
                  <Icon icon="mdi:target" class="mr-1" />Babak Aktif
                </span>
                <span
                  v-if="match.canDeclareWinner"
                  class="vtb-heat-badge vtb-clickable"
                  :class="{ 'vtb-heat-badge--empty': !match.heat }"
                  @click="openHeatEditor(match)"
                  >{{ match.heat ? "Heat " + match.heat : "+ Tentukan Heat" }}</span
                >
              </div>
            </template>
          </bracket>

          <div v-if="vtbBronzeRounds.length" class="bracket-vtb-bronze mt-4">
            <div class="bracket-vtb-bronze__title">Final B (3rd Place)</div>
            <bracket :rounds="vtbBronzeRounds">
              <template slot="player" slot-scope="{ player }">
                <span
                  v-if="player.isPlaceholder && poolForRound(player.roundId).length"
                  class="vtb-team-name is-placeholder vtb-clickable"
                  @click="openAssignPicker(player)"
                >
                  {{ player.name }}
                </span>
                <span
                  v-else-if="!player.isPlaceholder"
                  class="vtb-team-name vtb-clickable"
                  @click="openRemoveConfirm(player)"
                >
                  <span class="vtb-team-name__label"
                    >{{ player.name
                    }}{{ player.bib ? " (" + player.bib + ")" : "" }}
                    <CountryFlag :code="flagFor(player.name)" />
                  </span>
                  <span v-if="player.time" class="vtb-team-time">{{ player.time }}</span>
                  <span v-if="player.medal" class="vtb-medal-badge">
                    <Icon
                      v-if="player.medal !== 'fourth'"
                      :icon="'mdi:medal'"
                      class="vtb-medal-icon"
                      :class="'vtb-medal-icon--' + player.medal"
                      :title="player.medal === 'gold' ? 'Juara 1' : player.medal === 'silver' ? 'Juara 2' : 'Juara 3'"
                    />
                    <span v-else class="vtb-fourth-label" title="Juara 4">4th</span>
                  </span>
                </span>
                <span
                  v-else
                  class="vtb-team-name"
                  :class="{ 'is-placeholder': player.isPlaceholder }"
                >
                  {{ player.name }}
                </span>
              </template>
              <template slot="player-extension-bottom" slot-scope="{ match }">
                <div
                  class="vtb-match-footer"
                  :class="{ 'vtb-match-footer--active': isActiveRoundMatch(match) }"
                >
                  <span class="vtb-round-badge">{{ match.roundName }}</span>
                  <span
                    v-if="isActiveRoundMatch(match)"
                    class="vtb-active-round-badge"
                    title="Match di babak yang sedang aktif (dipilih lewat Prev/Next Round di bawah)"
                  >
                    <Icon icon="mdi:target" class="mr-1" />Babak Aktif
                  </span>
                  <span
                    v-if="match.canDeclareWinner"
                    class="vtb-heat-badge vtb-clickable"
                    :class="{ 'vtb-heat-badge--empty': !match.heat }"
                    @click="openHeatEditor(match)"
                    >{{ match.heat ? "Heat " + match.heat : "+ Tentukan Heat" }}</span
                  >
                </div>
              </template>
            </bracket>
          </div>
        </div>

        <div
          v-if="!visibleParticipants || !visibleParticipants.length"
          class="bracket-hidden-info"
        >
          <div>
            <Icon icon="mdi:account-off-outline" class="info-icon" />
            <h5 class="mb-1">Belum Ada Tim Terdaftar</h5>
            <p class="mb-0 text-muted">
              Bracket akan muncul otomatis setelah ada tim yang ter-assign di
              kategori H2H ini.
            </p>
          </div>
        </div>

        <div
          v-else-if="!showBracket"
          class="bracket-hidden-info"
        >
          <div>
            <Icon icon="mdi:eye-off-outline" class="info-icon" />
            <h5 class="mb-1">Bracket is Hidden</h5>
            <p class="mb-0 text-muted">
              Gunakan tombol <strong>Show Bracket</strong> untuk menampilkan
              kembali.
            </p>
          </div>
        </div>
      </div>

      <!-- /bracket -->
    </div>

    <!-- Racetime Output -->
    <div class="px-4 mt-4">
      <div class="card-body">
        <div class="py-3" style="display: flex; justify-content: space-between">
          <div class="racetime-header">
            <h4>
              Output Racetime —
              {{
                currentRound
                  ? currentRound.bronze
                    ? "Final B"
                    : currentRound.name
                  : "—"
              }}
            </h4>
            <small class="text-muted">
              Category active: {{ titleCategories || "-" }}
            </small>
          </div>
          <div
            class="h2h-actions-panel d-flex flex-wrap"
            v-if="visibleParticipants && visibleParticipants.length"
          >
            <!-- Scope: babak yang sedang aktif -->
            <div class="h2h-action-group h2h-action-group--round">
              <span class="h2h-action-group__label">Round</span>
              <button
                type="button"
                class="h2h-action-btn"
                :disabled="isPrintingRound"
                @click="printCurrentRoundVuePdf"
                v-b-tooltip.hover="'Print hasil babak yang sedang aktif'"
              >
                <b-spinner v-if="isPrintingRound" small class="mr-1" />
                <Icon v-else icon="mdi:printer-outline" class="mr-1" />
                {{ isPrintingRound ? "Menyiapkan…" : "Print" }}
              </button>
              <button
                type="button"
                class="h2h-action-btn h2h-action-btn--save"
                :disabled="isSavingRound"
                @click="saveCurrentRoundToDB"
                v-b-tooltip.hover="'Simpan hasil babak aktif ke database'"
              >
                <b-spinner v-if="isSavingRound" small class="mr-1" />
                <Icon v-else icon="mdi:content-save-outline" class="mr-1" />
                {{ isSavingRound ? "Menyimpan…" : "Save" }}
              </button>
            </div>

            <!-- Scope: seluruh babak pada kategori ini -->
            <div class="h2h-action-group h2h-action-group--all">
              <span class="h2h-action-group__label">All Rounds</span>
              <button
                type="button"
                class="h2h-action-btn"
                :disabled="isPrintingAllRounds"
                @click="printAllRoundVuePdf"
                v-b-tooltip.hover="'Print seluruh babak sekaligus'"
              >
                <b-spinner v-if="isPrintingAllRounds" small class="mr-1" />
                <Icon v-else icon="mdi:printer-outline" class="mr-1" />
                {{ isPrintingAllRounds ? "Menyiapkan…" : "Print" }}
              </button>
              <button
                type="button"
                class="h2h-action-btn h2h-action-btn--save"
                :disabled="isSavingAllRounds"
                @click="saveAllRoundToDB"
                v-b-tooltip.hover="'Simpan seluruh babak ke database'"
              >
                <b-spinner v-if="isSavingAllRounds" small class="mr-1" />
                <Icon v-else icon="mdi:content-save-outline" class="mr-1" />
                {{ isSavingAllRounds ? "Menyimpan…" : "Save" }}
              </button>
            </div>

            <!-- Scope: ranking overall kategori ini -->
            <div class="h2h-action-group h2h-action-group--overall">
              <span class="h2h-action-group__label">Overall</span>
              <button
                type="button"
                class="h2h-action-btn"
                :disabled="isPrintingOverall"
                @click="printOverallVuePdf"
                v-b-tooltip.hover="'Print ranking overall kategori ini'"
              >
                <b-spinner v-if="isPrintingOverall" small class="mr-1" />
                <Icon v-else icon="mdi:printer-outline" class="mr-1" />
                {{ isPrintingOverall ? "Menyiapkan…" : "Print" }}
              </button>
              <button
                type="button"
                class="h2h-action-btn h2h-action-btn--save"
                :disabled="isSavingOverall"
                @click="saveOverallToDB"
                v-b-tooltip.hover="'Simpan overall kategori ini ke database'"
              >
                <b-spinner v-if="isSavingOverall" small class="mr-1" />
                <Icon v-else icon="mdi:content-save-outline" class="mr-1" />
                {{ isSavingOverall ? "Menyimpan…" : "Save" }}
              </button>
            </div>
          </div>
        </div>
        <b-row>
          <b-col>
            <div
              class="table-wrapper"
              aria-label="Scrollable results table"
              role="region"
            >
              <div
                v-if="isLoadingBracket"
                class="bracket-loading d-flex align-items-center justify-content-center py-5"
              >
                <div class="text-center">
                  <b-spinner label="Loading" class="mb-2"></b-spinner>
                  <div class="text-muted">Loading bracket & teams…</div>
                </div>
              </div>
              <table
                v-else-if="visibleParticipants && visibleParticipants.length"
                class="table"
              >
                <thead>
                  <tr>
                    <th rowspan="2">No</th>
                    <th rowspan="2">Heat</th>
                    <th rowspan="2">Team Name</th>
                    <th rowspan="2">BIB</th>
                    <th rowspan="2">Start Time</th>

                    <!-- Grup Penalties (bisa di-minimize) -->
                    <th
                      :colspan="penaltiesCollapsed ? 1 : 9"
                      class="text-center penalties-group-th"
                      @click="penaltiesCollapsed = !penaltiesCollapsed"
                    >
                      <Icon
                        :icon="
                          penaltiesCollapsed
                            ? 'mdi:chevron-right'
                            : 'mdi:chevron-down'
                        "
                        class="mr-1"
                      />
                      Penalties Group
                    </th>
                    <th rowspan="2">Penalty Total</th>
                    <th class="text-center" rowspan="2">Penalty Time</th>
                    <th class="text-center" rowspan="2">Finish Time</th>
                    <th class="text-center" rowspan="2">Race Time</th>
                    <th class="text-center" rowspan="2">Result</th>
                    <th class="text-center" rowspan="2">Win/Lose</th>
                    <th v-if="editResult" class="text-center" rowspan="2">
                      Action
                    </th>
                  </tr>
                  <tr v-if="!penaltiesCollapsed">
                    <th class="text-center">Pen. Start (PS)</th>
                    <th class="text-center">Cut Line (CL)</th>
                    <th class="text-center">R1</th>
                    <th class="text-center">R2</th>
                    <th class="text-center">L1</th>
                    <th class="text-center">L2</th>
                    <th class="text-center">Pen. Booyan (PB)</th>
                    <th class="text-center">Pen. Finish (PF)</th>
                    <th class="text-center">Pen. Others (PO)</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="(item, index) in visibleParticipants"
                    :key="stableRowKey(item)"
                  >
                    <td>{{ index + 1 }}</td>
                    <!-- Heat kini read-only di sini — assign/ubah Heat
                         dilakukan lewat klik langsung di bagan (klik slot
                         TBD/BYE utk assign tim, klik badge "Heat N" utk
                         ubah nomornya). Kolom ini cuma menampilkan hasilnya. -->
                    <td style="min-width: 110px">
                      <span
                        v-if="isByeTeam(item)"
                        class="badge badge-light"
                        >BYE</span
                      >
                      <span
                        v-else-if="item.result && item.result.heat"
                        class="h2h-heat-readonly"
                      >
                        Heat {{ item.result.heat }}
                      </span>
                      <span v-else class="text-muted small">—</span>
                    </td>

                    <td class="large-bold text-strong max-char text-left">
                      <!-- status pills di atas -->
                      <div class="mb-1">
                        <span
                          v-if="item.result && item.result.flag === 'DNF'"
                          class="badge badge-danger badge-pill"
                        >
                          Did Not Finish
                        </span>
                        <span
                          v-if="item.result && item.result.flag === 'DNS'"
                          class="badge badge-secondary badge-pill"
                        >
                          Did Not Start
                        </span>
                        <span
                          v-if="item.result && item.result.flag === 'DSQ'"
                          class="badge badge-dark badge-pill"
                        >
                          Disqualified
                        </span>
                      </div>

                      <!-- nama tim di bawah -->
                      <div>
                        {{ item.nameTeam }}
                        <CountryFlag :code="flagFor(item.nameTeam)" />
                      </div>
                    </td>
                    <!-- BIB TEAM -->
                    <td class="text-center">{{ item.bibTeam }}</td>

                    <!-- START TIME -->
                    <td class="text-center text-monospace">
                      {{ item.result.startTime }}
                    </td>

                    <!-- Grup Penalties di-minimize -> 1 cell placeholder,
                         kolomnya harus sama dgn colspan="1" di header -->
                    <td v-if="penaltiesCollapsed" class="text-center text-muted">
                      <Icon icon="mdi:dots-horizontal" />
                    </td>

                    <template v-if="!penaltiesCollapsed">
                    <!-- PENALTY START -->
                    <td>
                      <b-form-select
                        class="small-select"
                        v-model.number="item.result.penalties.s"
                        :options="sChoices"
                        text-field="label"
                        value-field="value"
                        size="sm"
                        @change="onPenaltyChange(item)"
                        :disabled="
                          isByeTeam(item) ||
                          ['DNF', 'DNS', 'DSQ'].includes(item.result.flag)
                        "
                      />
                    </td>

                    <!-- PENALTY CL  -->
                    <td>
                      <b-form-select
                        class="small-select"
                        v-model.number="item.result.penalties.cl"
                        :options="clChoices"
                        text-field="label"
                        value-field="value"
                        size="sm"
                        @change="onPenaltyChange(item)"
                        :disabled="
                          isByeTeam(item) ||
                          ['DNF', 'DNS', 'DSQ'].includes(item.result.flag)
                        "
                      />
                    </td>

                    <!-- PENALTY R1 -->
                    <td>
                      <b-form-select
                        class="small-select"
                        v-model="item.result.penalties.r1"
                        :options="ynChoices"
                        text-field="label"
                        value-field="value"
                        size="sm"
                        @change="onPenaltyChange(item)"
                        :disabled="
                          isByeTeam(item) ||
                          ['DNF', 'DNS', 'DSQ'].includes(item.result.flag) ||
                          !showR1
                        "
                      />
                    </td>

                    <!-- PENALTY R2 -->
                    <td>
                      <b-form-select
                        class="small-select"
                        v-model="item.result.penalties.r2"
                        :options="ynChoices"
                        text-field="label"
                        value-field="value"
                        size="sm"
                        @change="onPenaltyChange(item)"
                        :disabled="
                          isByeTeam(item) ||
                          ['DNF', 'DNS', 'DSQ'].includes(item.result.flag) ||
                          !showR2
                        "
                      />
                    </td>

                    <!-- PENALTY L1 -->
                    <td>
                      <b-form-select
                        class="small-select"
                        v-model="item.result.penalties.l1"
                        :options="ynChoices"
                        text-field="label"
                        value-field="value"
                        size="sm"
                        @change="onPenaltyChange(item)"
                        :disabled="
                          isByeTeam(item) ||
                          ['DNF', 'DNS', 'DSQ'].includes(item.result.flag) ||
                          !showL1
                        "
                      />
                    </td>

                    <!-- PENALTY L2 -->
                    <td>
                      <b-form-select
                        class="small-select"
                        v-model="item.result.penalties.l2"
                        :options="ynChoices"
                        text-field="label"
                        value-field="value"
                        size="sm"
                        @change="onPenaltyChange(item)"
                        :disabled="
                          isByeTeam(item) ||
                          ['DNF', 'DNS', 'DSQ'].includes(item.result.flag) ||
                          !showL2
                        "
                      />
                    </td>

                    <!-- PENALTY BOOYAN  -->
                    <td class="text-center">
                      <span
                        :class="{
                          'badge badge-light':
                            item.result.penalties.pb === null,
                          'badge badge-success': item.result.penalties.pb === 0,
                          'badge badge-warning':
                            item.result.penalties.pb === 50,
                          'badge badge-danger':
                            item.result.penalties.pb === 100,
                        }"
                        class="p-3"
                        style="border-radius: 12px"
                      >
                        {{
                          item.result.penalties.pb === null
                            ? "—"
                            : item.result.penalties.pb
                        }}
                      </span>
                    </td>

                    <!-- PENALTY FINISH  -->
                    <td>
                      <b-form-select
                        class="small-select"
                        v-model.number="item.result.penalties.f"
                        :options="fChoices"
                        text-field="label"
                        value-field="value"
                        size="sm"
                        @change="onPenaltyChange(item)"
                        :disabled="
                          isByeTeam(item) ||
                          ['DNF', 'DNS', 'DSQ'].includes(item.result.flag)
                        "
                      />
                    </td>

                    <!-- INPUT PENALTY OTHER  -->
                    <td class="pen-o-cell">
                      <b-form-input
                        :value="getOthersValue(item)"
                        size="xs"
                        style="min-width: 10px; border-radius: 12px"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        placeholder="0"
                        @keypress="digitsOnly($event)"
                        @paste="digitsPaste($event)"
                        @input="onOthersTyping($event, item)"
                        @change="onOthersCommit(item)"
                        :disabled="
                          isByeTeam(item) ||
                          ['DNF', 'DNS', 'DSQ'].includes(item.result.flag)
                        "
                      />
                    </td>
                    </template>

                    <!-- PENALTY TOTAL  -->
                    <td class="large-bold">
                      {{ getTotalPenalty(item) }}
                      <small class="text-muted"
                        >({{ getPenaltyCount(item) }}x)</small
                      >
                    </td>

                    <!-- PENALTY TIME -->
                    <td class="text-center text-monospace penalty-char">
                      {{ item.result.penaltyTime }}
                    </td>

                    <!-- FINISH TIME  -->
                    <td class="text-center text-monospace">
                      {{ item.result.finishTime }}
                    </td>

                    <!-- RACE TIME  -->
                    <td class="text-center large-bold text-monospace">
                      {{ item.result.raceTime }}
                    </td>

                    <!-- RESULT  -->
                    <td
                      class="text-center result-char text-monospace large-bold"
                    >
                      {{
                        item.result.penaltyTime
                          ? item.result.totalTime
                          : item.result.raceTime
                      }}
                    </td>

                    <!-- WIN/LOSE  -->
                    <td class="large-bold text-center">
                      <span
                        v-if="item.result.winLose === 'Win'"
                        class="badge px-3 p-2"
                        style="
                          background-color: gold;
                          color: black;
                          border-radius: 12px;
                        "
                      >
                        🏆 WIN
                      </span>
                      <span
                        v-else-if="item.result.winLose === 'Lose'"
                        class="badge badge-secondary px-4 py-2"
                        style="border-radius: 12px"
                      >
                        LOSE
                      </span>
                      <span v-else>
                        {{ item.result.winLose || "" }}
                      </span>
                    </td>

                    <!-- ACTION BUTTON  -->
                    <td v-if="editResult">
                      <div class="d-flex" style="gap: 6px; flex-wrap: wrap">
                        <b-button
                          size="sm"
                          class="btn-action-racetime"
                          variant="outline-danger"
                          @click="markFlag(item, 'DNF')"
                          :disabled="isByeTeam(item)"
                          >DNF</b-button
                        >
                        <b-button
                          size="sm"
                          class="btn-action-racetime"
                          variant="outline-warning"
                          @click="markFlag(item, 'DNS')"
                          :disabled="isByeTeam(item)"
                          >DNS</b-button
                        >
                        <b-button
                          size="sm"
                          class="btn-action-racetime"
                          variant="outline-dark"
                          @click="markFlag(item, 'DSQ')"
                          :disabled="isByeTeam(item)"
                          >DSQ</b-button
                        >
                        <b-button
                          size="sm"
                          class="btn-action-racetime"
                          variant="outline-secondary"
                          @click="resetRow(item)"
                          :disabled="isByeTeam(item)"
                          >RESET</b-button
                        >
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- EMPTY STATE -->
              <EmptyCard v-else />
            </div>
            <br />
          </b-col>
        </b-row>
      </div>
    </div>

    <!-- OPERATION TIME (shared component) -->
    <OperationTimePanel
      v-if="visibleParticipants && visibleParticipants.length"
      :digit-id="digitId"
      :digit-time="digitTime"
      :participant="visibleParticipants"
      :bye-names="byeTeamNamesInCurrentRound"
      :digit-time-start.sync="digitTimeStart"
      :digit-time-finish.sync="digitTimeFinish"
      @update-time="updateTime"
    />

    <div class="ml-5 mt-4">
      <b-button @click="goTo" variant="outline-info" class="btn-action">
        <Icon icon="ic:baseline-keyboard-double-arrow-left" />Back
      </b-button>
    </div>

    <br /><br />

    <vue-html2pdf
      v-if="pdfMode !== 'round' || (pdfRoundRows && pdfRoundRows.length)"
      v-show="true"
      ref="html2Pdf"
      :show-layout="false"
      :float-layout="false"
      :enable-download="true"
      :preview-modal="false"
      :manual-pagination="true"
      :pdf-quality="2"
      :filename="pdfFilename"
      pdf-format="a4"
      pdf-orientation="landscape"
      pdf-content-width="100%"
      style="
        opacity: 0;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: auto;
        z-index: -1;
        pointer-events: none;
      "
      @pdfGenerated="onPdfGeneratedS1"
    >
      <template slot="pdf-content">
        <!-- MODE: ROUND -->
        <section v-if="pdfMode === 'round'">
          <HeadToHeadPdfResult
            :pdfMode="'round'"
            :pdfRound="pdfRound"
            :pdfRoundRows="pdfRoundRows"
            :dataEventSafe="dataEventSafe"
            :categories="titleCategories"
            :isOfficial="false"
            :headToHeadCats="headToHeadCats"
            :countryMap="_teamCountryMap"
          />
        </section>

        <!-- MODE: ALL ROUND -->
        <section v-else-if="pdfMode === 'allround'">
          <HeadToHeadPdfResult
            :pdfMode="'allround'"
            :pdfOverallPkg="pdfOverallPkg"
            :dataEventSafe="dataEventSafe"
            :categories="titleCategories"
            :isOfficial="false"
            :headToHeadCats="headToHeadCats"
            :countryMap="_teamCountryMap"
          />
        </section>

        <!-- MODE: OVERALL -->
        <section v-else-if="pdfMode === 'overall'">
          <HeadToHeadPdfResult
            :pdfMode="'overall'"
            :pdfOverallPkg="pdfOverallPkg"
            :dataEventSafe="dataEventSafe"
            :categories="titleCategories"
            :isOfficial="false"
            :headToHeadCats="headToHeadCats"
            :countryMap="_teamCountryMap"
          />
        </section>
      </template>
    </vue-html2pdf>

    <!-- MODAL: pilih tim utk slot TBD/BYE yang diklik langsung di bagan.
         Pakai modal (bukan dropdown) karena bagan dibungkus container
         overflow-x:auto utk scroll horizontal — dropdown BootstrapVue tidak
         di-teleport ke <body>, jadi akan ke-clip/salah posisi di dalam
         container yang overflow-nya bukan visible. Modal aman krn selalu
         di-teleport ke <body>. -->
    <b-modal
      v-model="assignPicker.show"
      centered
      hide-header
      hide-footer
      size="sm"
      content-class="h2h-picker-modal"
      body-class="p-0"
    >
      <!-- TIDAK menanyakan nomor Heat di sini — kalau slotnya masih kosong,
           tim ditaruh dulu tanpa Heat pasti (bisa jadi cuma BYE, tidak perlu
           nomor Heat). Nomor Heat diatur/diubah lewat klik badge "Heat N" di
           footer match (lihat openHeatEditor) — bukan di sini. -->
      <div class="h2h-picker-header">
        <div class="h2h-picker-header__text">
          <div class="h2h-picker-header__title">Pilih Tim</div>
          <div class="h2h-picker-header__subtitle">
            Klik salah satu tim untuk assign ke slot ini
          </div>
        </div>
        <button
          type="button"
          class="h2h-picker-close"
          aria-label="Tutup"
          @click="assignPicker.show = false"
        >
          <Icon icon="mdi:close" />
        </button>
      </div>
      <div class="h2h-picker-body">
        <div v-if="!assignPickerCandidates.length" class="h2h-picker-empty">
          <Icon icon="mdi:information-outline" class="mr-1" />
          Tidak ada tim yang menunggu di pool babak ini.
        </div>
        <button
          v-for="t in assignPickerCandidates"
          :key="'picker-' + t.name"
          type="button"
          class="h2h-picker-item"
          @click="confirmAssignTeam(t)"
        >
          <CountryFlag :code="flagFor(t.name)" />
          <span class="h2h-picker-item__name"
            >{{ t.name }}{{ t.bibTeam ? " (" + t.bibTeam + ")" : "" }}</span
          >
          <Icon icon="mdi:chevron-right" class="h2h-picker-item__chevron" />
        </button>
      </div>
    </b-modal>

    <!-- MODAL: ubah nomor Heat sebuah match — dipicu klik badge "Heat N" di
         footer bagan. Ini SATU-SATUNYA tempat nomor Heat ditentukan/diubah
         utk match riil (2 tim); tidak tersedia utk match BYE karena BYE
         tidak perlu nomor Heat. -->
    <b-modal
      v-model="heatEditor.show"
      centered
      hide-header
      hide-footer
      size="sm"
      content-class="h2h-picker-modal"
      body-class="p-0"
    >
      <div class="h2h-picker-header">
        <div class="h2h-picker-header__text">
          <div class="h2h-picker-header__title">Ubah Nomor Heat</div>
          <div class="h2h-picker-header__subtitle">
            Tentukan nomor Heat baru untuk match ini
          </div>
        </div>
        <button
          type="button"
          class="h2h-picker-close"
          aria-label="Tutup"
          @click="heatEditor.show = false"
        >
          <Icon icon="mdi:close" />
        </button>
      </div>
      <div class="h2h-picker-body h2h-heat-editor-body">
        <div class="h2h-heat-stepper">
          <button
            type="button"
            class="h2h-heat-stepper__btn"
            @click="heatEditor.newHeat = Math.max(1, (heatEditor.newHeat || 1) - 1)"
          >
            <Icon icon="mdi:minus" />
          </button>
          <input
            type="number"
            min="1"
            class="h2h-heat-stepper__input"
            v-model.number="heatEditor.newHeat"
          />
          <button
            type="button"
            class="h2h-heat-stepper__btn"
            @click="heatEditor.newHeat = (heatEditor.newHeat || 0) + 1"
          >
            <Icon icon="mdi:plus" />
          </button>
        </div>
        <div class="h2h-heat-editor-actions">
          <button
            type="button"
            class="btn-action btn-outline-secondary"
            @click="heatEditor.show = false"
          >
            Batal
          </button>
          <button
            type="button"
            class="btn-action btn-primary"
            @click="confirmHeatEditor"
          >
            Simpan
          </button>
        </div>
      </div>
    </b-modal>

    <!-- MODAL: Heat Assignment (seluruh kategori Head to Head di event ini) -->
    <b-modal
      v-model="heatModalVisible"
      size="xl"
      scrollable
      hide-footer
      content-class="heat-modal"
    >
      <template #modal-header>
        <h5 class="modal-title">Heat Assignment – Head to Head</h5>
        <div class="d-flex align-items-center" style="gap: 8px">
          <button
            type="button"
            class="btn-action btn-outline-secondary"
            :disabled="isDownloadingHeatModalPdf"
            @click="downloadHeatAssignmentPdf"
            v-b-tooltip.hover="'Download daftar Heat Assignment ini sebagai PDF'"
          >
            <b-spinner v-if="isDownloadingHeatModalPdf" small class="mr-1" />
            <Icon v-else icon="mdi:file-pdf-box" class="mr-1" />
            {{ isDownloadingHeatModalPdf ? "Menyiapkan PDF…" : "Download PDF" }}
          </button>
          <button
            type="button"
            class="close"
            aria-label="Tutup"
            @click="heatModalVisible = false"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </template>

      <div ref="heatModalCaptureArea">
        <div v-if="!heatModalGroups.length" class="text-center text-muted py-4">
          Belum ada nomor Heat yang terassign di kategori Head to Head manapun
          pada event ini.
        </div>
        <div v-else>
          <div
            v-for="group in heatModalGroups"
            :key="group.heat"
            class="heat-group mb-3"
          >
            <div class="heat-group__title">Heat {{ group.heat }}</div>
            <table class="table table-sm heat-group__table mb-0">
              <thead>
                <tr>
                  <th style="width: 40px">#</th>
                  <th style="width: 26%">Tim</th>
                  <th class="text-left" style="width: 90px">Bib</th>
                  <th class="text-left">Kategori (Divisi Race – Initial)</th>
                  <th style="width: 140px">Babak</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(t, idx) in group.teams" :key="idx">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ t.nameTeam || "-" }}</td>
                  <td class="text-left">{{ t.bibTeam || "-" }}</td>
                  <td class="text-left">{{ t.category }}</td>
                  <td>{{ t.round || "-" }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </b-modal>

    <!-- MODAL: konfirmasi Reset All (seluruh kategori Head to Head di event ini) -->
    <b-modal
      v-model="showResetAllModal"
      title="Reset All - Head to Head"
      centered
      no-close-on-backdrop
      :no-close-on-esc="resetAllInProgress"
      hide-footer
      @hidden="onResetAllModalHidden"
    >
      <p class="mb-2">
        Tindakan ini akan <strong>menghapus semua data kompetisi Head to
        Head</strong> — bracket, hasil per-babak, dan skor overall H2H — utk
        <strong>SELURUH kategori H2H</strong> (semua kombinasi divisi/race/
        initial) pada event ini.
      </p>
      <p class="mb-2">
        Semua tim akan kembali ke pool Round 1 tanpa nomor Heat, seperti
        kondisi sebelum ada hasil sama sekali. Kategori lain (Sprint/Slalom/
        DRR/Rafting Cross) <strong>tidak</strong> ikut terhapus.
      </p>
      <p class="mb-3">
        Tindakan ini <strong>tidak dapat dibatalkan</strong>.
      </p>

      <b-form-group v-if="!resetAllInProgress">
        <label class="small text-muted mb-1">
          Ketik <strong>{{ RESET_ALL_CONFIRM_PHRASE }}</strong> untuk konfirmasi:
        </label>
        <b-form-input
          v-model="resetAllConfirmText"
          :placeholder="RESET_ALL_CONFIRM_PHRASE"
          autocomplete="off"
          @keyup.enter="confirmResetAll"
        />
      </b-form-group>
      <div v-else class="text-center text-muted py-3">
        <b-spinner small class="mr-2" />
        Mereset semua kategori H2H...
      </div>

      <div class="d-flex justify-content-end" style="gap: 8px">
        <b-button
          variant="outline-secondary"
          :disabled="resetAllInProgress"
          @click="showResetAllModal = false"
        >
          Batal
        </b-button>
        <b-button
          variant="danger"
          :disabled="
            resetAllConfirmText !== RESET_ALL_CONFIRM_PHRASE || resetAllInProgress
          "
          @click="confirmResetAll"
        >
          Reset All
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import OperationTimePanel from "@/components/race/OperationTeamPanel.vue";
import EmptyCard from "@/components/cards/card-empty.vue";
import defaultImg from "@/assets/images/default-second.jpeg";
import logoSts from "@/assets/images/logo-sts.png";
import HeadToHeadPdfResult from "../ResultComponent/head-to-head-pdfResult.vue";
import { logger } from "@/utils/logger";
import VueHtml2pdf from "vue-html2pdf";
import { Icon } from "@iconify/vue2";
import { getSocket } from "@/services/socket";
import tone from "../../../assets/tone/tone_message.mp3";
import CountryFlag from "@/components/common/CountryFlag.vue";
import teamFlagMixin from "@/mixins/teamFlagMixin";
import serialPortMixin from "@/mixins/serialPortMixin";
import Bracket from "vue-tournament-bracket";
// html2canvas + jspdf: sudah pasti ada di node_modules krn jadi dependency
// transitif vue-html2pdf (lewat html2pdf.js) yang sudah dipakai project ini —
// dipakai langsung (bukan lewat vue-html2pdf) krn kita mau capture bagan
// LIVE apa adanya (heat badge, highlight menang/kalah, dll.) tanpa perlu
// duplikat seluruh markup bagan ke slot pdf-content terpisah.
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// NEW: key penyimpanan hasil per-babak
const RESULTS_KEY_PREFIX = "h2hRoundResults:";
const SHOW_BRACKET_KEY = "h2h:ui:showBracket";

function safeParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

// gabungkan kunci unik berdasar bucket (event/initial/race/division)
function getResultsRootKey() {
  const b = getBucket();
  if (!b.eventId || !b.initialId || !b.raceId || !b.divisionId) return null;
  return (
    RESULTS_KEY_PREFIX +
    [b.eventId, b.initialId, b.raceId, b.divisionId].join("|")
  );
}

// NEW: helper baca/tulis ke localStorage
function readAllRoundResults(rootKey) {
  try {
    return JSON.parse(localStorage.getItem(rootKey) || "{}");
  } catch {
    return {};
  }
}
function writeAllRoundResults(rootKey, obj) {
  localStorage.setItem(rootKey, JSON.stringify(obj || {}));
}

/** ===== helpers: baca payload baru dari localStorage ===== */
const RACE_PAYLOAD_KEY = "raceStartPayload";
function getBucket() {
  try {
    const raw = localStorage.getItem(RACE_PAYLOAD_KEY);
    const obj = JSON.parse(raw || "{}");
    const b = obj.bucket || {};
    return {
      eventId: String(b.eventId || ""),
      initialId: String(b.initialId || ""),
      raceId: String(b.raceId || ""),
      divisionId: String(b.divisionId || ""),
      eventName: String(b.eventName || "").toUpperCase(),
      initialName: String(b.initialName || "").toUpperCase(),
      raceName: String(b.raceName || "").toUpperCase(),
      divisionName: String(b.divisionName || "").toUpperCase(),
    };
  } catch {
    return {
      eventId: "",
      initialId: "",
      raceId: "",
      divisionId: "",
      eventName: "",
      initialName: "",
      raceName: "",
      divisionName: "",
    };
  }
}

function normalizeTeamForH2H(t = {}) {
  const base = {
    teamId: String(t.teamId || ""),
    nameTeam: String(t.nameTeam || ""),
    bibTeam: String(t.bibTeam || ""),
    startOrder: String(t.startOrder || ""),
    praStart: String(t.praStart || ""),
    intervalRace: String(t.intervalRace || ""),
    statusId: Number.isFinite(t.statusId) ? Number(t.statusId) : 0,
  };

  const emptyRes = {
    startTime: "",
    finishTime: "",
    raceTime: "",
    penaltyTime: "00:00:00.000",
    penalty: 0,
    penalties: { s: 0, cl: 0, r1: 0, r2: 0, l1: 0, l2: 0, pb: 0, f: 0 },
    totalTime: "",
    ranked: "",
    score: "",
    winLose: null,
    /** NEW */
    heat: null,
  };

  // dukung format lama (array result)
  let result = t.result;
  if (Array.isArray(result)) result = result[0] || {};
  if (!result || typeof result !== "object") result = {};
  result = { ...emptyRes, ...result };

  let otr = t.otr;
  if (!otr || typeof otr !== "object") otr = {};
  otr = { ...emptyRes, ...otr };

  return { ...base, result, otr };
}

function loadRaceStartPayloadForH2H() {
  let obj = {};
  try {
    obj = JSON.parse(localStorage.getItem(RACE_PAYLOAD_KEY) || "{}");
  } catch {
    obj = {};
  }
  const b = obj.bucket || {};
  const bucket = {
    eventId: String(b.eventId || ""),
    initialId: String(b.initialId || ""),
    raceId: String(b.raceId || ""),
    divisionId: String(b.divisionId || ""),
    eventName: String(b.eventName || "").toUpperCase(),
    initialName: String(b.initialName || "").toUpperCase(),
    raceName: String(b.raceName || "").toUpperCase(),
    divisionName: String(b.divisionName || "").toUpperCase(),
    teams: Array.isArray(b.teams) ? b.teams.map(normalizeTeamForH2H) : [],
  };
  return { bucket };
}

export default {
  name: "SustainableTimingSystemH2HRace",
  components: {
    OperationTimePanel,
    EmptyCard,
    VueHtml2pdf,
    HeadToHeadPdfResult,
    Icon,
    CountryFlag,
    Bracket,
  },
  mixins: [teamFlagMixin, serialPortMixin],
  data() {
    return {
      pdfMode: "round",
      pdfFilename: "Report.pdf",
      pdfRound: null,
      pdfRoundRows: [],
      pdfOverallPkg: null,
      defaultImg,
      isLoadingBracket: false,
      isLoadingTableList: false,
      selfSocketId: null,
      initSocket: null,
      endGame: false,
      isScrolled: false,
      showBracket: true,
      heatModalVisible: false,
      heatModalGroups: [],
      showResetAllModal: false,
      // grup kolom Penalties (PS/CL/R1/R2/L1/L2/PB/PF/PO) di tabel hasil bisa
      // di-minimize — klik header "Penalties Group" utk toggle.
      penaltiesCollapsed: false,
      isDownloadingBracketPdf: false,
      isDownloadingHeatModalPdf: false,
      // BUG FIX: tombol Print/Save (Round/All Round/Overall) dulu tidak
      // py pengaman apa pun terhadap klik ganda/beruntun — Save memakai
      // ipcRenderer.once(`${channel}-reply}`) TANPA request-id (beda dgn
      // saveBracketToDB() yg sudah py __reqId), jadi 2 klik cepat ke
      // tombol Save yang SAMA bisa membuat balasan permintaan pertama
      // "tertangkap" oleh listener permintaan kedua (atau sebaliknya) —
      // notifikasi salah/dobel, atau upsertEventResultsH2H() ke-trigger
      // dobel. Print pun bisa tumpang tindih (generatePdf() dipanggil lagi
      // sebelum proses render sebelumnya selesai, isi pdfMode/pdfRound...
      // masih dipakai bersama 1 komponen vue-html2pdf). Flag ini menahan
      // klik kedua selagi proses pertama masih berjalan.
      isSavingRound: false,
      isSavingAllRounds: false,
      isSavingOverall: false,
      isPrintingRound: false,
      isPrintingAllRounds: false,
      isPrintingOverall: false,
      // state modal "pilih tim" saat slot kosong di bagan diklik — tim
      // ditaruh LANGSUNG ke slot (matchIndex + side) ini, TANPA Heat apa pun.
      assignPicker: { show: false, roundId: null, matchIndex: null, side: null },
      // state modal ubah nomor Heat, dipicu klik badge "Heat N"/"+ Tentukan
      // Heat" di bagan — SATU-SATUNYA tempat operator menentukan sendiri
      // nomor Heat, dan hanya tersedia utk match riil (2 tim, bukan BYE).
      heatEditor: { show: false, roundId: null, matchIndex: null, newHeat: null },
      resetAllConfirmText: "",
      resetAllInProgress: false,
      RESET_ALL_CONFIRM_PHRASE: "RESET H2H",
      h2hBucketOptions: [],
      h2hBucketMap: Object.create(null),
      selectedH2HKey: "",
      // Initial (Youth/Junior/Open dll) yang sedang dipilih di tab "Switch
      // Head to Head Category" — dropdown di bawahnya cuma menampilkan
      // kombinasi Divisi/Race milik Initial ini, mengikuti pola Sprint.
      selectedInitialName: "",
      currentBucket: null,
      roundResultsRootKey: null,
      booyanActive: { r1: false, r2: false, l1: false, l2: false },
      sChoices: [],
      fChoices: [],
      clChoices: [],
      ynChoices: [],
      podium: {
        gold: null, // Juara 1
        silver: null, // Juara 2
        bronze: null, // Juara 3
        fourth: null, // Juara 4
      },
      currentRoundIndex: -1,
      rounds: [],
      showBronze: true,
      editForm: "",
      editResult: false,
      dataPenalties: [],
      dataScore: [],
      // score utk tim dgn rank di luar daftar dataScore (Race Settings ->
      // H2H -> Score by Rank -> "Score utk Rank N+ dan seterusnya").
      h2hDefaultScoreBeyondRank: 0,
      isRankedDescending: false,

      /** penting: tipe konsisten */
      participant: [],
      dataEvent: {},
      titleCategories: "",
    };
  },

  computed: {
    // Mapping this.rounds (struktur internal app) -> format yang dipahami
    // vue-tournament-bracket ({games:[{player1,player2}]}). Bronze/Final B
    // TIDAK ikut di sini — komponen bracket ini mengasumsikan tiap babak
    // punya PERSIS separuh jumlah match babak sebelumnya (pohon eliminasi
    // murni), sedangkan Final B bukan bagian dari pohon itu, jadi
    // dirender terpisah lewat vtbBronzeRounds.
    vtbRounds() {
      return (this.rounds || [])
        .filter((r) => !r.bronze)
        .map((r) => {
          const expected = Math.max(1, Math.floor((r.size || 2) / 2));
          const games = [];
          for (let i = 0; i < expected; i++) {
            games.push(this._toVtbGame((r.matches || [])[i], r, i));
          }
          return { games };
        });
    },
    vtbBronzeRounds() {
      const bronze = (this.rounds || []).find((r) => r.bronze);
      if (!bronze) return [];
      return [{ games: [this._toVtbGame((bronze.matches || [])[0], bronze, 0)] }];
    },

    // Kombinasi Divisi/Race (mis. "R4 MEN") milik Initial yang sedang aktif
    // saja — labelnya tidak perlu lagi menyertakan nama Initial karena sudah
    // dipilih lewat tab di atasnya.
    h2hOptionsForSelectedInitial() {
      const opts = this.h2hBucketOptions || [];
      if (!this.selectedInitialName) return opts;
      const target = String(this.selectedInitialName).toUpperCase();
      return opts
        .filter((o) => {
          const b = this.h2hBucketMap[o.value];
          return b && String(b.initialName).toUpperCase() === target;
        })
        .map((o) => {
          const b = this.h2hBucketMap[o.value];
          return {
            value: o.value,
            text: `${b.divisionName} ${b.raceName}`,
          };
        });
    },
    headToHeadCats() {
      const payload = safeParse(
        localStorage.getItem("raceStartPayload") || "{}",
        {}
      );
      const b = payload.bucket || {};
      const q = this.$route.query || {};
      return {
        // urutan sesuai permintaan: Initial, Race, Division
        initial: b.initialName || q.initialName || "-",
        race: b.raceName || q.raceName || "-",
        division: b.divisionName || q.divisionName || "-",
      };
    },
    hasEventLogo() {
      var ev = this.dataEventSafe || {};
      var logos = ev.eventFiles;
      if (Array.isArray(logos) && logos.length > 0) {
        // string URL langsung atau objek { url: '...' }
        var first = logos[0];
        if (typeof first === "string" && first) return true;
        if (
          first &&
          typeof first === "object" &&
          typeof first.url === "string" &&
          first.url
        )
          return true;
      }
      return false;
    },
    eventLogoUrl() {
      var ev = this.dataEventSafe || {};
      var logos = ev.eventFiles;
      if (Array.isArray(logos) && logos.length > 0) {
        var first = logos[0];
        if (typeof first === "string") return first;
        if (first && typeof first === "object" && typeof first.url === "string")
          return first.url;
      }
      return "";
    },
    showR1() {
      return !!this.booyanActive.r1;
    },
    showR2() {
      return !!this.booyanActive.r2;
    },
    showL1() {
      return !!this.booyanActive.l1;
    },
    showL2() {
      return !!this.booyanActive.l2;
    },
    activeBooyanCount() {
      return ["r1", "r2", "l1", "l2"].reduce(
        (n, k) => n + (this.booyanActive[k] ? 1 : 0),
        0
      );
    },
    currentDateTime() {
      const d = new Date();
      return (
        d.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
        " | " +
        d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      );
    },
    currentEventId() {
      var fromEvent = "";
      if (
        this.dataEventSafe &&
        (this.dataEventSafe._id || this.dataEventSafe.id)
      ) {
        fromEvent = String(this.dataEventSafe._id || this.dataEventSafe.id);
      }

      var fromRoute = "";
      if (this.$route && this.$route.params && this.$route.params.id) {
        fromRoute = String(this.$route.params.id);
      }

      var fromBucket = "";
      var bucket = getBucket();
      if (bucket && bucket.eventId) {
        fromBucket = String(bucket.eventId);
      }

      return fromEvent || fromRoute || fromBucket || "";
    },

    divisions() {
      if (
        this.dataEventSafe &&
        Array.isArray(this.dataEventSafe.categoriesDivision)
      ) {
        return this.dataEventSafe.categoriesDivision.map(function (d) {
          return { id: String(d.value), name: String(d.name) };
        });
      }
      return [];
    },

    races() {
      if (
        this.dataEventSafe &&
        Array.isArray(this.dataEventSafe.categoriesRace)
      ) {
        return this.dataEventSafe.categoriesRace.map(function (r) {
          return { id: String(r.value), name: String(r.name) };
        });
      }
      return [];
    },

    initials() {
      if (
        this.dataEventSafe &&
        Array.isArray(this.dataEventSafe.categoriesInitial)
      ) {
        return this.dataEventSafe.categoriesInitial.map(function (i) {
          return { id: String(i.value), name: String(i.name) };
        });
      }
      return [];
    },
    storedResultsByRound() {
      // baca semua yang sudah dipersist ke localStorage untuk bucket saat ini
      if (!this.roundResultsRootKey) return {};
      const all = readAllRoundResults(this.roundResultsRootKey) || {};
      // bentuk: { "R1": { roundName: "Round of 16", items:[...] }, ... }
      const map = {};
      (this.rounds || []).forEach((r) => {
        const roundId = String(r.id);
        const items = Array.isArray(all[roundId]) ? all[roundId] : [];
        map[roundId] = {
          roundName: r.bronze ? "Final B" : r.name,
          items,
        };
      });
      return map;
    },
    penaltyChoices() {
      // opsi untuk semua dropdown penalty (S, CL, R1, R2, L1, L2, PB, F)
      // ambil dari dataPenalties supaya satu sumber data
      return (this.dataPenalties || []).map((p) => ({
        value: Number(p.value) || 0,
        text: `${p.label} (${p.value}s)`,
      }));
    },
    participantArr() {
      return Array.isArray(this.participant)
        ? this.participant
        : Object.values(this.participant || {});
    },
    // Label "BAGAN X TIM" sesuai jumlah tim terdaftar di kategori aktif —
    // mengikuti penamaan resmi di app/BAGAN HEAD TO HEAD CLEAR.pdf.
    bracketSizeLabel() {
      const t = (this.participantArr || []).length;
      return t > 0 ? `BAGAN ${t} TIM` : "";
    },
    // Info jumlah BYE yang seharusnya ada di Round 1 (selisih ukuran bagan
    // vs jumlah tim terdaftar) — MURNI informasi, operator tetap yang
    // menentukan sendiri tim mana dapat Heat solo (BYE) lewat dropdown Heat
    // di tabel, tidak ada saran/otomatisasi tim mana.
    byeCountInfo() {
      const t = (this.participantArr || []).length;
      if (t < 3) return "";
      const n = this.nextPow2(Math.min(Math.max(t, 4), 32));
      const numByes = n - t;
      if (numByes <= 0) return "";
      return `${numByes} tim akan dapat BYE (bagan ${n} slot)`;
    },
    // tim yang tampil di modal "Pilih Tim" saat slot TBD/BYE di bagan diklik
    assignPickerCandidates() {
      return this.poolForRound(this.assignPicker.roundId);
    },
    // nama tim yang BYE di babak aktif — dipakai utk disable tombol BIB
    // start/finish di OperationTimePanel (tim BYE tidak pernah balapan).
    byeTeamNamesInCurrentRound() {
      const r = this.currentRound;
      if (!r || !r.matches) return [];
      const names = [];
      r.matches.forEach((m) => {
        if (!m || !m.bye) return;
        const n1 = m.team1 && m.team1.name;
        const n2 = m.team2 && m.team2.name;
        if (n1 && !n2) names.push(n1);
        else if (n2 && !n1) names.push(n2);
      });
      return names;
    },
    dataEventSafe() {
      return this.dataEvent && typeof this.dataEvent === "object"
        ? this.dataEvent
        : {};
    },
    firstRoundIndex() {
      // indeks ronde kompetitif paling awal (size terbesar, bukan bronze)
      let idx = -1,
        maxSize = -1;
      (this.rounds || []).forEach((r, i) => {
        if (!r.bronze && r.size > maxSize) {
          maxSize = r.size;
          idx = i;
        }
      });
      return idx;
    },

    // NEW: opsi dropdown babak (ikut urutan this.rounds)
    roundOptions() {
      return (this.rounds || []).map((r, i) => ({
        value: i,
        text: r.bronze ? "Final B" : r.name,
      }));
    },

    // NEW: ambil round aktif (null-safe)
    currentRound() {
      const i = this.currentRoundIndex;
      return i >= 0 && i < (this.rounds || []).length ? this.rounds[i] : null;
    },

    // NEW: tim (nama) yang tampil pada babak aktif → array of strings (nama tim)
    // termasuk tim yang masih menunggu dipasangkan (round.pool), supaya mereka
    // tetap muncul di tabel hasil & bisa diberi nomor Heat sebelum berpasangan
    teamsInCurrentRound() {
      const r = this.currentRound;
      if (!r) return [];
      const names = [];
      (r.pool || []).forEach((t) => {
        const n = t && (t.name || t.nameTeam || t.teamName);
        if (n) names.push(String(n));
      });
      (r.matches || []).forEach((m) => {
        if (m.team1 && m.team1.name) names.push(String(m.team1.name));
        if (m.team2 && m.team2.name) names.push(String(m.team2.name));
      });
      // unik
      return Array.from(new Set(names));
    },

    // NEW: participant yang “terlihat” = hanya mereka yang ada di babak aktif
    visibleParticipants() {
      const want = new Set(
        this.teamsInCurrentRound.map(function (n) {
          return n.toUpperCase();
        })
      );
      const list = this.participantArr.filter(function (p) {
        const nm = String(p.nameTeam || p.teamName || "").toUpperCase();
        return nm && want.has(nm);
      });

      // placeholder jika belum ada di participant
      if (want.size && list.length < want.size) {
        const existing = new Set(
          list.map(function (p) {
            return String(p.nameTeam || p.teamName || "").toUpperCase();
          })
        );
        this.teamsInCurrentRound.forEach(function (n) {
          const up = n.toUpperCase();
          if (!existing.has(up))
            list.push(this.normalizeTeamForViewPlaceholder(n));
        }, this);
      }

      const orderMap = this.buildHeatOrderPosMapFromBracket();

      // Urutan tabel ikut POSISI SLOT di bagan (top-to-bottom match index)
      // supaya baris tabel & kartu bagan selalu sinkron sama persis —
      // heat TIDAK dipakai sbg kunci sort lagi krn sekarang cuma label
      // manual (bisa berapa saja, tidak berurutan sesuai posisi bagan), dan
      // tim BYE sengaja tidak punya Heat sama sekali (akan selalu ke bawah
      // kalau heat dipakai sbg kunci utama, padahal posisinya di bagan bisa
      // di atas).
      list.sort(function (a, b) {
        var nameA = String(
          (a && (a.nameTeam || a.teamName)) || ""
        ).toUpperCase();
        var nameB = String(
          (b && (b.nameTeam || b.teamName)) || ""
        ).toUpperCase();

        var recA = orderMap[nameA];
        var recB = orderMap[nameB];
        var slotA =
          recA && typeof recA.slot !== "undefined"
            ? recA.slot
            : Number.POSITIVE_INFINITY;
        var slotB =
          recB && typeof recB.slot !== "undefined"
            ? recB.slot
            : Number.POSITIVE_INFINITY;

        if (slotA !== slotB) return slotA - slotB;

        var posA = recA && typeof recA.pos !== "undefined" ? recA.pos : 9; // team1=0, team2=1
        var posB = recB && typeof recB.pos !== "undefined" ? recB.pos : 9;

        if (posA !== posB) return posA - posB;
        return nameA.localeCompare(nameB);
      });

      return list;
    },
  },

  watch: {
    rounds: {
      deep: true,
      handler() {
        this.computePodium();
      },
    },
    currentRoundIndex() {
      this.computePodium();
      this.loadRoundResultsForCurrentRound();
      this.computeWinLoseByHeat(); // << tambah
    },
    showBracket(val) {
      localStorage.setItem(SHOW_BRACKET_KEY, val ? "1" : "0");
    },
  },

  beforeRouteLeave(to, from, next) {
    // JANGAN clearAllRoundResults() di sini — itu menghapus cache lokal
    // (roundResultsRootKey) tanpa syarat setiap kali user pindah halaman,
    // termasuk saat hasil penalty/waktu yang baru diinput BELUM sempat
    // diklik "Save Round"/"Save All Rounds"/"Save Overall". Cache-nya sudah
    // ter-scope per bucket (division/race/initial) lewat roundResultsRootKey,
    // jadi aman dibiarkan tersimpan — akan otomatis termuat lagi lewat
    // loadRoundResultsForCurrentRound() saat user kembali ke bucket ini.
    next();
  },

  async mounted() {
    const saved = localStorage.getItem(SHOW_BRACKET_KEY);
    if (saved !== null) this.showBracket = saved === "1";

    // event details
    try {
      const evRaw = localStorage.getItem("eventDetails");
      this.dataEvent = evRaw ? JSON.parse(evRaw) : {};
    } catch {
      this.dataEvent = {};
    }

    // PENTING: tipe di database tersimpan sbg "HEADTOHEAD" (tanpa underscore)
    // — sama seperti catatan di loadDataPenalties() di bawah. Mengirim
    // "HEAD_TO_HEAD" tidak pernah cocok dgn dokumen manapun di optionRanked,
    // jadi dataScore selalu kosong dan SEMUA Score di Overall selalu 0
    // (getScoreByRanked() jatuh ke defaultScoreBeyondRank, yg default-nya 0)
    // kecuali event ini kebetulan sudah dikustomisasi lewat Race Settings.
    await this.loadDataScore("HEADTOHEAD");
    await this.loadDataPenalties();
    await this.loadRaceSettings();

    // build opsi statik dari kategori event (fallback ke default bila kosong)
    this.buildStaticH2HOptions();

    // pilih default & fetch teams via DB
    if (this.h2hBucketOptions.length) {
      const savedKey = localStorage.getItem("currentH2HBucketKey");
      this.selectedH2HKey =
        savedKey && this.h2hBucketMap[savedKey]
          ? savedKey
          : this.h2hBucketOptions[0].value;

      await this.fetchH2HBucketTeamsByKey(this.selectedH2HKey);
      const loadedFromDB = await this.tryLoadBracketFromDB();
      if (!loadedFromDB) {
        // hanya bangun bracket kosong dari awal kalau memang belum ada
        // bracket tersimpan di DB — supaya bracket yang sudah dipasangkan
        // lewat Heat tidak tertimpa setiap kali halaman ini dibuka ulang
        const n = Math.min(Math.max(this.participantArr.length || 8, 4), 32);
        this.rebuildBracketDynamic(n);
        // auto-seed dari ranking Sprint DINONAKTIFKAN atas permintaan user —
        // Heat Round 1 diisi manual oleh operator lewat dropdown, sama
        // seperti babak2 berikutnya.
      }
      this.syncWinLoseFromBracketToParticipants();
    } else {
      // fallback: baca seluruh bucket H2H dari eventDetails (mode offline)
      await this.loadAllH2HBucketsFromEvent();
      const n = Math.min(Math.max(this.participantArr.length || 8, 4), 32);
      this.rebuildBracketDynamic(n);
      this.syncWinLoseFromBracketToParticipants();
    }

    this.roundResultsRootKey = getResultsRootKey();
    this.loadRoundResultsForCurrentRound();
    this.computeWinLoseByHeat();

    this.fetchBooyanActiveFromSettings();

    // ====== SOCKET INIT & LISTENERS (Judges Dashboard realtime) ======
    try {
      const socket = getSocket();
      this.initSocket = socket;

      const isSameEvent = (m) => {
        const cur = this.currentEventId ? String(this.currentEventId) : "";
        const ev = m && m.eventId ? String(m.eventId) : "";
        return !cur || !ev ? true : cur === ev;
      };

      const onConnect = () => {
        this.selfSocketId = socket && socket.id ? socket.id : null;
      };
      socket.on("connect", onConnect);

      const onMessage = async (raw) => {
        const msg = raw || {};

        if (
          msg.senderId &&
          this.selfSocketId &&
          msg.senderId === this.selfSocketId
        )
          return;
        if (!isSameEvent(msg)) return;

        if (this.$bvToast && msg.text) {
          try {
            new Audio(tone).play();
          } catch {
            // abaikan gagal play audio
          }
          this.$bvToast.toast(
            (msg.from ? msg.from : "Realtime") + ": " + msg.text,
            {
              title: "Pesan Realtime",
              variant: "success",
              solid: true,
            }
          );
        }

        await this.applyPenaltyFromSocketH2H(msg);
      };

      socket.on("custom:event", onMessage);

      this.$once("hook:beforeDestroy", () => {
        if (this.initSocket) {
          this.initSocket.off("connect", onConnect);
          this.initSocket.off("custom:event", onMessage);
        }
      });
    } catch (err) {
      if (logger && logger.warn) logger.warn("socket init failed:", err);
    }
  },

  methods: {
    scoreForRank(rank) {
      if (!rank || !Number.isFinite(+rank)) return 0;
      const s = this.getScoreByRanked ? this.getScoreByRanked(+rank) : null;
      return Number.isFinite(+s) ? +s : 0;
    },
    _teamKey(name, bib) {
      return String(name || "").toUpperCase() + "|" + String(bib || "");
    },
    _timeMsFromRow(row) {
      // prioritas total, fallback race
      const t = row && (row.total || row.race) ? row.total || row.race : "";
      // kamu sudah punya _parseTimeMs; kalau mau pakai itu, ganti di sini
      return this._parseTimeMs ? this._parseTimeMs(t) : this.parsesTime(t);
    },
    buildOverallPlacingsFromLastRound() {
      const rounds = this.rounds || [];
      if (!rounds.length) return [];

      const final = this.getFinalRound && this.getFinalRound();
      const bronze = this.getBronzeRound && this.getBronzeRound();

      const top4 = [];
      const top4Keys = new Set();

      const teamKey = (name, bib) =>
        String(name || "").toUpperCase() + "|" + String(bib || "");

      const timeMsFromRow = (row) => {
        const t = row && (row.total || row.race) ? row.total || row.race : "";
        return this._parseTimeMs ? this._parseTimeMs(t) : this.parsesTime(t);
      };

      // ---- Final A → #1 & #2
      if (final && final.matches && final.matches[0]) {
        const fm = final.matches[0];
        const t1 = fm.team1 && fm.team1.name ? fm.team1.name : "";
        const t2 = fm.team2 && fm.team2.name ? fm.team2.name : "";

        const finalRows = this.buildRoundRows(final);
        const findRow = (nm) =>
          finalRows.find(
            (r) => String(r.team).toUpperCase() === String(nm).toUpperCase()
          ) || null;

        if (fm.winner && fm.winner.name) {
          const winner = fm.winner.name;
          const loser = (winner === t1 ? t2 : t1) || "";

          const rwW = findRow(winner);
          const rwL = findRow(loser);

          const kW = teamKey(winner, rwW ? rwW.bib : "");
          const kL = teamKey(loser, rwL ? rwL.bib : "");

          if (winner) {
            top4.push({
              place: 1,
              name: winner,
              bib: rwW ? rwW.bib : "",
              source: "FinalA",
              timeMs: timeMsFromRow(rwW),
            });
            top4Keys.add(kW);
          }
          if (loser) {
            top4.push({
              place: 2,
              name: loser,
              bib: rwL ? rwL.bib : "",
              source: "FinalA",
              timeMs: timeMsFromRow(rwL),
            });
            top4Keys.add(kL);
          }
        }
      }

      // ---- Final B (Bronze) → #3 & #4
      if (bronze && bronze.matches && bronze.matches[0]) {
        const bm = bronze.matches[0];
        const t1 = bm.team1 && bm.team1.name ? bm.team1.name : "";
        const t2 = bm.team2 && bm.team2.name ? bm.team2.name : "";

        const bronzeRows = this.buildRoundRows(bronze);
        const findRow = (nm) =>
          bronzeRows.find(
            (r) => String(r.team).toUpperCase() === String(nm).toUpperCase()
          ) || null;

        if (bm.winner && bm.winner.name) {
          const winner = bm.winner.name; // #3
          const loser = (winner === t1 ? t2 : t1) || ""; // #4

          const rwW = findRow(winner);
          const rwL = findRow(loser);

          const kW = teamKey(winner, rwW ? rwW.bib : "");
          const kL = teamKey(loser, rwL ? rwL.bib : "");

          if (winner && !top4Keys.has(kW)) {
            top4.push({
              place: 3,
              name: winner,
              bib: rwW ? rwW.bib : "",
              source: "FinalB",
              timeMs: timeMsFromRow(rwW),
            });
            top4Keys.add(kW);
          }
          if (loser && !top4Keys.has(kL)) {
            top4.push({
              place: 4,
              name: loser,
              bib: rwL ? rwL.bib : "",
              source: "FinalB",
              timeMs: timeMsFromRow(rwL),
            });
            top4Keys.add(kL);
          }
        }
      }

      // ---- Tim lainnya: pakai LAST ROUND REACHED
      const lastRowByTeam = new Map(); // key → { row, roundIdx, roundId, roundName }

      for (let ri = 0; ri < rounds.length; ri++) {
        const r = rounds[ri];
        if (r && r.bronze) continue; // bronze sudah diambil untuk top4

        const rows = this.buildRoundRows(r);
        rows.forEach((row) => {
          const key = teamKey(row.team, row.bib);
          if (top4Keys.has(key)) return;

          const prev = lastRowByTeam.get(key);
          if (!prev || ri > prev.roundIdx) {
            lastRowByTeam.set(key, {
              row,
              roundIdx: ri,
              roundId: r.id,
              roundName: r.name,
            });
          }
        });
      }

      const others = Array.from(lastRowByTeam.values()).map((v) => ({
        name: v.row.team,
        bib: v.row.bib,
        sourceRoundId: String(v.roundId),
        sourceRoundName: v.roundName,
        timeMs: timeMsFromRow(v.row),
        roundIdx: v.roundIdx,
      }));

      // Urut “others”: waktu tercepat → duluan
      others.sort((a, b) => {
        const ta = Number.isFinite(a.timeMs)
          ? a.timeMs
          : Number.POSITIVE_INFINITY;
        const tb = Number.isFinite(b.timeMs)
          ? b.timeMs
          : Number.POSITIVE_INFINITY;
        if (ta !== tb) return ta - tb;
        // (opsional) kalau mau: yang tersingkir di babak lebih akhir → lebih atas
        // if (a.roundIdx !== b.roundIdx) return b.roundIdx - a.roundIdx;
        return String(a.name).localeCompare(String(b.name));
      });

      // Gabungkan jadi overallRows + hitung score dari ranking final
      const overall = [];

      // 1..4 (top4)
      top4
        .sort((a, b) => a.place - b.place)
        .forEach((x) => {
          overall.push({
            ranked: x.place,
            name: x.name,
            bib: x.bib,
            score: this.scoreForRank(x.place), // ← skor dari this.dataScore
            _source: x.source,
          });
        });

      // 5..N (others)
      let rank = 5;
      others.forEach((o) => {
        overall.push({
          ranked: rank,
          name: o.name,
          bib: o.bib,
          score: this.scoreForRank(rank), // ← skor dari this.dataScore
          _source: o.sourceRoundName,
        });
        rank++;
      });

      return overall;
    },
    // ---- BRACKET SAVE/LOAD ----
    _currentBucketOrThrow() {
      const b = getBucket();
      const must = ["eventId", "initialId", "raceId", "divisionId"];
      const miss = must.filter((k) => !b[k]);
      if (miss.length) throw new Error("Missing bucket: " + miss.join(", "));
      return b;
    },

    buildBracketDoc() {
      const bucket = this._currentBucketOrThrow();
      return {
        bucket: {
          eventId: bucket.eventId,
          initialId: bucket.initialId,
          raceId: bucket.raceId,
          divisionId: bucket.divisionId,
          eventName: "HEAD2HEAD",
          initialName: bucket.initialName,
          raceName: bucket.raceName,
          divisionName: bucket.divisionName,
        },
        rounds: (this.rounds || []).map((r) => JSON.parse(JSON.stringify(r))),
        showBronze: !!this.showBronze,
        settings: { booyanActive: { ...this.booyanActive } },
      };
    },

    // `silent`: lewati toast notify — dipakai auto-save di assignTeamToMatchSlot()/
    // removeTeamFromMatchSlot()/renumberMatchHeat() supaya tiap aksi tidak memicu toast "Bracket tersimpan."
    // bertubi-tubi; tombol "Save Round (DB)" tetap pakai mode normal (toast).
    async saveBracketToDB(silent = false) {
      try {
        const payload = this.buildBracketDoc();
        // __reqId dikirim & digemakan balik oleh main process supaya balasan
        // ini bisa dicocokkan ke request-nya sendiri — saveBracketToDB() bisa
        // terpanggil beruntun (heat berubah, advance round, dst.) tanpa
        // menunggu satu sama lain, dan semuanya berbagi channel balasan yang
        // sama, jadi ipcRenderer.once() polos bisa salah tangkap balasan.
        const reqId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        payload.__reqId = reqId;
        const handler = (_e, res) => {
          if (!res || res.__reqId !== reqId) return;
          ipcRenderer.removeListener("h2h:bracket:save-reply", handler);
          if (silent) return;
          if (res && res.ok) {
            this.notify("success", "Bracket tersimpan.", "Saved");
          } else {
            this.notify("error", (res && res.error) || "Save failed", "Failed");
          }
        };
        ipcRenderer.on("h2h:bracket:save-reply", handler);
        ipcRenderer.send("h2h:bracket:save", payload);
      } catch (err) {
        if (!silent) this.notify("error", String(err), "Failed");
      }
    },

    async tryLoadBracketFromDB() {
      const bucket = this._currentBucketOrThrow();
      return new Promise((resolve) => {
        ipcRenderer.send("h2h:bracket:get", bucket);
        ipcRenderer.once("h2h:bracket:get-reply", (_e, res) => {
          if (res && res.ok && res.item && Array.isArray(res.item.rounds)) {
            // pakai bracket dari DB
            this.rounds = res.item.rounds;
            this.showBronze = !!res.item.showBronze;
            // optional restore settings
            if (res.item.settings && res.item.settings.booyanActive) {
              this.booyanActive = { ...res.item.settings.booyanActive };
            }
            // set currentRoundIndex ke ronde kompetitif paling awal
            this.currentRoundIndex = this.firstRoundIndex;
            this.computePodium();
            this.syncWinLoseFromBracketToParticipants();
            // BUG FIX: JANGAN persistRoundResults() di sini — this.participant
            // di titik ini masih hasil reset polos dari _useH2HBucket() (belum
            // di-merge dengan data tersimpan di localStorage, itu baru terjadi
            // belakangan lewat loadRoundResultsForCurrentRound() yang dipanggil
            // caller). Kalau tetap dipanggil, snapshot round yang SUDAH ADA di
            // localStorage (heat & waktu yang sudah diisi operator) langsung
            // KETIMPA data kosong/default — persis penyebab heat/waktu "hilang"
            // saat switch kategori atau refresh. loadRoundResultsForCurrentRound()
            // sendiri tidak butuh persist ulang di sini; ia akan menyimpan lagi
            // secara wajar begitu ada aksi baru (assign Heat/isi waktu).
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    },

    _parseTimeMs: function (t) {
      if (!t) return Number.POSITIVE_INFINITY;
      var parts = String(t).split(":");
      var h = parseInt(parts[0] || "0", 10);
      var m = parseInt(parts[1] || "0", 10);
      var sPart = String(parts[2] || "0");
      var s = parseInt(sPart.split(".")[0] || "0", 10);
      var ms = parseInt(sPart.split(".")[1] || "0", 10);
      return ((h * 60 + m) * 60 + s) * 1000 + ms;
    },

    sortRowsByRankThenTime: function (rows) {
      if (!Array.isArray(rows)) return rows;
      var copy = rows.slice(0);
      copy.sort(
        function (a, b) {
          var ra = a && a.ranked ? Number(a.ranked) : null;
          var rb = b && b.ranked ? Number(b.ranked) : null;

          var aHas = ra !== null && isFinite(ra) && ra > 0;
          var bHas = rb !== null && isFinite(rb) && rb > 0;

          if (aHas && bHas && ra !== rb) return ra - rb;
          if (aHas && !bHas) return -1;
          if (!aHas && bHas) return 1;

          // tie-break pakai total time lalu race time
          var ta = this._parseTimeMs(
            a && a.total ? a.total : a && a.race ? a.race : ""
          );
          var tb = this._parseTimeMs(
            b && b.total ? b.total : b && b.race ? b.race : ""
          );
          if (ta !== tb) return ta - tb;

          // terakhir: No (jika ada)
          var na = a && a.no ? Number(a.no) : Number.POSITIVE_INFINITY;
          var nb = b && b.no ? Number(b.no) : Number.POSITIVE_INFINITY;
          return na - nb;
        }.bind(this)
      );

      // re-number kolom No setelah di-sort
      for (var i = 0; i < copy.length; i++) {
        copy[i].no = i + 1;
      }
      return copy;
    },
    getOverallPackage() {
      return this.buildOverallPackage();
    },
    onPdfGeneratedS1() {
      try {
        ipcRenderer &&
          ipcRenderer.send("get-alert", {
            type: "success",
            detail: "PDF Slalom Session 1 telah berhasil diunduh.",
            message: "Download Selesai",
          });
      } catch (err) {
        logger.warn("❌ Failed to update race settings:", err);
      }
    },
    // === GETTER DATA ===
    // BUG FIX: `p.result` adalah SATU object yang dipakai bersama lintas
    // SEMUA babak (cuma menyimpan data babak yang SEDANG aktif/dimuat).
    // buildRoundRows() dulu SELALU baca live p.result langsung, yang benar
    // HANYA kalau roundObj === currentRound — dipanggil utk babak LAIN (lihat
    // buildAllRoundsPackage()/buildOverallPackage()/
    // buildOverallPlacingsFromLastRound(), dipakai Save All Round & Save
    // Overall) hasilnya jadi data babak yang SALAH (ke-timpa data babak yang
    // kebetulan sedang dibuka di layar). Sekarang: kalau roundObj BUKAN
    // currentRound, baca dari SNAPSHOT localStorage round itu sendiri (sama
    // pola dgn _teamResultTimeFromSnapshot() di bagan). Heat SELALU diambil
    // dari round.matches (sumber kebenaran per-babak, tidak pernah bocor
    // lintas babak) — bukan dari live/snapshot result.heat.
    buildRoundRows(roundObj) {
      const list = this.participantsForRound(roundObj);
      const isCurrentRound = !!(
        this.currentRound &&
        roundObj &&
        this.currentRound.id === roundObj.id
      );

      let snapshotByName = null;
      if (!isCurrentRound && this.roundResultsRootKey && roundObj) {
        const all = readAllRoundResults(this.roundResultsRootKey);
        const savedRows = Array.isArray(all[String(roundObj.id)])
          ? all[String(roundObj.id)]
          : [];
        snapshotByName = new Map(
          savedRows.map((row) => [
            String(row.nameTeam || "").trim().toUpperCase(),
            row.result || {},
          ])
        );
      }

      const heatByName = new Map();
      (roundObj.matches || []).forEach((m) => {
        if (!m) return;
        [m.team1, m.team2].forEach((t) => {
          if (t && t.name) {
            heatByName.set(
              String(t.name).trim().toUpperCase(),
              m.bye ? null : m.heat != null ? m.heat : null
            );
          }
        });
      });

      return list.map((p, i) => {
        const nameKey = String(p.nameTeam || p.teamName || "")
          .trim()
          .toUpperCase();
        const r = isCurrentRound
          ? p.result || {}
          : (snapshotByName && snapshotByName.get(nameKey)) || {};
        const heat = heatByName.has(nameKey)
          ? heatByName.get(nameKey)
          : r.heat != null
          ? r.heat
          : null;

        return {
          no: i + 1,
          team: String(p.nameTeam || p.teamName || ""),
          bib: String(p.bibTeam || ""),
          heat,
          start: r.startTime || "",
          finish: r.finishTime || "",
          race: r.raceTime || "",
          penaltyTime: r.penaltyTime || "00:00:00.000",
          total: r.totalTime || r.raceTime || "",
          penaltySum: this.getTotalPenalty({ result: r }),
          penalties: r.penalties ? Object.assign({}, r.penalties) : {},
          flag: r.flag || null,
          winLose: r.winLose || null,
          ranked: r.ranked || null,
        };
      });
    },

    // === Build All Rounds Package ===
    buildAllRoundsPackage: function () {
      var result = [];
      var i = 0;
      if (this.rounds && Array.isArray(this.rounds)) {
        while (i < this.rounds.length) {
          var r = this.rounds[i];
          var obj = {};
          obj.roundId = String(r.id);
          obj.roundName = r.bronze ? "Final B" : r.name;
          obj.rows = this.buildRoundRows(r);
          result.push(obj);
          i = i + 1;
        }
      }
      return result;
    },

    // // === Build Overall Accumulation ===
    // buildOverallAccumulation: function () {
    //   var roundsPkg = this.buildAllRoundsPackage();
    //   var acc = {};

    //   var i = 0;
    //   while (i < roundsPkg.length) {
    //     var R = roundsPkg[i];
    //     if (R.rows && Array.isArray(R.rows)) {
    //       var j = 0;
    //       while (j < R.rows.length) {
    //         var row = R.rows[j];
    //         var name = row.team;
    //         var bib = row.bib;
    //         var ranked = row.ranked;
    //         var totalOrRace = row.total ? row.total : row.race;
    //         var key = String(name).toUpperCase() + "|" + String(bib);

    //         if (!acc[key]) {
    //           acc[key] = {
    //             name: name,
    //             bib: bib,
    //             score: 0,
    //             bestRank: 999,
    //             bestTimeMs: null,
    //           };
    //         }

    //         var ref = acc[key];
    //         var rankNum = parseInt(ranked);
    //         if (!isNaN(rankNum)) {
    //           var s = this.getScoreByRanked(rankNum);
    //           if (isNaN(s)) s = 0;
    //           ref.score = ref.score + s;
    //           if (rankNum < ref.bestRank) {
    //             ref.bestRank = rankNum;
    //           }
    //         }

    //         var T = this.parsesTime(totalOrRace ? totalOrRace : "");
    //         if (isFinite(T)) {
    //           if (ref.bestTimeMs === null || T < ref.bestTimeMs) {
    //             ref.bestTimeMs = T;
    //           }
    //         }

    //         j = j + 1;
    //       }
    //     }
    //     i = i + 1;
    //   }

    //   var arr = [];
    //   for (var key in acc) {
    //     if (Object.prototype.hasOwnProperty.call(acc, key)) {
    //       var v = acc[key];
    //       arr.push({
    //         name: v.name,
    //         bib: v.bib,
    //         score: v.score,
    //         bestRank: v.bestRank,
    //         bestTimeMs: v.bestTimeMs,
    //       });
    //     }
    //   }

    //   arr.sort(function (a, b) {
    //     if (a.score !== b.score) return b.score - a.score;
    //     if (a.bestRank !== b.bestRank) return a.bestRank - b.bestRank;
    //     if ((a.bestTimeMs || 0) !== (b.bestTimeMs || 0))
    //       return (a.bestTimeMs || 0) - (b.bestTimeMs || 0);
    //     return String(a.name).localeCompare(String(b.name));
    //   });

    //   var k = 0;
    //   while (k < arr.length) {
    //     arr[k].ranked = k + 1;
    //     k = k + 1;
    //   }

    //   var result = [];
    //   var n = 0;
    //   while (n < arr.length) {
    //     var r = arr[n];
    //     result.push({
    //       ranked: r.ranked,
    //       name: r.name,
    //       bib: r.bib,
    //       score: r.score,
    //     });
    //     n = n + 1;
    //   }

    //   return result;
    // },
    // =======================================================
    // === Fungsi: buildOverallAccumulation()
    // === Tujuan: Menghitung hasil akumulasi (overall result)
    // ===          dari seluruh babak Head-to-Head / Slalom.
    // === Menghasilkan daftar akhir tim (ranking, skor, dst)
    // =======================================================
    buildOverallAccumulation: function () {
      // Ambil semua paket babak yang sudah dibangun sebelumnya
      // (biasanya berisi data tiap round: R1, R2, Final A, Final B, dst.)
      var roundsPkg = this.buildAllRoundsPackage();

      // Objek untuk menyimpan akumulasi per tim
      var acc = {};

      // Loop setiap babak
      var i = 0;
      while (i < roundsPkg.length) {
        var R = roundsPkg[i];

        // Cek apakah babak punya data rows (tim yang ikut)
        if (R.rows && Array.isArray(R.rows)) {
          var j = 0;

          // Loop setiap tim di babak tersebut
          while (j < R.rows.length) {
            var row = R.rows[j];
            var name = row.team; // Nama tim
            var bib = row.bib; // Nomor BIB tim
            var ranked = row.ranked; // Peringkat di babak itu
            var totalOrRace = row.total ? row.total : row.race; // Waktu hasil
            var key = String(name).toUpperCase() + "|" + String(bib); // Key unik tim

            // --- Jika tim belum ada di daftar akumulasi, buat entri baru ---
            if (!acc[key]) {
              acc[key] = {
                name: name,
                bib: bib,
                score: 0, // total skor kumulatif
                bestRank: 999, // peringkat terbaik (angka kecil = lebih bagus)
                bestTimeMs: null, // waktu tercepat (dalam ms)
              };
            }

            var ref = acc[key]; // pointer ke entri tim ini

            // --- Hitung skor berdasarkan ranking di babak ini ---
            var rankNum = parseInt(ranked);
            if (!isNaN(rankNum)) {
              // Ambil skor dari fungsi internal getScoreByRanked()
              // contoh: Rank 1 → 100pts, Rank 2 → 80pts, dst.
              var s = this.getScoreByRanked(rankNum);
              if (isNaN(s)) s = 0;

              // Tambahkan skor ke total
              ref.score = ref.score + s;

              // Jika peringkat sekarang lebih bagus (lebih kecil), simpan sebagai bestRank
              if (rankNum < ref.bestRank) {
                ref.bestRank = rankNum;
              }
            }

            // --- Cek waktu terbaik ---
            var T = this.parsesTime(totalOrRace ? totalOrRace : "");
            if (isFinite(T)) {
              // Simpan waktu tercepat (paling kecil)
              if (ref.bestTimeMs === null || T < ref.bestTimeMs) {
                ref.bestTimeMs = T;
              }
            }

            j = j + 1; // lanjut tim berikutnya
          }
        }
        i = i + 1; // lanjut ke babak berikutnya
      }

      // --- Konversi hasil akumulasi (object) menjadi array ---
      var arr = [];
      for (let key in acc) {
        if (Object.prototype.hasOwnProperty.call(acc, key)) {
          let v = acc[key];
          arr.push({
            name: v.name,
            bib: v.bib,
            score: v.score,
            bestRank: v.bestRank,
            bestTimeMs: v.bestTimeMs,
          });
        }
      }

      // --- Urutkan hasil akhir ---
      arr.sort(function (a, b) {
        // 1️⃣ Skor tertinggi di atas
        if (a.score !== b.score) return b.score - a.score;

        // 2️⃣ Jika skor sama → lihat peringkat terbaik (semakin kecil semakin baik)
        if (a.bestRank !== b.bestRank) return a.bestRank - b.bestRank;

        // 3️⃣ Jika masih sama → waktu terbaik (lebih kecil lebih baik)
        if ((a.bestTimeMs || 0) !== (b.bestTimeMs || 0))
          return (a.bestTimeMs || 0) - (b.bestTimeMs || 0);

        // 4️⃣ Jika masih sama → urut alfabet nama tim
        return String(a.name).localeCompare(String(b.name));
      });

      // --- Tambahkan properti ranked (posisi urutan akhir) ---
      var k = 0;
      while (k < arr.length) {
        arr[k].ranked = k + 1; // urutan ke-1, ke-2, dst.
        k = k + 1;
      }

      // --- Buat hasil akhir (output ringan) ---
      var result = [];
      var n = 0;
      while (n < arr.length) {
        var r = arr[n];
        result.push({
          ranked: r.ranked,
          name: r.name,
          bib: r.bib,
          score: r.score,
        });
        n = n + 1;
      }

      // --- Kembalikan array hasil akhir ---
      return result;
    },

    // === Build Overall Package (gabungan podium + akumulasi) ===
    // buildOverallPackage: function () {
    //   var placements = [];

    //   if (this.podium && this.podium.gold) {
    //     placements.push({ place: 1, team: this.podium.gold });
    //   }
    //   if (this.podium && this.podium.silver) {
    //     placements.push({ place: 2, team: this.podium.silver });
    //   }
    //   if (this.podium && this.podium.bronze) {
    //     placements.push({ place: 3, team: this.podium.bronze });
    //   }
    //   if (this.podium && this.podium.fourth) {
    //     placements.push({ place: 4, team: this.podium.fourth });
    //   }

    //   var final = null;
    //   if (this.getFinalRound) {
    //     final = this.getFinalRound();
    //   }
    //   var finalRows = [];
    //   if (final) {
    //     finalRows = this.buildRoundRows(final);
    //   }

    //   var overallRows = this.buildOverallAccumulation();
    //   var rounds = this.buildAllRoundsPackage();

    //   var result = {
    //     event:
    //       this.dataEventSafe && this.dataEventSafe.eventName
    //         ? this.dataEventSafe.eventName
    //         : "",
    //     category: this.titleCategories ? this.titleCategories : "",
    //     placements: placements,
    //     finalRows: finalRows,
    //     rounds: rounds,
    //     overallRows: overallRows,
    //   };
    //   return result;
    // },
    buildOverallPackage: function () {
      const placements = [];
      if (this.podium && this.podium.gold)
        placements.push({ place: 1, team: this.podium.gold });
      if (this.podium && this.podium.silver)
        placements.push({ place: 2, team: this.podium.silver });
      if (this.podium && this.podium.bronze)
        placements.push({ place: 3, team: this.podium.bronze });
      if (this.podium && this.podium.fourth)
        placements.push({ place: 4, team: this.podium.fourth });

      const final = this.getFinalRound ? this.getFinalRound() : null;
      const finalRows = final ? this.buildRoundRows(final) : [];

      const overallRows = this.buildOverallPlacingsFromLastRound(); // ← sudah ada score

      const rounds = this.buildAllRoundsPackage();

      return {
        event:
          this.dataEventSafe && this.dataEventSafe.eventName
            ? this.dataEventSafe.eventName
            : "",
        category: this.titleCategories || "",
        placements,
        finalRows,
        rounds,
        overallRows,
      };
    },

    // util: sortir rows mengikuti urutan bracket + BYE di bawah
    sortRowsByBracketAndBye: function (rows, roundObj) {
      if (!Array.isArray(rows) || !roundObj || !roundObj.matches) return rows;

      // map: TEAM_NAME_UPPER → {heat, pos}
      var orderMap = {};
      for (var i = 0; i < roundObj.matches.length; i++) {
        var m = roundObj.matches[i];
        var heat = i + 1;

        var n1 =
          m.team1 && m.team1.name ? String(m.team1.name).toUpperCase() : "";
        var n2 =
          m.team2 && m.team2.name ? String(m.team2.name).toUpperCase() : "";
        if (n1)
          orderMap[n1] = { heat: heat, pos: 0, bye: !!(m.bye && n1 && !n2) };
        if (n2)
          orderMap[n2] = { heat: heat, pos: 1, bye: !!(m.bye && n2 && !n1) };
      }

      var copy = rows.slice();
      copy.sort(function (a, b) {
        var A = orderMap[String(a.team || "").toUpperCase()] || {};
        var B = orderMap[String(b.team || "").toUpperCase()] || {};

        // BYE terakhir
        var byeA = !!A.bye;
        var byeB = !!B.bye;
        if (byeA !== byeB) return byeA ? 1 : -1;

        // heat kecil dulu
        var hA = Number.isFinite(A.heat) ? A.heat : Number.POSITIVE_INFINITY;
        var hB = Number.isFinite(B.heat) ? B.heat : Number.POSITIVE_INFINITY;
        if (hA !== hB) return hA - hB;

        // pos team1 (0) lalu team2 (1)
        var pA = Number.isFinite(A.pos) ? A.pos : 9;
        var pB = Number.isFinite(B.pos) ? B.pos : 9;
        if (pA !== pB) return pA - pB;

        return String(a.team || "").localeCompare(String(b.team || ""));
      });
      // re-assign nomor urut
      for (var k = 0; k < copy.length; k++) copy[k].no = k + 1;
      return copy;
    },

    // ================================================================
    // Print/Save reusable helpers — Print Round, Print All Round, Print
    // Overall dulunya (dan Save Round/Save All Round/Save Overall) 3x
    // copy-paste blok yang IDENTIK persis (tunggu render → generatePdf,
    // atau send IPC → tunggu reply → notify → sync Overall), cuma beda di
    // data yang disiapkan. Diringkas jadi 2 helper di bawah TANPA mengubah
    // perilaku/urutan eksekusi tiap tombol.
    // ================================================================

    // Cocokkan tiap sheet round (`{roundId, rows}`) ke object round asli di
    // `this.rounds` (utk tahu apakah bronze/BYE dll.), lalu urutkan rows-nya
    // — dipakai oleh Print All Round & Print Overall (sama-sama berisi
    // banyak sheet round).
    _applyBracketSortToRoundsSheets(roundsSheets) {
      if (!Array.isArray(roundsSheets)) return roundsSheets;
      roundsSheets.forEach((R) => {
        const found =
          (this.rounds || []).find((rr) => String(rr.id) === R.roundId) ||
          null;
        R.rows = this.sortRowsByBracketAndBye(R.rows, found);
      });
      return roundsSheets;
    },

    // Tunggu Vue selesai render konten PDF (butuh 1 tick + jeda kecil utk
    // vue-html2pdf menyiapkan DOM-nya) lalu panggil generatePdf(). Dipakai
    // oleh ketiga tombol Print — hanya BEDA di data apa yang disiapkan
    // sebelum method ini dipanggil (pdfMode/pdfFilename/pdfRound.../pdfOverallPkg).
    async _renderAndDownloadPdf(errorLogFn) {
      await this.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 300));
      await this.$nextTick();

      if (!this.$refs || !this.$refs.html2Pdf || !this.$refs.html2Pdf.$el) {
        return;
      }

      try {
        await this.$refs.html2Pdf.generatePdf();
      } catch (e) {
        (errorLogFn || logger.error)(e);
      }
    },

    // Kirim payload H2H ke satu channel IPC, tunggu balasannya, notify hasil,
    // lalu auto-sync ke Overall (dokumen event-results kategori H2H) kalau
    // sukses — dipakai oleh ketiga tombol Save. TIDAK di-await oleh
    // caller (fire-and-forget), persis seperti perilaku aslinya sebelum
    // dirapikan.
    _saveH2HToDBAndSyncOverall(channel, payload, successMessage) {
      return new Promise((resolve) => {
        ipcRenderer.send(channel, payload);
        ipcRenderer.once(`${channel}-reply`, async (_e, res) => {
          if (res && res.ok) {
            this.notify("success", successMessage, "Saved");
            // Auto-sync ke Overall — dulu ini cuma kejadian kalau tombol
            // "Save Overall (DB)" yang terpisah diklik sendiri, sehingga
            // operator yang cuma terbiasa Save Round tiap babak tidak pernah
            // melihat hasilnya muncul di View Overall. Samakan dgn Sprint
            // yg otomatis sinkron begitu hasil disimpan.
            try {
              await this.upsertEventResultsH2H();
            } catch (err) {
              this.notify("error", String(err), "Sync Overall Gagal");
            }
          } else {
            this.notify(
              "error",
              (res && res.error) || "Save failed",
              "Failed"
            );
          }
          resolve(res);
        });
      });
    },

    // === Print Round ===
    async printCurrentRoundVuePdf() {
      // BUG FIX: tidak ada pengaman thd klik ganda/beruntun — generatePdf()
      // kedua bisa terpanggil sblm proses pertama selesai render, padahal
      // keduanya berbagi state (pdfMode/pdfRound/pdfRoundRows) & 1 instance
      // <vue-html2pdf> yg sama, jadi hasil PDF-nya bisa tercampur.
      if (this.isPrintingRound) return;
      const r = this.currentRound;
      if (!r) return;

      const rows = this.sortRowsByBracketAndBye(this.buildRoundRows(r), r);
      if (!rows || !rows.length) {
        this.notify("warning", "Tidak ada data round ini.", "Print Round");
        return;
      }

      this.isPrintingRound = true;
      try {
        this.pdfMode = "round";
        this.pdfFilename = "Result - " + (r.bronze ? "Final B" : r.name) + ".pdf";
        this.pdfRound = r;
        this.pdfRoundRows = rows;

        await this._renderAndDownloadPdf(logger.error);
      } finally {
        this.isPrintingRound = false;
      }
    },

    // === Print All Round ===
    async printAllRoundVuePdf() {
      if (this.isPrintingAllRounds) return;
      this.isPrintingAllRounds = true;
      try {
        const roundsSheets = this._applyBracketSortToRoundsSheets(
          this.buildAllRoundsPackage()
        );

        this.pdfMode = "allround";
        this.pdfFilename = "All Rounds — Results.pdf";
        this.pdfOverallPkg = { rounds: roundsSheets, placements: [] };

        await this._renderAndDownloadPdf(logger.error);
      } finally {
        this.isPrintingAllRounds = false;
      }
    },

    // === Print Overall ===
    async printOverallVuePdf() {
      if (this.isPrintingOverall) return;
      this.isPrintingOverall = true;
      try {
        const pkg = this.buildOverallPackage();
        if (pkg && Array.isArray(pkg.rounds)) {
          this._applyBracketSortToRoundsSheets(pkg.rounds);
        }

        this.pdfMode = "overall";
        this.pdfFilename = "Overall Result.pdf";
        this.pdfOverallPkg = pkg;

        await this._renderAndDownloadPdf(logger.warn);
      } finally {
        this.isPrintingOverall = false;
      }
    },

    // === Save Round (DB) ===
    async saveCurrentRoundToDB() {
      // BUG FIX: sama seperti Print — dulu tidak ada pengaman klik ganda.
      // _saveH2HToDBAndSyncOverall() memakai ipcRenderer.once() TANPA
      // request-id (beda dgn saveBracketToDB() yg sudah py __reqId), jadi
      // 2 klik cepat bisa membuat balasan permintaan pertama "tertangkap"
      // oleh listener permintaan kedua — notifikasi salah/dobel, atau
      // upsertEventResultsH2H() (auto-sync ke Overall) ke-trigger dobel.
      if (this.isSavingRound) return;

      const r = this.currentRound;
      if (!r) {
        this.notify("warning", "Tidak ada babak aktif.", "Save Round");
        return;
      }

      let bucket;
      try {
        bucket = this._currentBucketOrThrow();
      } catch (err) {
        this.notify("error", String(err), "Save Round");
        return;
      }

      const rows = this.buildRoundRows(r);
      if (!rows || !rows.length) {
        this.notify("warning", "Tidak ada data round ini.", "Save Round");
        return;
      }

      this.isSavingRound = true;
      try {
        await this._saveH2HToDBAndSyncOverall(
          "h2h:round:save",
          {
            bucket,
            roundId: String(r.id),
            roundName: r.bronze ? "Final B" : r.name,
            rows,
          },
          "Hasil round tersimpan."
        );
        this.saveBracketToDB();
      } finally {
        this.isSavingRound = false;
      }
    },

    // === Save All Round (DB) ===
    async saveAllRoundToDB() {
      if (this.isSavingAllRounds) return;

      let bucket;
      try {
        bucket = this._currentBucketOrThrow();
      } catch (err) {
        this.notify("error", String(err), "Save All Round");
        return;
      }

      const roundsSheets = this.buildAllRoundsPackage();

      this.isSavingAllRounds = true;
      try {
        await this._saveH2HToDBAndSyncOverall(
          "h2h:rounds:saveMany",
          { bucket, roundsSheets },
          "Semua round tersimpan."
        );
      } finally {
        this.isSavingAllRounds = false;
      }
    },

    // === Save Overall (DB) ===
    async saveOverallToDB() {
      if (this.isSavingOverall) return;

      let bucket;
      try {
        bucket = this._currentBucketOrThrow();
      } catch (err) {
        this.notify("error", String(err), "Save Overall");
        return;
      }

      const overallPkg = this.buildOverallPackage();
      // BUG FIX: dulu tidak dicek — klik "Save Overall" sebelum Final A/B
      // (atau babak apa pun) selesai akan menyimpan dokumen Overall KOSONG
      // ke database tanpa pemberitahuan apa pun ke operator.
      if (!overallPkg || !overallPkg.overallRows || !overallPkg.overallRows.length) {
        this.notify(
          "warning",
          "Belum ada hasil yang bisa disimpan sbg Overall (belum ada babak yang selesai).",
          "Save Overall"
        );
        return;
      }

      this.isSavingOverall = true;
      try {
        await this._saveH2HToDBAndSyncOverall(
          "h2h:overall:save",
          { bucket, overallPkg },
          "Overall tersimpan."
        );
      } finally {
        this.isSavingOverall = false;
      }
    },

    // === merge hasil OVERALL H2H ke dokumen event-results (kategori lain aman) ===
    async upsertEventResultsH2H() {
      // siapkan konstanta & helper
      var K = {
        SPRINT: "SPRINT",
        H2H: "HEADTOHEAD",
        SLALOM: "SLALOM",
        DRR: "DRR",
      };
      var now = new Date();
      var self = this;

      function toNumOrNull(v) {
        var n = Number(v);
        return Number.isFinite(n) ? n : null;
      }
      function scoreForRankLocal(rank) {
        if (!rank || !Number.isFinite(+rank)) return 0;
        var s = self.getScoreByRanked ? self.getScoreByRanked(+rank) : null;
        return Number.isFinite(+s) ? +s : 0;
      }
      function teamKeyFrom(name, bib) {
        var nm = String(name || "").toUpperCase();
        var bb = String(bib || "");
        return nm + "|" + bb;
      }

      // ambil bucket aktif (harus valid)
      var bucket = null;
      try {
        bucket = self._currentBucketOrThrow();
      } catch (e) {
        self.notify && self.notify("error", String(e), "Bucket Invalid");
        return;
      }

      // bangun paket overall H2H yang sudah ada skornya
      var pkg = self.buildOverallPackage ? self.buildOverallPackage() : null;
      var overallRows =
        pkg && pkg.overallRows && Array.isArray(pkg.overallRows)
          ? pkg.overallRows
          : [];
      if (overallRows.length === 0) {
        self.notify &&
          self.notify(
            "warning",
            "Overall kosong, tidak ada yang di-merge.",
            "H2H Merge"
          );
        return;
      }

      // BUG FIX: dulu teamId SELALU dikosongkan di sini ("tidak tersedia
      // di paket overall") — tapi teamId SEBENARNYA tersedia, cuma bukan
      // di overallRows, melainkan di this.participantArr (live list tim
      // kategori H2H ini, py field teamId asli dari normalizeTeamForH2H()).
      // Akibat teamId selalu kosong: kolom "Sudah Bertanding" di tabel
      // Registered Teams (TeamPanel.vue -> hasCompeted()) TIDAK PERNAH
      // menyala utk tim yg hasil "sudah bertanding"-nya berasal dari H2H —
      // hasCompeted() mencocokkan row.teamId (ID asli, ada) ke Set yg
      // (krn entry.teamId kosong) malah ke-isi row.bibTeam sbg fallback,
      // jadi key-nya tidak akan pernah cocok. Sprint/kategori lain sudah
      // benar meneruskan teamId asli — H2H tadinya sengaja dikosongkan.
      var teamIdByKey = new Map();
      (self.participantArr || []).forEach(function (p) {
        var k = teamKeyFrom(p.nameTeam || p.teamName || "", p.bibTeam || "");
        var tid = String(p.teamId || "");
        if (k && tid) teamIdByKey.set(k, tid);
      });

      // siapkan incoming map: key = NAME|BIB → { ... }
      var incoming = new Map();
      var i = 0;
      while (i < overallRows.length) {
        var r = overallRows[i] || {};
        var nm = String(r.name || r.team || "");
        var bb = String(r.bib || "");
        var rk = Number.isFinite(+r.ranked) ? +r.ranked : null;
        var sc = Number.isFinite(+r.score) ? +r.score : scoreForRankLocal(rk);
        var key = teamKeyFrom(nm, bb);
        if (key) {
          incoming.set(key, {
            key: key,
            teamId: teamIdByKey.get(key) || "",
            teamName: nm,
            bib: bb,
            h2hCat: {
              name: K.H2H,
              rankedByCats: toNumOrNull(rk),
              scored: toNumOrNull(sc) !== null ? toNumOrNull(sc) : 0,
            },
            totalRanked: toNumOrNull(rk),
            totalScore: toNumOrNull(sc) !== null ? toNumOrNull(sc) : 0,
          });
        }
        i = i + 1;
      }

      // filter dokumen event-results berdasarkan bucket
      var baseFilter = {
        eventId: String(bucket.eventId || ""),
        initialId: String(bucket.initialId || ""),
        raceId: String(bucket.raceId || ""),
        divisionId: String(bucket.divisionId || ""),
      };

      // ambil existing doc (jika ada)
      function getExisting() {
        return new Promise(function (resolve) {
          ipcRenderer.once("event-results:get-reply", function (_e, res) {
            resolve(res);
          });
          ipcRenderer.send("event-results:get", baseFilter);
        });
      }

      var existingDoc = null;
      try {
        var gres = await getExisting();
        if (gres && gres.ok && gres.doc) existingDoc = gres.doc;
      } catch (e) {
        existingDoc = null;
      }

      // payload dasar
      var payload = {
        eventId: baseFilter.eventId,
        initialId: baseFilter.initialId,
        raceId: baseFilter.raceId,
        divisionId: baseFilter.divisionId,
        eventName: "HEADTOHEAD",
        initialName: String(bucket.initialName || "").toUpperCase(),
        raceName: String(bucket.raceName || "").toUpperCase(),
        divisionName: String(bucket.divisionName || "").toUpperCase(),
        eventResult: [],
        createdAt: now,
        updatedAt: now,
      };

      // set eventName ke HEADTOHEAD (uppercase)
      payload.eventName = String(
        payload.eventName || "HEADTOHEAD"
      ).toUpperCase();

      if (existingDoc) {
        // pertahankan createdAt lama
        payload.createdAt = existingDoc.createdAt
          ? new Date(existingDoc.createdAt)
          : now;
        payload.updatedAt = now;

        // map existing rows: key = NAME|BIB (fallback dari doc lama)
        var map = new Map();
        var safeArr = Array.isArray(existingDoc.eventResult)
          ? existingDoc.eventResult
          : [];
        var ei = 0;
        while (ei < safeArr.length) {
          var row = safeArr[ei] || {};
          var k = teamKeyFrom(row.teamName || row.team || "", row.bib || "");
          if (!k) {
            // fallback lama: teamId atau bib saja jika perlu
            var alt = String(row.teamId || row.bib || "");
            if (alt) k = alt;
          }
          if (k) map.set(k, JSON.parse(JSON.stringify(row)));
          ei = ei + 1;
        }

        // merge H2H per tim
        var it = incoming.entries();
        var st = it.next();
        while (!st.done) {
          var ent = st.value;
          var inc = ent[1];

          var prev = map.get(ent[0]);
          if (!prev) {
            prev = {
              teamId: inc.teamId,
              teamName: inc.teamName,
              bib: inc.bib,
              categories: [],
              totalRanked: null,
              totalScore: 0,
            };
          }

          var prevCats = Array.isArray(prev.categories) ? prev.categories : [];
          var foundIdx = -1;
          var ci = 0;
          while (ci < prevCats.length) {
            var c = prevCats[ci] || {};
            var cname = String(c.name || "").toUpperCase();
            if (cname === K.H2H) {
              foundIdx = ci;
              break;
            }
            ci = ci + 1;
          }
          if (foundIdx >= 0) prevCats[foundIdx] = inc.h2hCat;
          else prevCats.push(inc.h2hCat);

          var merged = {
            teamId: inc.teamId || prev.teamId || "",
            teamName: inc.teamName || prev.teamName || "",
            bib: inc.bib || prev.bib || "",
            categories: prevCats,
            // totalRank/score diisi sesuai overall H2H (agregasi lintas nomor bisa dikerjakan di layer lain)
            totalRanked: inc.totalRanked,
            totalScore: inc.totalScore,
          };

          map.set(ent[0], merged);
          st = it.next();
        }

        // konversi Map → Array
        var vals = [];
        var itv = map.values();
        var sv = itv.next();
        while (!sv.done) {
          vals.push(sv.value);
          sv = itv.next();
        }
        payload.eventResult = vals;
      } else {
        // dokumen baru
        var vals2 = [];
        var iv = incoming.values();
        var sv2 = iv.next();
        while (!sv2.done) {
          var inc2 = sv2.value;
          var obj = {
            teamId: inc2.teamId,
            teamName: inc2.teamName,
            bib: inc2.bib,
            categories: [
              { name: K.SPRINT, rankedByCats: null, scored: 0 },
              { name: K.SLALOM, rankedByCats: null, scored: 0 },
              { name: K.DRR, rankedByCats: null, scored: 0 },
              {
                name: K.H2H,
                rankedByCats: toNumOrNull(inc2.h2hCat.rankedByCats),
                scored:
                  toNumOrNull(inc2.h2hCat.scored) !== null
                    ? toNumOrNull(inc2.h2hCat.scored)
                    : 0,
              },
            ],
            totalRanked: toNumOrNull(inc2.totalRanked),
            totalScore:
              toNumOrNull(inc2.totalScore) !== null
                ? toNumOrNull(inc2.totalScore)
                : 0,
          };
          vals2.push(obj);
          sv2 = iv.next();
        }
        payload.eventResult = vals2;
      }

      // kirim upsert
      ipcRenderer.send("event-results:upsert", payload);
      ipcRenderer.once("event-results:upsert-reply", function (_e, res) {
        var ok = res && res.ok ? true : false;
        if (ok) {
          ipcRenderer.send("get-alert-saved", {
            type: "info",
            message: "Event Results Updated",
            detail: "HEADTOHEAD category merged successfully",
          });
        } else {
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "Upsert failed",
            detail: res && res.error ? res.error : "Unknown error",
          });
        }
      });
    },
    resetByRow(item) {
      if (!item || !item.result) return;

      // pastikan object penalties ada & reactive
      this.ensurePenaltiesObject(item.result);
      const p = item.result.penalties;

      // kosongkan semua penalti ke null (biar dropdown kembali "—")
      this.$set(p, "s", null);
      this.$set(p, "cl", null);
      this.$set(p, "r1", null);
      this.$set(p, "r2", null);
      this.$set(p, "l1", null);
      this.$set(p, "l2", null);
      this.$set(p, "pb", null);
      this.$set(p, "f", null);
      this.$set(p, "o", null);

      // reset agregat penalti
      item.result.penalty = 0;
      item.result.penaltyTime = "00:00:00.000";

      // totalTime = raceTime (karena penalti 0)
      if (item.result.raceTime) {
        item.result.totalTime = item.result.raceTime;
      } else {
        item.result.totalTime = "";
      }

      // bersihkan flag (kalau ada)
      this.$set(item.result, "flag", null);

      // simpan dan hitung ulang efeknya
      this.persistRoundResults();
      this.computeWinLoseByHeat();
      this.evaluateHeatWinnersForCurrentRound();
      this.assignRanks(this.visibleParticipants);

      // force re-render jika perlu
      this.$nextTick &&
        this.$nextTick(() => {
          this.$forceUpdate && this.$forceUpdate();
        });
    },

    toggleBracket() {
      this.showBracket = !this.showBracket;
    },

    async fetchBooyanActiveFromSettings() {
      try {
        if (typeof ipcRenderer === "undefined") return;

        const bucket = getBucket();
        const eventId = String(bucket.eventId || "");
        if (!eventId) return;

        const token = Date.now();
        this._lastRSFetchToken = token;

        ipcRenderer.send("race-settings:get", eventId);
        ipcRenderer.once("race-settings:get-reply", (_e, res) => {
          if (this._lastRSFetchToken !== token) return;

          if (res && res.ok && res.settings && res.settings.h2h) {
            const h = res.settings.h2h || {};
            // map: "R1" → r1, dst
            this.booyanActive = {
              r1: !!h.R1 || !!h.r1,
              r2: !!h.R2 || !!h.r2,
              l1: !!h.L1 || !!h.l1,
              l2: !!h.L2 || !!h.l2,
            };

            (this.participantArr || []).forEach((p) => {
              if (!p.result) p.result = {};
              this.ensurePenaltiesObject(p.result);

              const pen = p.result.penalties;
              if (!this.booyanActive.r1) this.$set(pen, "r1", false);
              if (!this.booyanActive.r2) this.$set(pen, "r2", false);
              if (!this.booyanActive.l1) this.$set(pen, "l1", false);
              if (!this.booyanActive.l2) this.$set(pen, "l2", false);
              // re-hitung PB sesuai rule baru
              // this.onPenaltyChange(p);
            });
          }
        });
      } catch (err) {
        logger.warn("❌ Failed to update race settings:", err);
      }
    },

    // --- load semua bucket H2H dari eventDetails (offline/fallback) ---
    async loadAllH2HBucketsFromEvent() {
      try {
        const raw = localStorage.getItem("eventDetails");
        const ev = raw ? JSON.parse(raw) : {};
        const participant = Array.isArray(ev.participant) ? ev.participant : [];

        // filter hanya eventName H2H
        const h2hBuckets = participant.filter(
          (b) => String(b.eventName || "").toUpperCase() === "HEAD2HEAD"
        );

        const map = Object.create(null);
        const opts = [];

        // (optional) agregat semua H2H
        const agg = {
          eventId: "",
          initialId: "",
          raceId: "",
          divisionId: "",
          eventName: "HEAD2HEAD",
          initialName: "ALL",
          raceName: "ALL",
          divisionName: "ALL",
          teams: [],
          _isAggregate: true,
        };

        h2hBuckets.forEach((b) => {
          const key = this._h2hBucketKey(b);
          const label = this._h2hBucketLabel(b);
          const normalizedTeams = Array.isArray(b.teams)
            ? b.teams.map(normalizeTeamForH2H)
            : [];

          map[key] = { ...b, teams: normalizedTeams };
          opts.push({ value: key, text: label });

          agg.teams.push(...normalizedTeams.map((t) => ({ ...t })));
        });

        // hapus duplikat pada agregat berdasarkan (nameTeam|bibTeam)
        if (agg.teams.length) {
          const seen = new Set();
          agg.teams = agg.teams.filter((t) => {
            const sig = `${String(t.nameTeam).toUpperCase()}|${String(
              t.bibTeam
            )}`;
            if (seen.has(sig)) return false;
            seen.add(sig);
            return true;
          });
          const aggKey = "__ALL_H2H__";
          map[aggKey] = agg;
          opts.unshift({ value: aggKey, text: "All H2H Teams (aggregate)" });
        }

        this.h2hBucketMap = map;
        this.h2hBucketOptions = opts;

        // pilih default
        const savedKey = localStorage.getItem("currentH2HBucketKey");
        if (savedKey && map[savedKey]) {
          await this._useH2HBucket(savedKey);
          this.selectedH2HKey = savedKey;
        } else if (opts.length) {
          await this._useH2HBucket(opts[0].value);
          this.selectedH2HKey = opts[0].value;
        }
      } catch {
        /* noop */
      }
    },

    // --- apply bucket yang dipilih: set teams, judul, currentBucket, dll. ---
    async _useH2HBucket(key) {
      const b = this.h2hBucketMap[key];
      if (!b) return;

      // sinkronkan tab Initial yg aktif dgn bucket yg benar-benar dimuat
      // (bucket "ALL INITIAL" agregat tidak py satu Initial spesifik)
      if (!b._isAggregate && b.initialName) {
        this.selectedInitialName = b.initialName;
      }

      // set teams
      this.participant = (b.teams || []).map((t) => ({ ...t }));

      // title kategori
      this.titleCategories = b._isAggregate
        ? "ALL DIVISION/RACE – ALL INITIAL (HEAD2HEAD)"
        : this._h2hBucketLabel(b);

      // current bucket (untuk Save DB & kunci H2H round results)
      this.currentBucket = b._isAggregate
        ? null
        : {
            eventId: String(b.eventId || ""),
            initialId: String(b.initialId || ""),
            raceId: String(b.raceId || ""),
            divisionId: String(b.divisionId || ""),
            eventName: "HEAD2HEAD",
            initialName: String(b.initialName || "").toUpperCase(),
            raceName: String(b.raceName || "").toUpperCase(),
            divisionName: String(b.divisionName || "").toUpperCase(),
          };

      // simpan pilihan terakhir
      localStorage.setItem("currentH2HBucketKey", key);

      // update raceStartPayload.bucket agar konsisten antar halaman
      try {
        const raw = localStorage.getItem("raceStartPayload") || "{}";
        const obj = JSON.parse(raw || "{}") || {};
        obj.bucket =
          obj.bucket && typeof obj.bucket === "object" ? obj.bucket : {};
        const c = this.currentBucket || b;
        obj.bucket.eventId = String(c.eventId || "");
        obj.bucket.initialId = String(c.initialId || "");
        obj.bucket.raceId = String(c.raceId || "");
        obj.bucket.divisionId = String(c.divisionId || "");
        obj.bucket.eventName = String(c.eventName || "HEAD2HEAD");
        obj.bucket.initialName = String(c.initialName || "");
        obj.bucket.raceName = String(c.raceName || "");
        obj.bucket.divisionName = String(c.divisionName || "");
        // opsional: obj.bucket.teams = this.participant;
        localStorage.setItem("raceStartPayload", JSON.stringify(obj));
      } catch {
        /* noop */
      }

      // BUG FIX: dulu di sini SELALU rebuildBracketDynamic() tanpa syarat —
      // artinya tiap kali pindah tab Initial/kategori lalu balik lagi ke
      // bucket yang SAMA, bracket yang sudah jalan (Semifinal/Final/Heat
      // babak lanjutan) ikut ke-reset jadi bracket kosong (cuma Round 1
      // yang benar krn di-resync dari result.heat, babak 2+ pool/matches-nya
      // dikosongkan lagi). Sekarang coba muat bracket tersimpan dari DB dulu
      // (persis pola yang sudah dipakai di mounted()) — rebuild dari nol
      // HANYA kalau memang belum pernah ada bracket tersimpan utk bucket ini.

      // BUG FIX: `roundResultsRootKey` HARUS di-refresh ke bucket baru INI
      // sebelum tryLoadBracketFromDB() dipanggil — fungsi itu bisa memanggil
      // persistRoundResults() secara internal, dan persistRoundResults()
      // menulis ke KEY LAMA (rootKey bucket sebelumnya) kalau ini belum
      // di-refresh. Efeknya: heat yang barusan diisi tersimpan di lokasi
      // localStorage yang SALAH, lalu loadRoundResultsForCurrentRound() di
      // bawah me-reset result tabel (resetResultsForRound) dan reload dari
      // rootKey BARU yang ternyata masih kosong → heat hilang dari tabel
      // padahal bracket (round.matches[].heat, dibangun sebelum reset ini)
      // masih benar.
      this.roundResultsRootKey = getResultsRootKey();

      const n = Math.min(Math.max(this.participantArr.length || 8, 4), 32);
      // bucket agregat ("ALL H2H Teams") tidak py identity divisi/race/
      // initial tunggal → tidak ada dokumen bracket tersendiri di DB utk
      // itu, jadi tryLoadBracketFromDB() pasti gagal (malah bisa throw
      // krn field bucket-nya kosong) — langsung rebuild aja utk kasus ini.
      let loadedFromDB = false;
      if (!b._isAggregate) {
        try {
          loadedFromDB = await this.tryLoadBracketFromDB();
        } catch (e) {
          loadedFromDB = false;
        }
      }
      if (!loadedFromDB) {
        this.rebuildBracketDynamic(n);
        // auto-seed dari ranking Sprint DINONAKTIFKAN atas permintaan user —
        // Heat Round 1 diisi manual oleh operator lewat dropdown, sama
        // seperti babak2 berikutnya.
      }
      this.syncWinLoseFromBracketToParticipants();

      this.loadRoundResultsForCurrentRound();
      this.computeWinLoseByHeat();
    },

    // --- handler perubahan select ---
    async onSelectH2HBucket(key) {
      await this.fetchH2HBucketTeamsByKey(key);
    },

    // === Klik tab Initial (Youth/Junior/Open dll) ===
    async selectInitialTab(i) {
      this.selectedInitialName = i.name;

      const target = String(i.name).toUpperCase();
      const match = (this.h2hBucketOptions || []).find((o) => {
        const b = this.h2hBucketMap[o.value];
        return b && String(b.initialName).toUpperCase() === target;
      });

      if (match) {
        await this.onSelectH2HBucket(match.value);
      }
    },

    // --- fetch teams via IPC (mirip DRR: fetchBucketTeamsByKey) ---
    async fetchH2HBucketTeamsByKey(key) {
      // BUG FIX: `isLoadingBracket` sebelumnya bisa NYANGKUT true selamanya
      // (bagan/tabel keliatan kosong terus, spinner "Loading..." tidak
      // pernah selesai) dalam 2 skenario: (1) early `return` di jalur
      // "!res.ok" MELOMPATI baris isLoadingBracket=false yang ada di LUAR
      // try/catch, dan (2) kalau retry di blok catch JUGA throw, exception-nya
      // tidak ketangkep apa pun dan keluar dari fungsi ini begitu saja.
      // finally{} menjamin isLoadingBracket selalu balik false apa pun yang
      // terjadi di dalam try/catch, termasuk early return atau retry gagal.
      this.isLoadingBracket = true;
      try {
        if (
          !key ||
          !this.h2hBucketMap[key] ||
          typeof ipcRenderer === "undefined"
        )
          return;

        const b = this.h2hBucketMap[key];
        const filters = {
          eventId: String(b.eventId),
          initialId: String(b.initialId),
          raceId: String(b.raceId),
          divisionId: String(b.divisionId),
        };

        this.selectedH2HKey = key;
        localStorage.setItem("currentH2HBucketKey", key);

        const res = await new Promise((resolve) => {
          ipcRenderer.once("teams-h2h-registered:find-reply", (_e, payload) =>
            resolve(payload)
          );
          ipcRenderer.send("teams-h2h-registered:find", filters);
        });

        if (!res || !res.ok) {
          // kosongkan participant tapi tetap apply bucket untuk judul & payload
          this.participant = [];
          await this._useH2HBucket(key);
          return;
        }
        const doc = Array.isArray(res.items) ? res.items[0] : res.items;
        const teams =
          doc && Array.isArray(doc.teams)
            ? doc.teams.map(normalizeTeamForH2H)
            : [];

        // commit teams ke map → agar _useH2HBucket punya data
        this.h2hBucketMap[key] = {
          ...b,
          teams,
        };

        // apply bucket
        await this._useH2HBucket(key);
      } catch {
        // fallback minimal — kalau ini JUGA gagal, biarkan (tabel/bagan
        // kosong lebih baik drpd spinner nyangkut selamanya)
        try {
          await this._useH2HBucket(key);
        } catch {
          /* noop — sudah dilog di _useH2HBucket kalau perlu */
        }
      } finally {
        this.isLoadingBracket = false;
      }
    },
    _h2hBucketKey(b) {
      const ei = b && b.eventId ? String(b.eventId) : "";
      const ii = b && b.initialId ? String(b.initialId) : "";
      const ri = b && b.raceId ? String(b.raceId) : "";
      const di = b && b.divisionId ? String(b.divisionId) : "";
      return [ei, ii, ri, di].join("|");
    },
    _h2hBucketLabel(b) {
      const div = (
        b && b.divisionName ? String(b.divisionName) : ""
      ).toUpperCase();
      const rac = (b && b.raceName ? String(b.raceName) : "").toUpperCase();
      const ini = (
        b && b.initialName ? String(b.initialName) : ""
      ).toUpperCase();
      return `${div} ${rac} – ${ini}`;
    },

    // --- build opsi statik dari catalog event (fallback) ---
    buildStaticH2HOptions() {
      const eventId = this.currentEventId || "";
      if (!eventId) {
        this.h2hBucketOptions = [];
        this.h2hBucketMap = {};
        return;
      }

      const divs = this.divisions.length
        ? this.divisions
        : [
            { id: "1", name: "R4" },
            { id: "2", name: "R6" },
          ];

      const races = this.races.length
        ? this.races
        : [
            { id: "1", name: "MEN" },
            { id: "2", name: "WOMEN" },
          ];

      const inits = this.initials.length
        ? this.initials
        : [
            { id: "1", name: "YOUTH" },
            { id: "2", name: "JUNIOR" },
            { id: "3", name: "OPEN" },
          ];

      const opts = [];
      const map = Object.create(null);

      divs.forEach((div) => {
        races.forEach((race) => {
          inits.forEach((init) => {
            const key = [eventId, init.id, race.id, div.id]
              .map(String)
              .join("|");
            const label = `${div.name} ${race.name} – ${init.name}`;
            opts.push({ value: key, text: label });
            map[key] = {
              eventId,
              initialId: String(init.id),
              raceId: String(race.id),
              divisionId: String(div.id),
              eventName: "HEAD2HEAD",
              initialName: String(init.name),
              raceName: String(race.name),
              divisionName: String(div.name),
              teams: [],
            };
          });
        });
      });

      this.h2hBucketOptions = opts;
      this.h2hBucketMap = map;
    },
    stableRowKey(item) {
      const t = item || {};
      const name = String(t.nameTeam || t.teamName || "").toUpperCase();
      const bib = String(t.bibTeam || "");
      return name + "|" + bib;
    },
    markFlag(item, type) {
      if (!item || !item.result) return;
      // set flag (hanya salah satu dari DNF/DNS/DSQ)
      this.$set(item.result, "flag", type);

      // kosongkan waktu & total (biar tidak dihitung menang/kalah)
      item.result.startTime = "";
      item.result.finishTime = "";
      item.result.raceTime = "";
      item.result.totalTime = "";
      item.result.winLose = null;

      // nolkan penalti (biar jelas)
      this.ensurePenaltiesObject(item.result);
      const p = item.result.penalties || {};
      this.$set(p, "s", 0);
      this.$set(p, "cl", 0);
      this.$set(p, "r1", "N");
      this.$set(p, "r2", "N");
      this.$set(p, "l1", "N");
      this.$set(p, "l2", "N");
      this.$set(p, "pb", 0);
      this.$set(p, "f", 0);
      this.$set(p, "o", 0);
      item.result.penalty = 0;
      item.result.penaltyTime = "00:00:00.000";

      // simpan & recompute agar pairing heat/win-lose bersih
      this.persistRoundResults();
      this.computeWinLoseByHeat();
      this.evaluateHeatWinnersForCurrentRound();
      this.assignRanks(this.visibleParticipants);
    },

    resetRow(item) {
      if (!item) return;
      // hapus flag dan reset result bersih
      this.$set(item.result || (item.result = {}), "flag", null);
      const fresh = this.makeEmptyResult();
      // pertahankan HEAT yang sudah dipilih
      fresh.heat = item.result.heat != null ? item.result.heat : null;
      item.result = { ...fresh };

      this.persistRoundResults();
      this.computeWinLoseByHeat();
      this.evaluateHeatWinnersForCurrentRound();
      this.assignRanks(this.visibleParticipants);
    },
    // FUNCTION OTHERS PENALTY
    getOthersValue(item) {
      if (!item || !item.result) return "0";
      if (!item.result.penalties || typeof item.result.penalties !== "object") {
        return "0";
      }
      var v = item.result.penalties.o;
      if (typeof v === "undefined" || v === null) return "0";
      return String(v);
    },

    digitsOnly(e) {
      var k = e.key || "";
      if (!/^\d$/.test(k)) {
        e.preventDefault();
      }
    },

    digitsPaste(e) {
      var clip = e.clipboardData || window.clipboardData;
      var text = clip ? clip.getData("text") || "" : "";
      if (!/^\d+$/.test(text)) {
        e.preventDefault();
      }
    },

    onOthersTyping(val, item) {
      if (!item || !item.result) return;
      this.ensurePenaltiesObject(item.result);

      var s = String(val || "");
      var cleaned = s.replace(/\D+/g, "");
      var num = cleaned === "" ? 0 : Number(cleaned);

      this.$set(item.result.penalties, "o", num);
    },

    onOthersCommit(item) {
      // hitung ulang total penalti, time, win/lose, simpan, dll.
      this.onPenaltyChange(item);
    },

    // ADD: helper untuk reset result di round tertentu
    resetResultsForRound(roundObj) {
      const list = this.participantsForRound(roundObj);
      list.forEach((p) => {
        // kosongkan hasil round ini
        p.result = this.makeEmptyResult();
        // pastikan penalties lengkap & reactive
        this.ensurePenaltiesObject(p.result);
      });
    },

    /** Dapatkan daftar peserta utk sebuah round TANPA mengganti currentRoundIndex */
    participantsForRound(roundObj) {
      if (!roundObj) return [];
      const want = new Set();
      (roundObj.matches || []).forEach((m) => {
        if (m.team1 && m.team1.name) want.add(m.team1.name.toUpperCase());
        if (m.team2 && m.team2.name) want.add(m.team2.name.toUpperCase());
      });
      // BUG FIX: tim yang masih di round.pool (belum di-assign ke slot match
      // apa pun) tidak ikut ke-reset kalau tidak dimasukkan di sini — karena
      // `result` adalah SATU object yang dipakai bersama lintas SEMUA babak,
      // tim itu akan tetap menampilkan Result/Win-Lose/waktu dari babak
      // SEBELUMNYA selama masih menunggu di pool babak yang baru dibuka.
      (roundObj.pool || []).forEach((t) => {
        const n = t && (t.name || t.nameTeam || t.teamName);
        if (n) want.add(String(n).toUpperCase());
      });
      // map dari participantArr yg namanya ada di round ini
      const list = (this.participantArr || []).filter((p) =>
        want.has(String(p.nameTeam || p.teamName || "").toUpperCase())
      );
      // placeholder utk tim yang belum ada di participant (kalau ada)
      if (want.size && list.length < want.size) {
        const existing = new Set(
          list.map((p) => String(p.nameTeam || p.teamName || "").toUpperCase())
        );
        want.forEach((up) => {
          if (!existing.has(up))
            list.push(this.normalizeTeamForViewPlaceholder(up));
        });
      }
      return list;
    },

    /** Simpan hasil utk round tertentu (bukan hanya currentRound) */
    persistRoundResultsFor(roundObj) {
      if (!this.roundResultsRootKey || !roundObj) return;
      const roundKey = String(roundObj.id);
      const subset = this.participantsForRound(roundObj);
      const pack = subset.map((p) => ({
        nameTeam: String(p.nameTeam || p.teamName || ""),
        bibTeam: String(p.bibTeam || ""),
        result: { ...(p.result || {}) },
      }));
      const all = readAllRoundResults(this.roundResultsRootKey) || {};
      all[roundKey] = pack;
      writeAllRoundResults(this.roundResultsRootKey, all);
    },

    /** Simpan hasil utk SEMUA babak (Round of 32→Final + Bronze) */
    saveAllRoundsLocal() {
      (this.rounds || []).forEach((r) => this.persistRoundResultsFor(r));
      this.$bvToast &&
        this.$bvToast.toast("Semua hasil per-babak tersimpan lokal.", {
          variant: "success",
          autoHideDelay: 2000,
          title: "Saved",
        });
    },

    /** (Opsional) Ekspor semua hasil per-round (JSON) utk arsip/backup */
    exportAllRoundsJSON() {
      if (!this.roundResultsRootKey) return;
      const payload = {
        bucket: getBucket(),
        savedAt: new Date().toISOString(),
        rounds: Object.entries(this.storedResultsByRound).map(([rid, v]) => ({
          roundId: rid,
          roundName: v.roundName,
          items: v.items,
        })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `h2h-results-${payload.bucket.eventId || "event"}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    // Tambahkan di methods:
    // BUG FIX: dulu fungsi ini me-reset Win/Lose ke null utk SEMUA
    // visibleParticipants dulu, baru mengisi ulang HANYA utk tim yang
    // punya pasangan Heat (2 anggota). Sekarang Heat itu OPSIONAL/manual
    // (diisi belakangan lewat klik badge "Heat N" di bagan, bukan lagi
    // syarat pairing) — jadi match yang SUDAH diputuskan pemenangnya lewat
    // evaluateHeatWinnersForCurrentRound()/syncWinLoseFromBracketToParticipants()
    // (position-based, tidak butuh Heat) tapi BELUM diberi Heat, Win/Lose-nya
    // ikut ke-reset ke null di sini padahal race-nya sudah selesai — makanya
    // Win/Lose kelihatan "hilang" begitu ada recompute (mis. abis isi
    // penalti). Sekarang HANYA tim yang benar2 py pasangan Heat (2 anggota)
    // yang di-reset+dihitung ulang di sini; tim lain (belum py Heat sama
    // sekali) dibiarkan apa adanya — hasil dari mekanisme position-based
    // tetap berlaku.
    computeWinLoseByHeat() {
      // kelompokkan visibleParticipants berdasarkan nomor heat (yang valid)
      const groups = new Map();
      (this.visibleParticipants || []).forEach((p) => {
        const h =
          p && p.result && p.result.heat != null ? Number(p.result.heat) : null;
        if (!h || !isFinite(h)) return; // abaikan yang belum pilih heat
        if (!groups.has(h)) groups.set(h, []);
        groups.get(h).push(p);
      });

      // bandingkan per grup heat — reset+recompute HANYA utk grup yang
      // benar2 py 2 anggota (pasangan Heat lengkap)
      groups.forEach((arr) => {
        if (!Array.isArray(arr) || arr.length < 2) {
          // belum lengkap pasangannya → biarkan apa adanya, JANGAN direset
          return;
        }
        // jika lebih dari 2 (kasus input ganda), ambil 2 pertama saja
        const [A, B] = arr;
        A.result.winLose = null;
        B.result.winLose = null;

        // BUG FIX: sama seperti evaluateHeatWinnersForCurrentRound() — tim
        // yang di-flag DNF/DNS/DSQ punya waktu kosong, jadi tanpa
        // penanganan khusus di sini Win/Lose-nya tidak pernah terisi
        // (dianggap "waktu belum lengkap") padahal lawannya jelas menang.
        const BAD_FLAGS = ["DNF", "DNS", "DSQ"];
        const badA = BAD_FLAGS.includes(A.result && A.result.flag);
        const badB = BAD_FLAGS.includes(B.result && B.result.flag);
        if (badA || badB) {
          if (badA && badB) {
            // kedua sisi di-flag → tidak ada pemenang otomatis
          } else if (badA) {
            A.result.winLose = "Lose";
            B.result.winLose = "Win";
          } else {
            A.result.winLose = "Win";
            B.result.winLose = "Lose";
          }
          return;
        }

        const tA = this.parsesTime(
          (A.result && (A.result.totalTime || A.result.raceTime)) || ""
        );
        const tB = this.parsesTime(
          (B.result && (B.result.totalTime || B.result.raceTime)) || ""
        );

        if (!isFinite(tA) || !isFinite(tB)) {
          // waktu belum lengkap → biarkan null
          return;
        }

        if (tA < tB) {
          A.result.winLose = "Win";
          B.result.winLose = "Lose";
        } else if (tB < tA) {
          A.result.winLose = "Lose";
          B.result.winLose = "Win";
        }
        // seri → biarkan null (sudah direset di atas)
      });
      this.editResult = true;
    },
    // Kumpulkan pemakaian nomor heat lintas SEMUA Head to Head Category pada
    // event yang sama (bukan cuma bracket/kategori yang sedang dibuka), dengan
    // membaca seluruh localStorage `h2hRoundResults:<eventId>|...` — setiap
    // key berbeda kategori (initial/race/division) tapi eventId sama tetap
    // dihitung, supaya penomoran heat benar-benar berlanjut di semua kategori.
    // Method (bukan computed) supaya selalu baca data terbaru setiap dipanggil
    // — localStorage bukan reactive source jadi computed akan basi.
    getEventHeatUsage() {
      const usage = {};
      let maxHeat = 0;
      try {
        const bucket = getBucket();
        const eventId = bucket && bucket.eventId ? String(bucket.eventId) : "";
        if (!eventId) return { usage, maxHeat };

        const prefix = RESULTS_KEY_PREFIX + eventId + "|";
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key || key.indexOf(prefix) !== 0) continue;

          const allRounds = readAllRoundResults(key) || {};
          Object.keys(allRounds).forEach((roundId) => {
            const rows = Array.isArray(allRounds[roundId]) ? allRounds[roundId] : [];
            rows.forEach((row) => {
              const h = row && row.result ? Number(row.result.heat) : null;
              if (Number.isFinite(h) && h > 0) {
                usage[h] = (usage[h] || 0) + 1;
                if (h > maxHeat) maxHeat = h;
              }
            });
          });
        }
      } catch (e) {
        // localStorage tidak tersedia / data korup → anggap kosong
      }
      return { usage, maxHeat };
    },

    // ukuran kolom (size) suatu roundId "R{k}" pada bucket dgn jumlah tim
    // tertentu — meniru persis algoritma buildEmptyBracket() (base 2^n dari
    // jumlah tim, mengecil separuh tiap kolom) supaya nama babak "R{k}" bisa
    // dihitung utk bucket LAIN tanpa perlu memuat bucket itu ke state aktif.
    _h2hRoundSizeForBucket(nTeams, roundIdStr) {
      const m = /^R(\d+)$/.exec(roundIdStr || "");
      if (!m) return null;
      const k = parseInt(m[1], 10);
      const cap = Math.min(Math.max(4, Number(nTeams) || 0), 32);
      const base = this.nextPow2(cap);
      const size = base >> (k - 1);
      return size >= 2 ? size : null;
    },

    // label "posisi Babak" (mis. "Semifinals", "Final A", "Final B") utk
    // roundId tertentu, dari JUMLAH TIM (bukan objek bucket) — lihat catatan
    // BUG FIX di buildHeatAssignments() soal kenapa jumlah tim tidak diambil
    // dari sini lagi.
    _h2hRoundLabelForNTeams(nTeams, roundIdStr) {
      if (roundIdStr === "R_B") return "Final B";
      const size = this._h2hRoundSizeForBucket(nTeams, roundIdStr);
      return size ? this.roundName(size) : `Babak ${roundIdStr}`;
    },

    // kumpulkan tim per nomor Heat lintas SEMUA bucket H2H (division/race/
    // initial) pada event ini — sumber datanya sama dgn getEventHeatUsage()
    // (localStorage per-bucket), tapi di sini kita juga ambil identitas tim,
    // label kategorinya, dan posisi Babak utk ditampilkan di modal "Lihat Heat".
    // BUG FIX: dulu jumlah tim per bucket diambil dari h2hBucketMap[key].teams
    // — tapi map itu cuma di-isi PENUH utk bucket yang SUDAH DIBUKA sesi ini
    // (buildStaticH2HOptions() taruh SEMUA kombinasi Divisi/Race/Initial di
    // map dgn teams:[] kosong dulu; fetchH2HBucketTeamsByKey() baru mengisi
    // .teams asli utk bucket yang benar2 dipilih operator). Akibatnya, label
    // Babak (Semifinals/Final/dst.) di modal "Lihat Heat" bisa SALAH untuk
    // kategori yang belum sempat dibuka sesi ini (dihitung seolah cuma 4 tim
    // krn teams=[] fallback ke minimum bracket). Ambil jumlah tim yang
    // BENAR dari cache localStorage `eventDetails` (dipakai juga oleh
    // loadAllH2HBucketsFromEvent() sbg sumber kebenaran) — sumber ini sudah
    // ada di memori/disk tanpa perlu bucket itu dibuka dulu.
    _h2hRegisteredTeamCountByKey() {
      const counts = Object.create(null);
      try {
        const raw = localStorage.getItem("eventDetails");
        const ev = raw ? JSON.parse(raw) : {};
        const participant = Array.isArray(ev.participant) ? ev.participant : [];
        participant
          .filter((b) => String(b.eventName || "").toUpperCase() === "HEAD2HEAD")
          .forEach((b) => {
            const key = this._h2hBucketKey(b);
            counts[key] = Array.isArray(b.teams) ? b.teams.length : 0;
          });
      } catch (e) {
        /* noop — fallback ke h2hBucketMap[key].teams.length di caller */
      }
      return counts;
    },

    buildHeatAssignments() {
      const groups = {};
      try {
        const map = this.h2hBucketMap || {};
        const registeredCounts = this._h2hRegisteredTeamCountByKey();
        Object.keys(map).forEach((key) => {
          const b = map[key];
          if (!b || b._isAggregate) return;

          const rootKey = RESULTS_KEY_PREFIX + this._h2hBucketKey(b);
          const label = this._h2hBucketLabel(b);
          const allRounds = readAllRoundResults(rootKey) || {};
          const nTeams =
            registeredCounts[key] !== undefined
              ? registeredCounts[key]
              : Array.isArray(b.teams)
              ? b.teams.length
              : 0;

          Object.keys(allRounds).forEach((roundId) => {
            const roundLabel = this._h2hRoundLabelForNTeams(nTeams, roundId);
            const rows = Array.isArray(allRounds[roundId])
              ? allRounds[roundId]
              : [];
            rows.forEach((row) => {
              const h = row && row.result ? Number(row.result.heat) : null;
              if (!Number.isFinite(h) || h <= 0) return;

              if (!groups[h]) groups[h] = [];
              const nameTeam = String((row && row.nameTeam) || "");
              const bibTeam = String((row && row.bibTeam) || "");
              const already = groups[h].some(
                (t) =>
                  t.nameTeam === nameTeam &&
                  t.bibTeam === bibTeam &&
                  t.category === label &&
                  t.round === roundLabel
              );
              if (!already) {
                groups[h].push({
                  nameTeam,
                  bibTeam,
                  category: label,
                  round: roundLabel,
                });
              }
            });
          });
        });
      } catch (e) {
        // localStorage tidak tersedia / data korup → tampilkan kosong
      }

      return Object.keys(groups)
        .map(Number)
        .sort((a, b) => a - b)
        .map((h) => ({ heat: h, teams: groups[h] }));
    },

    openHeatModal() {
      this.heatModalGroups = this.buildHeatAssignments();
      this.heatModalVisible = true;
    },

    // Muat gambar (mis. logo) jadi data URL + dimensi asli — dipakai utk
    // menempelkan logo ke PDF via jsPDF.addImage(), yang butuh data URL
    // (bukan sekadar path/URL import webpack).
    _loadImageAsDataUrl(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx2d = canvas.getContext("2d");
          ctx2d.drawImage(img, 0, 0);
          resolve({
            dataUrl: canvas.toDataURL("image/png"),
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };
        img.onerror = reject;
        img.src = src;
      });
    },

    // Tanggal event utk keterangan di PDF bagan — pakai startDateEvent
    // (+endDateEvent kalau beda) dari dokumen event, format "DD MMM YYYY".
    _formatEventDateForPdf() {
      const ev = this.dataEventSafe || {};
      const fmt = (v) => {
        if (!v) return "";
        const d = new Date(v);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      };
      const start = fmt(ev.startDateEvent);
      const end = fmt(ev.endDateEvent);
      if (start && end && start !== end) return `${start} - ${end}`;
      return start || end || "";
    },

    // Capture LANGSUNG DOM bagan yang sedang tampil (heat badge, highlight
    // menang/kalah, dll. apa adanya) jadi PDF — bukan render ulang lewat
    // template PDF terpisah (beda dgn Print Round/All Round/Overall yang
    // pakai HeadToHeadPdfResult), krn bagannya sendiri sudah representasi
    // visual final yang mau di-export.
    // Layout dasar semua PDF H2H (logo/keterangan/margin konten) — satu
    // sumber angka spy "professional" & konsisten antar downloadBracketPdf()
    // & downloadHeatAssignmentPdf(), bukan angka acak yang beda2 tiap fungsi.
    _pdfLayout() {
      return {
        pageMargin: 14, // mm — margin luar standar dokumen cetak
        // tinggi "kop" (logo STS kiri + logo Event & keterangan kanan) —
        // cukup longgar utk logo Event (maks 14mm) + judul + 2 baris teks
        // kanan atas tanpa numpuk sama gambar bagan/tabel di bawahnya.
        headerHeight: 48, // mm
        logoWidth: 34, // mm — logo STS lebar (aspect ~512x150) jadi cukup besar tanpa makan tinggi header
      };
    },

    // Logo di pojok kiri atas halaman, sejajar vertikal dgn kop keterangan.
    async _addLogoToPdf(pdf) {
      try {
        const { pageMargin, logoWidth } = this._pdfLayout();
        const logo = await this._loadImageAsDataUrl(logoSts);
        const logoH = (logo.height / logo.width) * logoWidth;
        pdf.addImage(logo.dataUrl, "PNG", pageMargin, pageMargin, logoWidth, logoH);
      } catch (logoErr) {
        // logo gagal dimuat — lanjut tanpa logo drpd gagal total
      }
    },

    // Logo EVENT (dari eventFiles, beda dgn logo STS di pojok kiri) di
    // pojok KANAN atas, di ATAS blok keterangan Event/Round/Category.
    // Return tinggi (mm) yang terpakai supaya _addInfoBlockToPdf() tau
    // harus mulai menulis teks dari mana (spy tidak numpuk sama logo ini).
    async _addEventLogoToPdf(pdf) {
      try {
        const url = this.eventLogoUrl;
        if (!url) return 0;
        const { pageMargin } = this._pdfLayout();
        const logo = await this._loadImageAsDataUrl(url);
        const maxH = 14; // mm
        const maxW = 32; // mm
        let h = maxH;
        let w = (logo.width / logo.height) * h;
        if (w > maxW) {
          w = maxW;
          h = (logo.height / logo.width) * w;
        }
        const pageW = pdf.internal.pageSize.getWidth();
        const x = pageW - pageMargin - w;
        pdf.addImage(logo.dataUrl, "PNG", x, pageMargin, w, h);
        return h;
      } catch (logoErr) {
        // logo event gagal dimuat (mis. CORS) — lanjut tanpa logo drpd gagal total
        return 0;
      }
    },

    // jsPDF 1.x (font Helvetica bawaan) cuma bisa render WinAnsi/Latin-1 —
    // karakter di luar itu (en dash "–", em dash "—", smart quotes, dst,
    // sering ke-copy-paste dari nama kategori/divisi) bikin encoder-nya
    // salah deteksi & nulis string sbg UTF-16 + BOM ("þÿ" + spasi di antara
    // tiap huruf). Ganti dulu ke padanan ASCII sebelum di-render ke PDF.
    _sanitizePdfText(str) {
      return String(str == null ? "" : str)
        .replace(/[–—]/g, "-") // en dash, em dash -> hyphen
        .replace(/[‘’]/g, "'") // smart single quotes
        .replace(/[“”]/g, '"') // smart double quotes
        .replace(/…/g, "...") // ellipsis
        .replace(/[   ]/g, " ") // non-breaking spaces
        // eslint-disable-next-line no-control-regex
        .replace(/[^\x00-\x7f]/g, ""); // sisa karakter non-ASCII lain
    },

    // Keterangan (Event/Tanggal/Round/Category dll) di pojok KANAN atas,
    // rapi & right-aligned. `lines` = array of { label, value } ATAU string
    // polos (baris pertama = judul/Event name, dibuat bold & sedikit lebih
    // gelap; baris lain "Label: value" abu-abu). `topOffsetMm` menggeser
    // titik mulai ke bawah kalau ada logo event yang sudah dipasang di atas
    // blok ini (lihat _addEventLogoToPdf), spy tidak numpuk.
    _addInfoBlockToPdf(pdf, lines, topOffsetMm = 0) {
      try {
        const { pageMargin } = this._pdfLayout();
        const pageW = pdf.internal.pageSize.getWidth();
        const rightX = pageW - pageMargin;
        let y = pageMargin + 3.5 + topOffsetMm;

        const filtered = (lines || []).filter((l) =>
          typeof l === "string" ? l && l !== "-" : l && l.value && l.value !== "-"
        );

        filtered.forEach((l, i) => {
          const isTitle = i === 0 && typeof l === "string";
          if (isTitle) {
            pdf.setFont(undefined, "bold");
            pdf.setFontSize(11);
            pdf.setTextColor(30, 41, 59);
            pdf.text(this._sanitizePdfText(l), rightX, y, { align: "right" });
            y += 5.5;
          } else {
            const text =
              typeof l === "string" ? l : `${l.label}: ${l.value}`;
            pdf.setFont(undefined, "normal");
            pdf.setFontSize(8);
            pdf.setTextColor(100, 116, 139);
            pdf.text(this._sanitizePdfText(text), rightX, y, { align: "right" });
            y += 4.2;
          }
        });
        pdf.setFont(undefined, "normal");
      } catch (infoErr) {
        // gagal nulis keterangan — lanjut simpan PDF apa adanya
      }
    },

    // Tempelkan canvas hasil capture ke halaman PDF, di-skalakan supaya PAS
    // (fit) di dalam area konten (di bawah kop logo/keterangan, dikurangi
    // margin standar di kiri/kanan/bawah) sambil mempertahankan aspect
    // ratio aslinya — dicentang di tengah area itu. Dipakai supaya ukuran
    // PDF SELALU A4 baku, brp pun ukuran/rasio bagan atau tabel yang
    // di-capture (lebar/sempit, panjang/pendek).
    _addFittedImageToPdf(pdf, canvas) {
      const { pageMargin, headerHeight } = this._pdfLayout();
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const contentTop = headerHeight;
      const maxW = pageW - pageMargin * 2;
      const maxH = pageH - contentTop - pageMargin;

      const ratio = canvas.width / canvas.height;
      let drawW = maxW;
      let drawH = drawW / ratio;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * ratio;
      }
      const x = (pageW - drawW) / 2;
      const y = contentTop + (maxH - drawH) / 2;

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", x, y, drawW, drawH);
    },

    async downloadBracketPdf() {
      const el = this.$refs.bracketCaptureArea;
      if (!el) {
        this.notify("warning", "Bracket belum tersedia untuk di-export.", "Info");
        return;
      }
      this.isDownloadingBracketPdf = true;
      try {
        await this.$nextTick();
        const canvas = await html2canvas(el, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
        });

        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
        });

        this._addFittedImageToPdf(pdf, canvas);
        await this._addLogoToPdf(pdf);
        const eventLogoH = await this._addEventLogoToPdf(pdf);

        const roundLabel = this.currentRound
          ? this.currentRound.bronze
            ? "Final B"
            : this.currentRound.name
          : "-";
        this._addInfoBlockToPdf(
          pdf,
          [
            String(this.dataEventSafe.eventName || "-"),
            this._formatEventDateForPdf(),
            `Round: ${roundLabel} - Category: ${this.titleCategories || "-"}`,
          ],
          eventLogoH ? eventLogoH + 2 : 0
        );

        const safeName = String(this.titleCategories || "event")
          .trim()
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-+|-+$/g, "");
        pdf.save(`H2H-Bracket-${safeName || "event"}.pdf`);
      } catch (err) {
        this.notify("error", String(err), "Gagal export PDF Bracket");
      } finally {
        this.isDownloadingBracketPdf = false;
      }
    },

    // Download modal "Heat Assignment – Head to Head" (lintas SEMUA
    // kategori H2H event ini) sebagai PDF — pola sama dgn downloadBracketPdf()
    // tapi capture area-nya isi modal (tabel per-Heat), bukan bagan, dan
    // halamannya A4 Portrait (lebih cocok utk daftar tabel memanjang ke bawah).
    async downloadHeatAssignmentPdf() {
      const el = this.$refs.heatModalCaptureArea;
      if (!el) {
        this.notify("warning", "Konten belum tersedia untuk di-export.", "Info");
        return;
      }
      this.isDownloadingHeatModalPdf = true;
      try {
        await this.$nextTick();
        const canvas = await html2canvas(el, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
        });

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        this._addFittedImageToPdf(pdf, canvas);
        await this._addLogoToPdf(pdf);
        const eventLogoH = await this._addEventLogoToPdf(pdf);

        this._addInfoBlockToPdf(
          pdf,
          [
            String(this.dataEventSafe.eventName || "-"),
            this._formatEventDateForPdf(),
            "Semua Kategori Head to Head",
          ],
          eventLogoH ? eventLogoH + 2 : 0
        );

        const safeName = String(this.dataEventSafe.eventName || "event")
          .trim()
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-+|-+$/g, "");
        pdf.save(`H2H-Heat-Assignment-${safeName || "event"}.pdf`);
      } catch (err) {
        this.notify("error", String(err), "Gagal export PDF Heat Assignment");
      } finally {
        this.isDownloadingHeatModalPdf = false;
      }
    },

    openResetAllModal() {
      this.resetAllConfirmText = "";
      this.showResetAllModal = true;
    },

    onResetAllModalHidden() {
      if (!this.resetAllInProgress) this.resetAllConfirmText = "";
    },

    // Bersihkan SEMUA cache localStorage h2hRoundResults:<eventId>|... —
    // lintas SELURUH bucket H2H event ini, bukan cuma yang sedang dibuka
    // (prefix sama dgn yang dipakai getEventHeatUsage()/buildHeatAssignments()).
    _clearAllH2HLocalCachesForEvent(eventId) {
      try {
        const prefix = RESULTS_KEY_PREFIX + String(eventId) + "|";
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.indexOf(prefix) === 0) toRemove.push(key);
        }
        toRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        /* noop */
      }
    },

    async confirmResetAll() {
      if (this.resetAllConfirmText !== this.RESET_ALL_CONFIRM_PHRASE) return;
      const eventId = this.currentEventId || "";
      if (!eventId) return;

      this.resetAllInProgress = true;
      try {
        const res = await new Promise((resolve) => {
          ipcRenderer.once("h2h:reset-all-reply", (_e, r) => resolve(r));
          ipcRenderer.send("h2h:reset-all", eventId);
        });

        if (res && res.ok) {
          this._clearAllH2HLocalCachesForEvent(eventId);
          this.notify(
            "success",
            "Semua data kompetisi H2H pada event ini sudah dikosongkan.",
            "Reset All berhasil"
          );
          // reload penuh supaya seluruh state (bracket, round results,
          // socket listeners, dll.) dibangun ulang dari kondisi bersih —
          // lebih aman drpd re-invoke manual banyak method async berurutan.
          window.location.reload();
        } else {
          this.resetAllInProgress = false;
          this.notify(
            "error",
            (res && res.error) || "Unknown error",
            "Reset All gagal"
          );
        }
      } catch (err) {
        this.resetAllInProgress = false;
        this.notify("error", String(err), "Reset All gagal");
      }
    },

    makeEmptyResult() {
      return {
        startTime: "",
        finishTime: "",
        raceTime: "",
        penaltyTime: "00:00:00.000",
        penalty: 0,
        penalties: { s: 0, cl: 0, r1: 0, r2: 0, l1: 0, l2: 0, pb: 0, f: 0 },
        totalTime: "",
        ranked: "",
        score: "",
        winLose: null,
        heat: null,
      };
    },
    evaluateHeatWinnersForCurrentRound() {
      const r = this.currentRound;
      if (!r || !r.matches) return;

      const toKey = (p) =>
        String((p && (p.nameTeam || p.teamName)) || "").toUpperCase();

      // map nama → object participant (subset visible)
      const map = new Map(this.visibleParticipants.map((p) => [toKey(p), p]));

      r.matches.forEach((m) => {
        const n1 = m.team1 && m.team1.name ? m.team1.name.toUpperCase() : "";
        const n2 = m.team2 && m.team2.name ? m.team2.name.toUpperCase() : "";

        // BYE dibiarkan mekanisme bye yang menetapkan pemenang
        if (m.bye || !n1 || !n2) return;

        const P1 = map.get(n1);
        const P2 = map.get(n2);
        if (!P1 || !P2) return;

        // BUG FIX: tim yang di-flag DNF/DNS/DSQ (markFlag()) sengaja
        // mengosongkan raceTime/totalTime-nya — kalau winner HANYA
        // ditentukan dari perbandingan waktu (di bawah), match ini TIDAK
        // PERNAH punya pemenang (isFinite(T1/T2) selalu false utk sisi yang
        // di-flag) padahal lawannya jelas menang. Akibatnya bracket macet
        // permanen di match ini (advanceToNextRound() menolak lanjut selama
        // masih ada match "undecided", dan TIDAK ADA cara manual lain utk
        // set pemenang). Tim yang di-flag otomatis KALAH dari lawannya yang
        // py waktu sah; kalau KEDUA sisi sama2 di-flag, tidak ada pemenang
        // yang bisa ditentukan otomatis (operator perlu keputusan manual).
        const BAD_FLAGS = ["DNF", "DNS", "DSQ"];
        const flag1 = P1.result && P1.result.flag;
        const flag2 = P2.result && P2.result.flag;
        const bad1 = BAD_FLAGS.includes(flag1);
        const bad2 = BAD_FLAGS.includes(flag2);

        if (bad1 || bad2) {
          if (bad1 && bad2) {
            m.winner = null;
            P1.result.winLose = null;
            P2.result.winLose = null;
          } else if (bad1) {
            m.winner = m.team2;
            P1.result.winLose = "Lose";
            P2.result.winLose = "Win";
          } else {
            m.winner = m.team1;
            P1.result.winLose = "Win";
            P2.result.winLose = "Lose";
          }
          return;
        }

        const t1 =
          (P1.result && (P1.result.totalTime || P1.result.raceTime)) || "";
        const t2 =
          (P2.result && (P2.result.totalTime || P2.result.raceTime)) || "";

        const T1 = this.parsesTime(t1);
        const T2 = this.parsesTime(t2);
        if (!isFinite(T1) || !isFinite(T2)) return; // belum lengkap

        if (T1 < T2) {
          m.winner = m.team1;
          P1.result.winLose = "Win";
          P2.result.winLose = "Lose";
        } else if (T2 < T1) {
          m.winner = m.team2;
          P1.result.winLose = "Lose";
          P2.result.winLose = "Win";
        } else {
          m.winner = null;
          P1.result.winLose = null;
          P2.result.winLose = null;
        }
      });

      this.computePodium();
      this.persistRoundResults();
    },
    isByeTeam(item) {
      const r = this.currentRound;
      if (!r || !r.matches) return false;
      const name = String(
        (item && (item.nameTeam || item.teamName)) || ""
      ).toUpperCase();
      if (!name) return false;

      for (var i = 0; i < r.matches.length; i++) {
        var m = r.matches[i];
        if (!m || !m.bye) continue;

        var n1 = m.team1 && m.team1.name ? m.team1.name.toUpperCase() : "";
        var n2 = m.team2 && m.team2.name ? m.team2.name.toUpperCase() : "";

        // Pada BYE, hanya satu dari n1/n2 yang ada.
        if ((n1 && n1 === name && !n2) || (n2 && n2 === name && !n1)) {
          return true; // tim ini lolos BYE → disable inputnya
        }
      }
      return false;
    },
    getPenaltyCount(item) {
      const has = item && item.result;
      const pb = has && item.result.penalties;
      if (!pb || typeof pb !== "object") return 0;
      const keys = ["s", "cl", "r1", "r2", "l1", "l2", "pb", "f", "o"];
      // hitung berapa field yang > 0
      return keys.reduce(
        (cnt, k) => cnt + ((Number(pb[k]) || 0) > 0 ? 1 : 0),
        0
      );
    },
    secondsToTimeString(totalSec) {
      const t = Math.max(0, Number(totalSec) || 0);
      const ms = 0;
      const sec = Math.floor(t % 60);
      const min = Math.floor((t / 60) % 60);
      const hr = Math.floor(t / 3600);
      const pad = (n, w = 2) => String(n).padStart(w, "0");
      return `${pad(hr)}:${pad(min)}:${pad(sec)}.${pad(ms, 3)}`;
    },

    getBooyanMode() {
      const a = this.booyanActive || {};
      const any = !!(a.r1 || a.r2 || a.l1 || a.l2);
      if (!any) return "classic";
      if (a.r1 && a.l1 && !a.r2 && !a.l2) return "2";
      return "4";
    },

    /* =========================================================
     * SOCKET / IPC (Judges Dashboard realtime)
     * =======================================================*/
    async applyPenaltyFromSocketH2H(msg = {}) {
      // resolve tim: teamId/bib/nama -> index di this.participant
      // (pola sama seperti updateTime: cocokkan lewat participantArr lalu
      // ambil objek nyata dari this.participant, bukan visibleParticipants)
      const nameLC = String(msg.teamName || msg.nameTeam || "").toLowerCase();
      const bib = String(msg.bibTeam || msg.bib || "");
      const teamId = msg.teamId != null ? String(msg.teamId) : "";

      const targetIndex = this.participantArr.findIndex((p) => {
        if (teamId && String(p.teamId || "") === teamId) return true;
        const pNameLC = String(p.nameTeam || p.teamName || "").toLowerCase();
        const nameMatch = nameLC && pNameLC === nameLC;
        const bibMatch = bib && String(p.bibTeam || "") === bib;
        if (nameLC) return nameMatch && (!bib ? true : bibMatch);
        return false;
      });
      if (targetIndex === -1) return;

      const target = this.participant[targetIndex];
      if (!target || !target.result) return;

      // BUG FIX: `target.result` adalah SATU object yang dipakai bersama
      // lintas SEMUA babak (lihat catatan _teamResultTime()/buildRoundRows()).
      // onPenaltyChange() di bawah (evaluateHeatWinnersForCurrentRound,
      // persistRoundResults, dst) SEMUANYA terikat ke this.currentRound /
      // visibleParticipants. Kalau tim dari pesan realtime Judges Dashboard
      // ini bukan bagian dari babak yang SEDANG ditampilkan di layar,
      // perubahan ini akan diam2 HILANG begitu babak asli tim ini dimuat
      // (loadRoundResultsForCurrentRound() me-reset result dari kosong lalu
      // merge HANYA dari snapshot localStorage — update realtime ini tidak
      // pernah sempat ke-persist ke babak yg benar). Drpd silently
      // kehilangan data, tolak & beri tahu operator supaya pindah ke babak
      // yang sesuai dulu.
      const targetNameUp = String(
        target.nameTeam || target.teamName || ""
      ).toUpperCase();
      const inCurrentRound = (this.teamsInCurrentRound || []).some(
        (n) => String(n).toUpperCase() === targetNameUp
      );
      if (!inCurrentRound) {
        this.notify(
          "warning",
          `Update realtime utk "${
            target.nameTeam || target.teamName
          }" diabaikan — babak tim ini tidak sedang ditampilkan. Buka babak yang sesuai dulu.`,
          "Realtime Penalty"
        );
        return;
      }

      this.ensurePenaltiesObject(target.result);
      const p = target.result.penalties;

      // BUG FIX: dulu Start/Finish langsung diterima berapa pun nilainya
      // dari socket, tanpa dicek dulu terhadap daftar Pilihan Pen. Start/
      // Finish yang benar-benar dikonfigurasi lewat Race Settings — beda
      // dari Sprint/Slalom/DRR/RX yg semua sudah memvalidasi msg.value
      // terhadap daftar ALLOWED sebelum menerimanya. Cut Line (CL) malah
      // SAMA SEKALI belum py cabang sendiri di sini — walau CL sudah bisa
      // dikustomisasi penuh lewat Race Settings & sudah py dropdown
      // editable manual (clChoices), operator tidak bisa mengisinya lewat
      // device/socket sama sekali. Sekarang ketiganya (S/CL/F) dicek dulu
      // terhadap sChoices/clChoices/fChoices sebelum diterima, sama pola
      // dgn kategori lain.
      const kind = String(msg.type || "");
      if (kind === "PenaltyStart") {
        const v = Number(msg.value);
        const allowed = (this.sChoices || []).map((o) => Number(o.value));
        if (!allowed.includes(v)) return;
        this.$set(p, "s", v);
      } else if (kind === "PenaltyCutLine") {
        const v = Number(msg.value);
        const allowed = (this.clChoices || []).map((o) => Number(o.value));
        if (!allowed.includes(v)) return;
        this.$set(p, "cl", v);
      } else if (kind === "PenaltyFinish") {
        const v = Number(msg.value);
        const allowed = (this.fChoices || []).map((o) => Number(o.value));
        if (!allowed.includes(v)) return;
        this.$set(p, "f", v);
      } else if (kind === "PenaltyOther") {
        this.$set(p, "o", Number(msg.value) || 0);
      } else if (kind === "BooyanCorner") {
        const corner = String(msg.corner || "").toLowerCase();
        if (corner === "r1" || corner === "r2" || corner === "l1" || corner === "l2") {
          this.$set(p, corner, msg.touched ? "Y" : "N");
        } else {
          return;
        }
      } else {
        return;
      }

      await this.onPenaltyChange(target);
    },

    ensurePenaltiesObject(result) {
      if (!result || typeof result !== "object") return;

      const def = {
        s: null,
        cl: null,
        r1: null,
        r2: null,
        l1: null,
        l2: null,
        pb: null,
        f: null,
        o: null,
      };

      if (!result.penalties || typeof result.penalties !== "object") {
        this.$set(result, "penalties", { ...def });
      } else {
        const p = result.penalties;
        Object.keys(def).forEach((k) => {
          if (typeof p[k] === "undefined") this.$set(p, k, def[k]);
        });
      }

      // Samakan ON/OFF sesuai mode
      // const mode = this.getBooyanMode();
      // const a = this.booyanActive || {};
      // const p = result.penalties;

      // if (mode === "classic") {
      //   this.$set(p, "r1", "N");
      //   this.$set(p, "r2", "N");
      //   this.$set(p, "l1", "N");
      //   this.$set(p, "l2", "N");
      // } else if (mode === "2") {
      //   if (!a.r1) this.$set(p, "r1", "N");
      //   if (!a.l1) this.$set(p, "l1", "N");
      //   this.$set(p, "r2", "N");
      //   this.$set(p, "l2", "N");
      // } else {
      //   // mode "4"
      //   if (!a.r1) this.$set(p, "r1", "N");
      //   if (!a.r2) this.$set(p, "r2", "N");
      //   if (!a.l1) this.$set(p, "l1", "N");
      //   if (!a.l2) this.$set(p, "l2", "N");
      // }
    },

    async onPenaltyChange(item) {
      if (!item || !item.result) return;
      this.ensurePenaltiesObject(item.result);
      const p = item.result.penalties;
      const mode = this.getBooyanMode();

      // deteksi belum ada input sama sekali
      const noInputBooyan = [p.r1, p.r2, p.l1, p.l2].every((v) => v === null);
      const noInputNum = [p.s, p.cl, p.f, p.o].every((v) => v === null);
      const noInputAll = noInputBooyan && noInputNum;

      // Jika benar-benar belum ada input, kosongkan PB dan lompat hitungan PB
      if (noInputAll) {
        this.$set(p, "pb", null);
      } else {
        // --- Hitung PB sesuai mode ---
        const r1 = p.r1 === "Y";
        const r2 = p.r2 === "Y";
        const l1 = p.l1 === "Y";
        const l2 = p.l2 === "Y";

        if (mode == "classic") {
          this.$set(p, "pb", 0);
        } else if (mode == "2") {
          // R1 & L1 saja
          if (p.r1 === null && p.l1 === null) {
            this.$set(p, "pb", null);
          } else if (r1 && l1) {
            this.$set(p, "pb", 100);
          } else if (r1 || l1) {
            this.$set(p, "pb", 50);
          } else {
            this.$set(p, "pb", 0);
          }
        } else {
          // 4 booyan
          if ([p.r1, p.r2, p.l1, p.l2].every((v) => v === null)) {
            this.$set(p, "pb", null);
          } else if (!r1 && !r2 && !l1 && !l2) {
            this.$set(p, "pb", 100);
          } else {
            const comboValid =
              (r1 && l1) || (r1 && l2) || (r2 && l1) || (r2 && l2);
            this.$set(p, "pb", comboValid ? 0 : 50);
          }
        }
      }

      // total penalti: treat null as 0 (sudah aman)
      const totalPenaltySeconds =
        (Number(p.s) || 0) +
        (Number(p.cl) || 0) +
        (Number(p.pb) || 0) +
        (Number(p.f) || 0) +
        (Number(p.o) || 0);

      item.result.penalty = totalPenaltySeconds;
      item.result.penaltyTime = this.secondsToTimeString(totalPenaltySeconds);

      if (item.result.raceTime) {
        item.result.totalTime = await this.tambahWaktu(
          item.result.raceTime,
          item.result.penaltyTime
        );
      }

      this.evaluateHeatWinnersForCurrentRound();
      await this.assignRanks(this.visibleParticipants);
      this.syncWinLoseFromBracketToParticipants();
      this.persistRoundResults();
      this.computeWinLoseByHeat();
    },

    // map: NAMA_TIM (UPPER) -> { heat: number, pos: 0|1 }  (pos: team1=0, team2=1)
    // map: NAMA_TIM (UPPER) -> { slot: index match di bagan, pos: 0|1 }.
    // Pairing sekarang lewat SLOT (posisi klik operator di bagan), Heat cuma
    // label manual belakangan (bisa berapa saja, tidak berurutan sesuai
    // posisi bagan, dan tim BYE sengaja tidak punya Heat sama sekali) — jadi
    // urutan tabel & tanda Heat per baris harus ikut posisi SLOT di bagan
    // (dipakai di visibleParticipants() sbg kunci sort utama), bukan nomor
    // Heat itu sendiri.
    buildHeatOrderPosMapFromBracket() {
      var r = this.currentRound;
      var map = Object.create(null);
      if (!r || !r.matches) return map;

      r.matches.forEach(function (m, i) {
        var n1 =
          m.team1 && m.team1.name ? String(m.team1.name).toUpperCase() : "";
        var n2 =
          m.team2 && m.team2.name ? String(m.team2.name).toUpperCase() : "";
        if (n1) map[n1] = { slot: i, pos: 0 };
        if (n2) map[n2] = { slot: i, pos: 1 };
      });
      return map;
    },
    // Map nama tim → nomor heat (match index + 1) dari babak aktif
    buildHeatMapFromBracket() {
      var r = this.currentRound;
      var map = Object.create(null);
      if (!r || !r.matches) return map;

      r.matches.forEach(function (m, i) {
        var h = i + 1;
        var n1 =
          m.team1 && m.team1.name ? String(m.team1.name).toUpperCase() : "";
        var n2 =
          m.team2 && m.team2.name ? String(m.team2.name).toUpperCase() : "";
        if (n1) map[n1] = h;
        if (n2) map[n2] = h;
      });
      return map;
    },

    // mapping tim -> nomor heat (index match + 1) pada babak aktif
    getPB(item, key) {
      const has = item && item.result;
      const pb = has && item.result.penalties;
      const v = pb && typeof pb[key] !== "undefined" ? pb[key] : 0;
      return Number.isFinite(+v) ? +v : 0;
    },

    getTotalPenalty(item) {
      const has = item && item.result;
      const pb = has && item.result.penalties;
      if (pb && typeof pb === "object") {
        const keys = ["s", "cl", "r1", "r2", "l1", "l2", "pb", "f", "o"];
        return keys.reduce((sum, k) => sum + (Number(pb[k]) || 0), 0);
      }
      // fallback ke skema lama (single value)
      const pen =
        has && typeof item.result.penalty !== "undefined"
          ? item.result.penalty
          : 0;
      return Number(pen || 0);
    },

    // identitas round saat ini utk map penyimpanan
    currentRoundKey() {
      const r = this.currentRound;
      return r ? String(r.id) : null;
    },

    // NEW: kumpulkan hasil tim-tim yg sedang tampil (babak aktif) & simpan ke localStorage
    persistRoundResults() {
      if (!this.roundResultsRootKey) return;
      const roundKey = this.currentRoundKey();
      if (!roundKey) return;

      // hanya simpan subset tim pada babak aktif (visibleParticipants)
      const pack = this.visibleParticipants.map((p) => ({
        nameTeam: String(p.nameTeam || p.teamName || ""),
        bibTeam: String(p.bibTeam || ""),
        result: { ...(p.result || {}) }, // start, finish, race, penalty, total, ranked, winLose, dll.
      }));

      const all = readAllRoundResults(this.roundResultsRootKey);
      all[roundKey] = pack;
      writeAllRoundResults(this.roundResultsRootKey, all);
    },

    // CHANGE: muat hasil tersimpan utk babak aktif
    loadRoundResultsForCurrentRound() {
      if (!this.roundResultsRootKey) return;

      const r = this.currentRound;
      if (!r) return;

      // ⬇️ Reset dulu hasil untuk round ini
      this.resetResultsForRound(r);

      const roundKey = String(r.id);
      const all = readAllRoundResults(this.roundResultsRootKey);
      const arr = Array.isArray(all[roundKey]) ? all[roundKey] : [];

      if (arr.length) {
        const indexByName = new Map(
          this.participantArr.map((p, i) => [
            String(p.nameTeam || p.teamName || "").toUpperCase(),
            i,
          ])
        );

        arr.forEach((row) => {
          const key = String(row.nameTeam || "").toUpperCase();
          const idx = indexByName.get(key);
          if (idx != null && idx > -1) {
            const tgt = this.participant[idx];
            // merge hasil dari storage ke result yang baru di-reset
            tgt.result = { ...tgt.result, ...(row.result || {}) };
            this.ensurePenaltiesObject(tgt.result);
          }
        });
      }

      // BUG FIX: override Heat dari round.matches (sumber kebenaran per-babak
      // — properti milik MATCH, bukan tim) setelah merge di atas. Snapshot
      // localStorage per-babak BISA korup kalau babak lain sempat diedit
      // sementara babak ini sedang ditampilkan sebelum fix di
      // _persistAfterCrossRoundEdit() ada (Heat babak lain "kebawa" masuk ke
      // snapshot babak ini). round.matches sendiri TIDAK PERNAH korup krn
      // Heat memang tersimpan langsung di situ per-babak — jadi selalu jadi
      // acuan akhir, menimpa apa pun hasil merge di atas. BYE tidak perlu
      // Heat sama sekali (heat: null).
      (r.matches || []).forEach((m) => {
        if (!m) return; // jaga2 bracket lama/korup dgn entry matches kosong
        [m.team1, m.team2].forEach((t) => {
          if (!t || !t.name) return;
          const p = this._findParticipantByTeam(t);
          if (!p || !p.result) return;
          this.$set(p.result, "heat", m.bye ? null : m.heat != null ? m.heat : null);
        });
      });

      // hitung ulang konsekuensi untuk round ini
      this.assignRanks(this.visibleParticipants);
      this.evaluateHeatWinnersForCurrentRound();
      this.syncWinLoseFromBracketToParticipants();
      this.computeWinLoseByHeat();
    },

    // NEW: bersihkan seluruh hasil per-babak (dipakai saat pindah halaman)
    clearAllRoundResults() {
      if (!this.roundResultsRootKey) return;
      localStorage.removeItem(this.roundResultsRootKey);
    },

    // NEW: tandai Win/Lose utk list berdasarkan winner di bracket utk babak aktif
    syncWinLoseFromBracketToParticipants() {
      const r = this.currentRound;
      if (!r) return;

      // map nama tim → object participant yg sedang tampil di tabel
      const nameMap = new Map(
        this.visibleParticipants.map(function (p) {
          return [String(p.nameTeam || p.teamName || "").toUpperCase(), p];
        })
      );

      (r.matches || []).forEach(function (m) {
        const t1 = m.team1 && m.team1.name ? m.team1.name.toUpperCase() : "";
        const t2 = m.team2 && m.team2.name ? m.team2.name.toUpperCase() : "";
        const w = m.winner && m.winner.name ? m.winner.name.toUpperCase() : "";
        const isBye = !!m.bye; // flag BYE dari bracket

        const P1 = t1 ? nameMap.get(t1) : null;
        const P2 = t2 ? nameMap.get(t2) : null;

        // default: null
        var v1 = null,
          v2 = null;

        if (isBye) {
          // kalau BYE, pemenang otomatis ada 1 tim saja
          if (w && t1 && w === t1) v1 = "Bye";
          if (w && t2 && w === t2) v2 = "Bye";
        } else if (w) {
          // match normal: Win/Lose sesuai pemenang
          if (t1) v1 = w === t1 ? "Win" : t2 ? "Lose" : null;
          if (t2) v2 = w === t2 ? "Win" : t1 ? "Lose" : null;
        }
        // kalau belum ada pemenang & bukan BYE → tetap null

        if (P1) {
          if (!P1.result) P1.result = {};
          P1.result.winLose = v1;
        }
        if (P2) {
          if (!P2.result) P2.result = {};
          P2.result.winLose = v2;
        }
      });
    },
    notify(type, detail, message = "Info") {
      if (this.$ipc || (window && window.ipcRenderer)) {
        const ir = this.$ipc || window.ipcRenderer;
        ir.send && ir.send("get-alert", { type, detail, message });
      }
      // bisa juga set state:
      this.lastErrorMessage = `${message}: ${detail}`;
    },
    notifyError(err, message = "Error") {
      const detail =
        (err && (err.message || err.toString())) || "Unknown error";
      this.notify("error", detail, message);
    },

    async loadDataScore(type) {
      try {
        ipcRenderer.send("option-ranked", type);
        ipcRenderer.once("option-ranked-reply", (_e, payload) => {
          // BUG FIX: `payload` = [] (array kosong, tidak ada dokumen yang
          // cocok) masih truthy di JS — `payload[0].data` di sini akan
          // throw TypeError ("Cannot read properties of undefined") yang
          // tidak pernah ketangkap try/catch luar (callback ini async,
          // dipanggil belakangan oleh ipcRenderer), jadi dataScore diam2
          // tidak pernah keisi. Cek eksplisit payload[0] dulu, sama seperti
          // pola aman di loadDataPenalties().
          this.dataScore =
            payload && payload[0] && Array.isArray(payload[0].data)
              ? payload[0].data
              : [];
        });
      } catch (error) {
        this.dataScore = [];
      }
    },

    async loadDataPenalties() {
      // Yes/No (dipakai dropdown R1/R2/L1/L2) bukan pilihan detik penalti —
      // ini murni hasil negosiasi marker, dipakai onPenaltyChange() utk
      // menghitung PB (0/50/100) otomatis. Tidak ada di optionPenalties,
      // jadi tetap statis di sini.
      this.ynChoices = [
        { label: "Yes", value: "Y" },
        { label: "No", value: "N" },
      ];

      try {
        // PENTING: tipe di database tersimpan sbg "HEADTOHEAD" (tanpa
        // underscore) — mengirim "HEAD_TO_HEAD" tidak pernah cocok dgn
        // dokumen manapun, sehingga query selalu kosong dan SEMUA dropdown
        // penalty (S/CL/F) selalu tanpa pilihan sama sekali.
        ipcRenderer.send("option-penalties", "HEADTOHEAD");

        ipcRenderer.once("option-penalties-reply", (_e, payload) => {
          // Bentuk data di DB adalah list datar {label, value, timePen}[]
          // (sama seperti SPRINT/SLALOM/DRR/RX) — BUKAN dikelompokkan per
          // kategori {category, choices}[]. S, CL, dan F sama-sama dropdown
          // "berapa detik penalti" jadi memakai list yang sama.
          const data =
            payload && payload[0] && Array.isArray(payload[0].data)
              ? payload[0].data
              : [];
          this.sChoices = data;
          this.fChoices = data;
          this.clChoices = data;
        });
      } catch (error) {
        this.sChoices = [];
        this.fChoices = [];
        this.clChoices = [];
      }
    },

    // PS (Pen. Start), CL (Cut Line), dan PF (Pen. Finish) bisa
    // dikustomisasi independen per-event lewat modal Race Settings. Kalau
    // event ini belum pernah diatur, sChoices/clChoices/fChoices dari
    // optionPenalties (global, diisi loadDataPenalties()) tetap dipakai.
    async loadRaceSettings() {
      try {
        if (typeof ipcRenderer === "undefined" || !this.currentEventId) return;
        await new Promise((resolve) => {
          ipcRenderer.once("race-settings:get-reply", (_e, res) => {
            const h2hSettings = res && res.ok && res.settings && res.settings.h2h;
            const toList = (arr) =>
              Array.isArray(arr) && arr.length > 0
                ? arr.map((p) => ({
                    label: String(p.label || p.value),
                    value: Number(p.value) || 0,
                    timePen: "",
                  }))
                : null;

            const sList = h2hSettings && toList(h2hSettings.startPenalties);
            const clList = h2hSettings && toList(h2hSettings.cutLinePenalties);
            const fList = h2hSettings && toList(h2hSettings.finishPenalties);

            if (sList) this.sChoices = sList;
            if (clList) this.clChoices = clList;
            if (fList) this.fChoices = fList;

            // Score by Rank per-event (Race Settings) — override tabel
            // global optionRanked "HEADTOHEAD" (dimuat loadDataScore()) kalau
            // event ini sudah dikustomisasi. Dipakai scoreForRank()/
            // getScoreByRanked() yg jadi sumber skor "Save Overall".
            const scoreByRank =
              h2hSettings && Array.isArray(h2hSettings.scoreByRank)
                ? h2hSettings.scoreByRank
                : null;
            if (scoreByRank && scoreByRank.length) {
              this.dataScore = scoreByRank.map((p) => ({
                ranking: Number(p.ranking) || 0,
                score: Number(p.score) || 0,
              }));
            }
            this.h2hDefaultScoreBeyondRank =
              Number(h2hSettings && h2hSettings.defaultScoreBeyondRank) || 0;

            resolve();
          });
          ipcRenderer.send("race-settings:get", this.currentEventId);
        });
      } catch (error) {
        // biarkan sChoices/clChoices/fChoices dari sumber global jika gagal
        // memuat override
      }
    },
    /** Method podium config */
    getFinalRound() {
      return (this.rounds || []).find((r) => !r.bronze && r.size === 2) || null;
    },
    getBronzeRound() {
      return (this.rounds || []).find((r) => r.bronze) || null;
    },

    /** Reset podium */
    clearPodium() {
      this.podium = { gold: null, silver: null, bronze: null, fourth: null };
    },

    /** Hitung podium dari keadaan Final & Bronze saat ini */
    computePodium() {
      this.clearPodium();

      const final = this.getFinalRound();
      if (final && final.matches && final.matches[0]) {
        const fm = final.matches[0];
        if (fm.winner && fm.winner.name) {
          // Juara 1 = pemenang final
          this.podium.gold = fm.winner.name;
          // Juara 2 = lawan pemenang final
          const runnerUp =
            fm.winner.name === (fm.team1 && fm.team1.name)
              ? fm.team2
              : fm.team1;
          if (runnerUp && runnerUp.name) this.podium.silver = runnerUp.name;
        }
      }

      const bronze = this.getBronzeRound();
      if (bronze && bronze.matches && bronze.matches[0]) {
        const bm = bronze.matches[0];
        if (bm.winner && bm.winner.name) {
          // Juara 3 = pemenang bronze
          this.podium.bronze = bm.winner.name;
          // Juara 4 = lawan pemenang bronze
          const fourth =
            bm.winner.name === (bm.team1 && bm.team1.name)
              ? bm.team2
              : bm.team1;
          if (fourth && fourth.name) this.podium.fourth = fourth.name;
        }
      }
    },

    /** Babak configuration */
    // NEW: buat placeholder participant jika tim ada di bracket tapi belum ada di data
    normalizeTeamForViewPlaceholder(name) {
      return {
        penaltyChoices: [0, 5, 10],
        nameTeam: String(name),
        bibTeam: "",
        startOrder: "",
        praStart: "",
        intervalRace: "",
        statusId: 0,
        result: {
          startTime: "",
          finishTime: "",
          raceTime: "",
          penaltyTime: "00:00:00.000",
          penalty: 0,
          totalTime: "",
          ranked: "",
          score: "",
          winLose: null,
          heat: null,
        },
        otr: {
          startTime: "",
          finishTime: "",
          raceTime: "",
          penaltyTime: "00:00:00.000",
          penalty: 0,
          totalTime: "",
          ranked: "",
          score: "",
          winLose: null,
          heat: null,
        },
      };
    },

    // CHANGED: setelah build, set currentRoundIndex = round awal terbesar (firstRoundIndex)
    rebuildBracketDynamic(nTeams) {
      this.rounds = this.buildEmptyBracket(nTeams);
      this.currentRoundIndex = this.firstRoundIndex;
      this.computePodium();
    },

    // NEW: navigasi babak
    prevRound() {
      this.persistRoundResults();
      if (this.currentRoundIndex > 0) this.currentRoundIndex--;
    },
    nextRound() {
      // simpan hasil round aktif dulu
      this.persistRoundResults();
      if (this.currentRoundIndex < this.rounds.length - 1)
        this.currentRoundIndex++;
    },
    /** End babak configuration */

    /** Hitung pangkat dua berikutnya */
    nextPow2(n) {
      let p = 1;
      while (p < n) p <<= 1;
      return p;
    },

    /** Nama ronde human friendly berdasar size */
    roundName(size) {
      if (size === 2) return "Final A";
      if (size === 4) return "Semifinals";
      if (size === 8) return "Quarterfinals";
      if (size === 16) return "Round of 16";
      if (size === 32) return "Round of 32";
      return `Round of ${size}`;
    },

    /** Satu slot match kosong — team1/team2 diisi manual lewat klik bagan
     * (assignTeamToMatchSlot), BUKAN otomatis dari Heat. Heat baru dipilih
     * operator SETELAH kedua sisi terisi tim riil (lihat openHeatEditor). */
    makeEmptySlot(id) {
      return {
        id,
        team1: { name: "", bibTeam: "" },
        team2: { name: "", bibTeam: "" },
        score1: null,
        score2: null,
        winner: null,
        bye: false,
        heat: null,
      };
    },

    /** Buat satu kolom ronde kosong, matches PRE-POPULATED sejumlah slot yang
     * dibutuhkan (size/2) supaya posisi slot stabil (matchIndex konsisten)
     * begitu operator mulai klik-assign tim satu per satu. */
    makeEmptyRound(id, size) {
      const expected = Math.max(1, Math.floor(size / 2));
      const matches = [];
      for (let i = 0; i < expected; i++) matches.push(this.makeEmptySlot(i + 1));
      return { id: `R${id}`, name: this.roundName(size), size, matches, pool: [] };
    },

    /** Bangun struktur default kosong (kolom dari besar → final) */
    buildEmptyBracket(nTeams) {
      const cap = Math.min(Math.max(4, nTeams), 32); // clamp 4..32
      const base = this.nextPow2(cap); // 4, 8, 16, 32
      const rounds = [];
      let id = 1;
      for (let size = base; size >= 2; size >>= 1) {
        rounds.push(this.makeEmptyRound(id++, size));
      }
      // babak pertama diisi seluruh tim terdaftar — operator klik slot mana
      // pun di bagan utk menaruh tim itu (tidak ada auto-pairing dari Heat).
      if (rounds.length) {
        rounds[0].pool = this.collectRegisteredTeams();
      }
      // Tambah Final B bila size awal >= 4
      if (this.showBronze && base >= 4) {
        rounds.splice(rounds.length - 1, 0, {
          // sisipkan sebelum Final
          id: "R_B",
          name: "Final B",
          size: 2,
          matches: [this.makeEmptySlot(1)],
          pool: [],
          bronze: true,
        });
      }
      return rounds;
    },

    /** Ambil daftar tim terdaftar (unik by nama) — tanpa urutan seeding */
    collectRegisteredTeams(limit = 32) {
      const src = (this.participantArr || []).slice(0, limit).map((p) => ({
        name: String(p.nameTeam || p.teamName || ""),
        bibTeam: String(p.bibTeam || ""),
      }));
      const seen = new Set();
      return src.filter((t) => t.name && !seen.has(t.name) && seen.add(t.name));
    },

    // Fitur "Highlight per Round": tandai match di diagram bracket yang
    // termasuk babak (currentRound) yang sedang dipilih lewat Prev/Next
    // Round / dropdown Select Round di bawah — supaya operator langsung
    // lihat bagian mana dari bracket yang sedang dia isi hasilnya di tabel.
    isActiveRoundMatch(match) {
      return !!(
        this.currentRound &&
        match &&
        match.roundId === this.currentRound.id
      );
    },

    // Bangun satu "game" utk vue-tournament-bracket dari match internal
    // app (bisa undefined kalau babak itu belum pernah di-sync, mis.
    // babak yang belum pernah dikunjungi operator — tampilkan placeholder
    // "TBD" supaya struktur pohon bracket tetap utuh/tidak error).
    _toVtbGame(m, round, idx) {
      // roundId/matchIndex/side ditempel di player supaya slot "player" (yang
      // cuma dikasih { player } oleh library, tanpa akses ke match/round)
      // tetap tahu HARUS taruh tim di slot mana kalau diklik (lihat
      // assignTeamToMatchSlot()/removeTeamFromMatchSlot()) — pairing kini
      // ditentukan lewat POSISI slot yang diklik operator, BUKAN dari Heat.
      const mkPlayer = (side) => {
        const team = m && m[side];
        const name = team && team.name;
        if (!name) {
          return {
            id: `${round.id}-${idx}-${side}-empty`,
            name: m && m.bye ? "BYE" : "TBD",
            isPlaceholder: true,
            // BUG FIX: library cuma skip styling winner/defeated kalau
            // winner null/undefined (lihat getPlayerClass() di
            // vue-tournament-bracket) — `false` dianggap "defeated" (background
            // merah)! Slot TBD/BYE yang belum terisi HARUS null supaya tetap
            // abu-abu netral, bukan merah seolah-olah tim ini "kalah".
            winner: null,
            roundId: round.id,
            matchIndex: idx,
            side,
          };
        }
        // BUG FIX (sama seperti placeholder di atas): kalau match BELUM py
        // pemenang (m.winner null — waktu belum lengkap/belum diputuskan),
        // hasil HARUS null (bukan `false`) supaya kedua tim tetap netral
        // abu-abu, bukan otomatis kelihatan "kalah" (merah) sebelum
        // pertandingannya benar2 selesai.
        const isWinner = m.winner ? m.winner.name === name : null;

        // Medali (pengganti section "Podium" yang dihapus) — cuma muncul
        // di Final A (gold utk menang, silver utk kalah) & Final B (bronze
        // utk menang, yg kalah/4th dapat teks "4th" bold-italic — bukan
        // ikon medali — sesuai permintaan). Diam2 null kalau match belum
        // py pemenang (isWinner === null).
        let medal = null;
        const isFinalA = !round.bronze && round.size === 2;
        const isFinalB = !!round.bronze;
        if (isFinalA) {
          if (isWinner === true) medal = "gold";
          else if (isWinner === false) medal = "silver";
        } else if (isFinalB) {
          if (isWinner === true) medal = "bronze";
          else if (isWinner === false) medal = "fourth";
        }

        return {
          id: name,
          name,
          bib: team.bibTeam || "",
          isPlaceholder: false,
          winner: isWinner,
          medal,
          roundId: round.id,
          matchIndex: idx,
          side,
          time: this._teamResultTime(team, round.id),
        };
      };

      const p1 = mkPlayer("team1");
      const p2 = mkPlayer("team2");
      const canDeclareWinner = !!(
        m &&
        !m.bye &&
        m.team1 &&
        m.team1.name &&
        m.team2 &&
        m.team2.name
      );

      return {
        id: (m && m.id) || `${round.id}-${idx}`,
        roundId: round.id,
        matchIndex: idx,
        heat: m && m.heat,
        bye: !!(m && m.bye),
        canDeclareWinner,
        // nama babak ditempel PERMANEN di tiap kartu (bukan cuma badge
        // "Babak Aktif" yang cuma nongol utk babak yg lagi dipilih) supaya
        // operator selalu tahu kartu ini punya babak apa tanpa perlu
        // menyesuaikan Prev/Next Round dulu.
        roundName: round.bronze ? "Final B" : round.name,
        player1: p1,
        player2: p2,
      };
    },

    // Dipanggil tiap kali Heat berubah lewat klik di bagan (assign/hapus/ubah
    // nomor). $set pada p.result.heat SEHARUSNYA sudah reaktif sendiri, tapi
    // reassign array `this.participant` ke referensi BARU (bukan cuma
    // $forceUpdate) memaksa SEMUA computed turunan (participantArr,
    // visibleParticipants, dst.) — dan tabel Heat yang bergantung padanya —
    // pasti ikut re-render segera, tanpa bergantung pada apakah 3rd-party
    // bracket component/computed chain menangkap perubahan nested dgn benar.
    _bumpParticipantReactivity() {
      this.participant = Array.isArray(this.participant)
        ? this.participant.slice()
        : this.participant;
      this.$nextTick(() => this.$forceUpdate());
    },

    // BUG FIX: bagan menampilkan SEMUA babak sekaligus, jadi operator bisa
    // assign tim/Heat di match babak MANAPUN kapan saja — TIDAK harus babak
    // yang lagi dipilih (currentRoundIndex) di tabel/Prev-Next. Tapi
    // `result` adalah SATU object yang dipakai bersama lintas babak, jadi
    // (1) simpan snapshot ke babak yang BENAR2 diedit (bukan selalu
    // currentRound seperti persistRoundResults() biasa), lalu (2) kalau
    // babak yang diedit BUKAN babak yang lagi ditampilkan di tabel,
    // pulihkan live state ke data babak yang ditampilkan itu — supaya Heat
    // babak lain (mis. Heat 14 semifinal) tidak "bocor" nempel ke tim yang
    // kebetulan juga tampil di tabel babak yang sedang dibuka (mis.
    // Quarterfinal, yang cuma py Heat 3/4).
    _persistAfterCrossRoundEdit(editedRound) {
      if (!editedRound) return;
      this.persistRoundResultsFor(editedRound);
      if (!this.currentRound || editedRound.id !== this.currentRound.id) {
        this.loadRoundResultsForCurrentRound();
      }
    },

    // Daftar tim yang masih menunggu dipasangkan (belum ada Heat) pada satu
    // babak — dipakai utk isi modal "Pilih Tim" klik-assign di slot TBD/BYE.
    poolForRound(roundId) {
      const r = (this.rounds || []).find((rr) => rr.id === roundId);
      return (r && r.pool) || [];
    },

    // Buka modal "Pilih Tim" saat slot TBD/BYE di bagan diklik.
    // Cari participant asli (this.participantArr) dari stub tim {name,bibTeam}
    // yang dipakai di round.pool/round.matches.
    _findParticipantByTeam(team) {
      if (!team || !team.name) return null;
      const wantKey =
        String(team.name || "").trim().toUpperCase() +
        "|" +
        String(team.bibTeam || "").trim();
      return (this.participantArr || []).find(
        (pp) =>
          String(pp.nameTeam || pp.teamName || "").trim().toUpperCase() +
            "|" +
            String(pp.bibTeam || "").trim() ===
          wantKey
      );
    },

    // Waktu hasil tim (totalTime kalau ada penalti, else raceTime mentah) —
    // ditampilkan di bagan begitu tim selesai bertanding (punya start+finish).
    // BUG FIX: `result` adalah SATU object yang dipakai bersama lintas SEMUA
    // babak (cuma menyimpan data babak yang SEDANG aktif/dimuat) — tapi
    // bagan menampilkan SEMUA babak sekaligus. Kalau round yang lagi
    // di-render BUKAN currentRound, this.participantArr.result tidak bisa
    // dipercaya (bisa saja masih membawa waktu dari babak lain yang sedang
    // aktif) — waktu tim itu utk round tsb harus dibaca dari SNAPSHOT
    // localStorage per-babak, bukan dari state live.
    _teamResultTime(team, roundId) {
      if (!team || !team.name) return "";
      if (this.currentRound && roundId === this.currentRound.id) {
        const p = this._findParticipantByTeam(team);
        const r = p && p.result;
        if (r && (r.totalTime || r.raceTime)) return r.totalTime || r.raceTime;
        return "";
      }
      return this._teamResultTimeFromSnapshot(team, roundId);
    },

    _teamResultTimeFromSnapshot(team, roundId) {
      if (!this.roundResultsRootKey || !roundId) return "";
      const all = readAllRoundResults(this.roundResultsRootKey);
      const rows = Array.isArray(all[roundId]) ? all[roundId] : [];
      const wantKey = String(team.name || "").trim().toUpperCase();
      const row = rows.find(
        (r) => String(r.nameTeam || "").trim().toUpperCase() === wantKey
      );
      const rr = row && row.result;
      if (!rr) return "";
      return rr.totalTime || rr.raceTime || "";
    },

    // Set heat seorang tim ke null (dipakai saat tim jadi BYE/dilepas dari
    // match riil — BYE tidak perlu nomor Heat sama sekali).
    _clearParticipantHeat(team) {
      const p = this._findParticipantByTeam(team);
      if (p && p.result) this.$set(p.result, "heat", null);
    },

    // Setelah team1/team2 sebuah slot berubah, tentukan ulang status BYE-nya:
    // - 2 sisi terisi  -> match riil, TIDAK bye, heat TETAP kosong sampai
    //   operator klik badge "+ Tentukan Heat" (openHeatEditor).
    // - 1 sisi terisi  -> otomatis BYE, tim itu auto-menang, heat dikosongkan
    //   (BYE tidak perlu Heat sama sekali, sesuai permintaan user).
    // - 0 sisi terisi  -> slot kosong total, bukan apa2.
    _recomputeMatchByeState(match) {
      const has1 = !!(match.team1 && match.team1.name);
      const has2 = !!(match.team2 && match.team2.name);
      if (has1 && has2) {
        // BUG FIX: kalau match ini SEBELUMNYA bye (cuma 1 sisi terisi),
        // match.winner sudah ke-auto-set ke tim solo itu. Begitu sisi kedua
        // diisi (jadi match riil), winner LAMA itu HARUS dibersihkan — kalau
        // tidak, tim yang tadinya sendirian tetap tampil hijau "menang" dan
        // lawan barunya tampil merah "kalah" padahal pertandingannya belum
        // pernah berlangsung sama sekali.
        match.bye = false;
        match.winner = null;
      } else if (has1 || has2) {
        const solo = has1 ? match.team1 : match.team2;
        match.bye = true;
        match.winner = solo;
        match.heat = null;
        this._clearParticipantHeat(solo);
      } else {
        match.bye = false;
        match.winner = null;
        match.heat = null;
      }
    },

    openAssignPicker(player) {
      this.assignPicker = {
        show: true,
        roundId: player.roundId,
        matchIndex: player.matchIndex,
        side: player.side,
      };
    },

    // Tim dipilih di modal -> ditaruh LANGSUNG ke slot (sisi) yang diklik,
    // TANPA nomor Heat apa pun — operator yang menentukan Heat belakangan,
    // dan HANYA kalau kedua sisi match ini sudah terisi tim riil (lihat
    // openHeatEditor). Pairing sekarang murni dari POSISI slot yang diklik,
    // bukan dari kesamaan nomor Heat.
    confirmAssignTeam(team) {
      this.assignTeamToMatchSlot(
        {
          roundId: this.assignPicker.roundId,
          matchIndex: this.assignPicker.matchIndex,
          side: this.assignPicker.side,
        },
        team
      );
      this.assignPicker.show = false;
    },

    assignTeamToMatchSlot(player, team) {
      const round = (this.rounds || []).find((r) => r.id === player.roundId);
      if (!round || !team) return;
      if (!Array.isArray(round.matches)) this.$set(round, "matches", []);

      // BUG FIX: bracket yang dimuat dari DB bisa saja masih pakai format
      // LAMA (round.matches cuma sepanjang jumlah heat yang pernah dipakai,
      // bukan sejumlah slot penuh size/2) — kalau matchIndex yang diklik
      // (mis. slot ke-3/4) belum ada di array, buat slot kosong dulu di
      // situ (pakai $set krn set-by-index butuh reaktivitas eksplisit di
      // Vue 2) alih2 diam2 gagal assign.
      let match = round.matches[player.matchIndex];
      if (!match) {
        match = this.makeEmptySlot(player.matchIndex + 1);
        this.$set(round.matches, player.matchIndex, match);
      }

      this.$set(match, player.side, {
        name: team.name,
        bibTeam: team.bibTeam || "",
      });

      // buang dari pool babak ini — tim sudah menempati slot
      round.pool = (round.pool || []).filter(
        (t) =>
          String(t.name || "").trim().toUpperCase() !==
          String(team.name || "").trim().toUpperCase()
      );

      // BUG FIX: reset "mulai dari nol" saat tim maju babak (dilakukan
      // sekali oleh advanceToNextRound() lewat _resetParticipantResultsByName())
      // bisa "hilang" lagi kalau operator sempat membuka tab babak
      // SEBELUMNYA (mis. Semifinal) di antara klik Advance dan klik
      // assign-ke-slot ini — loadRoundResultsForCurrentRound() MEMANG BENAR
      // memulihkan waktu
      // asli babak lama itu ke `result` yang dipakai bersama (supaya tab
      // itu tampil benar), tapi begitu terjadi, status "sudah direset utk
      // babak baru" jadi hilang. Assign-ke-slot ini lalu menyimpan APA
      // ADANYA `result` yang sedang aktif — yang ternyata sudah "kembali"
      // berisi waktu babak lama itu — bocor ke babak baru (Final A/Final
      // B, dst). Perbaikan: SELALU pastikan SELURUH peserta babak ini
      // fresh SEBELUM disimpan (bukan cuma tim yang baru diassign — tim
      // LAIN yang sudah lebih dulu ada di babak ini bisa saja live
      // result-nya juga masih membawa babak lain), KECUALI babak ini
      // sendiri sudah pernah punya catatan tersimpan utk tim itu (mis.
      // sempat dihapus dari slot lalu ditambahkan lagi ke babak yang SAMA
      // — hasilnya harus tetap ada). Lihat _ensureFreshResultsForRound().
      this._ensureFreshResultsForRound(round);

      this._recomputeMatchByeState(match);

      this._persistAfterCrossRoundEdit(round);
      this.saveBracketToDB(true);
      this._bumpParticipantReactivity();
    },

    // Reset live `p.result` ke kosong HANYA kalau babak `round` ini belum
    // pernah punya snapshot tersimpan utk tim `team` — jadi aman dipanggil
    // berulang tanpa menghapus data yang memang sudah sah milik babak ini.
    _ensureFreshResultForRoundEntry(team, round) {
      if (!team || !team.name || !round) return;
      const p = this._findParticipantByTeam(team);
      if (!p) return;

      // BUG FIX: cek pertama cuma mengecek APAKAH baris tersimpan sudah
      // ADA — tapi advanceToNextRound() SENDIRI sudah menulis baris
      // placeholder (result KOSONG) utk tim ini ke
      // babak baru saat memindahkannya ke pool. Jadi "baris sudah ada"
      // SELALU true utk tim yang baru saja maju babak, dan reset di sini
      // jadi tidak pernah kejadian — persis skenario yang bocor. Yang
      // benar dicek: apakah baris itu py DATA WAKTU SUNGGUHAN (bukan
      // placeholder kosong). Kalau tidak ada waktu sungguhan tersimpan,
      // tetap paksa reset (aman/idempoten) — cuma lewati reset kalau tim
      // ini MEMANG sudah py catatan hasil race asli di babak ini.
      if (this.roundResultsRootKey) {
        const all = readAllRoundResults(this.roundResultsRootKey);
        const rows = Array.isArray(all[String(round.id)]) ? all[String(round.id)] : [];
        const row = rows.find(
          (r) =>
            String((r && r.nameTeam) || "").trim().toUpperCase() ===
            String(team.name).trim().toUpperCase()
        );
        const hasRealData = !!(
          row &&
          row.result &&
          (row.result.startTime || row.result.raceTime)
        );
        if (hasRealData) {
          // BUG FIX: dulu cuma "return" (tidak disentuh) di sini — tapi
          // live `p.result` saat itu belum tentu SAMA dgn hasil asli yang
          // sudah tersimpan (bisa saja live-nya kebetulan lagi kosong/isi
          // babak lain krn alasan lain) — persist yang dipanggil SETELAH
          // fungsi ini tetap akan menyimpan APA ADANYA live state itu,
          // menimpa data asli tanpa sengaja. Pulihkan dulu live state dari
          // data asli babak ini, baru aman dibiarkan tersimpan lagi.
          p.result = { ...p.result, ...row.result };
          this.ensurePenaltiesObject(p.result);
          return;
        }
      }

      p.result = this.makeEmptyResult();
      this.ensurePenaltiesObject(p.result);
    },

    // BUG FIX: _persistAfterCrossRoundEdit() menyimpan snapshot SATU BABAK
    // PENUH (participantsForRound() — semua match + pool babak itu), bukan
    // cuma 2 tim yang baru diedit. Kalau HANYA 2 tim yang baru diedit yang
    // di-"fresh"-kan (assignTeamToMatchSlot/renumberMatchHeat lama), tim
    // LAIN di babak yang sama yang live p.result-nya kebetulan masih
    // membawa data babak LAIN (mis. baru dipulihkan lewat
    // loadRoundResultsForCurrentRound() krn tab babak lain sempat dibuka)
    // ikut ke-persist APA ADANYA saat itu — waktu babak lain "bocor" ke
    // tim yang sama sekali tidak disentuh oleh aksi operator saat ini.
    // Panggil ini SEBELUM mengubah field spesifik (heat/assign/dst.) di
    // ketiga entry point cross-round edit, supaya SELURUH peserta babak
    // ini benar2 merefleksikan data babak ini sebelum di-persist.
    _ensureFreshResultsForRound(round) {
      if (!round) return;
      this.participantsForRound(round).forEach((p) => {
        const name = p && (p.nameTeam || p.teamName);
        if (!name) return;
        this._ensureFreshResultForRoundEntry(
          { name, bibTeam: p.bibTeam || "" },
          round
        );
      });
    },

    // Klik tim yang SUDAH terisi di bagan -> "Hapus dari Slot" -> tim itu
    // dilepas & kembali ke pool. Reuse _resetParticipantResultsByName supaya
    // bersih total (heat, start/finish time, penalti, dll.).
    openRemoveConfirm(player) {
      this.$bvModal
        .msgBoxConfirm(
          `Hapus ${player.name} dari slot ini? Tim akan kembali ke pool.`,
          {
            title: "Hapus dari Bagan",
            okTitle: "Hapus",
            okVariant: "danger",
            cancelTitle: "Batal",
            centered: true,
          }
        )
        .then((ok) => {
          if (ok) this.removeTeamFromMatchSlot(player);
        })
        .catch(() => {});
    },

    removeTeamFromMatchSlot(player) {
      const round = (this.rounds || []).find((r) => r.id === player.roundId);
      if (!round || player.isPlaceholder || !player.name) return;
      const match = round.matches[player.matchIndex];
      if (!match) return;

      const removed = match[player.side];
      if (!removed || !removed.name) return;

      // Pastikan SELURUH peserta babak ini fresh dulu (bukan cuma tim yang
      // dihapus) — _persistAfterCrossRoundEdit() di bawah menyimpan
      // snapshot SATU BABAK PENUH, jadi tim lain di babak yang sama yang
      // live result-nya kebetulan masih membawa babak lain juga harus
      // dipulihkan dulu, sama seperti assignTeamToMatchSlot()/
      // renumberMatchHeat().
      this._ensureFreshResultsForRound(round);

      this._resetParticipantResultsByName([removed.name]);
      this.$set(match, player.side, { name: "", bibTeam: "" });
      round.pool = (round.pool || []).concat([
        { name: removed.name, bibTeam: removed.bibTeam || "" },
      ]);

      // match bubar dari match riil (kalau sebelumnya py Heat, sisi yang
      // TERSISA otomatis jadi BYE lagi lewat _recomputeMatchByeState, yang
      // juga mengosongkan Heat-nya — BYE tidak perlu Heat.
      this._recomputeMatchByeState(match);

      this._persistAfterCrossRoundEdit(round);
      this.saveBracketToDB(true);
      this._bumpParticipantReactivity();
    },

    // Klik badge Heat (atau "+ Tentukan Heat") di footer match riil (2 tim,
    // bukan BYE) -> buka modal utk pilih/ubah nomor Heat match itu.
    openHeatEditor(match) {
      const suggested = Math.max(this.getEventHeatUsage().maxHeat || 0, 0) + 1;
      this.heatEditor = {
        show: true,
        roundId: match.roundId,
        matchIndex: match.matchIndex,
        newHeat: match.heat || suggested,
      };
    },

    confirmHeatEditor() {
      const newHeat = Math.max(1, parseInt(this.heatEditor.newHeat, 10) || 0);
      if (!newHeat) return;
      const round = (this.rounds || []).find(
        (r) => r.id === this.heatEditor.roundId
      );
      if (!round) return;
      const match = round.matches[this.heatEditor.matchIndex];
      if (match) this.renumberMatchHeat(round, match, newHeat);
      this.heatEditor.show = false;
    },

    // Set/ubah nomor Heat SATU match riil (2 tim) sekaligus utk kedua sisi.
    // Hanya berlaku utk match yang KEDUA sisinya sudah terisi tim riil &
    // bukan BYE — BYE tidak pernah butuh Heat. Tolak kalau newHeat sudah
    // dipakai tim lain (kategori H2H manapun di event ini).
    renumberMatchHeat(round, match, newHeat) {
      if (!match || match.bye) return;
      const has1 = !!(match.team1 && match.team1.name);
      const has2 = !!(match.team2 && match.team2.name);
      if (!has1 || !has2) return;
      if (match.heat === newHeat) return;

      const { usage } = this.getEventHeatUsage();
      if ((usage[newHeat] || 0) > 0) {
        this.$bvToast &&
          this.$bvToast.toast(
            `Heat ${newHeat} sudah dipakai tim lain di event ini.`,
            { variant: "warning", autoHideDelay: 2500, title: "Tidak bisa diubah" }
          );
        return;
      }

      // BUG FIX: `p.result` adalah SATU object yang dipakai bersama lintas
      // SEMUA babak, dan operator BISA mengubah Heat match babak X sambil
      // tabel sedang menampilkan babak Y (Y != X) — lihat catatan cross-
      // round di _persistAfterCrossRoundEdit(). _persistAfterCrossRoundEdit()
      // di bawah menyimpan snapshot SATU BABAK PENUH (semua match + pool
      // babak X), bukan cuma 2 tim di match ini — jadi SEMUA peserta babak
      // X harus dipastikan fresh dulu (bukan cuma 2 tim match ini), kalau
      // tidak tim LAIN di babak yang sama yang live result-nya kebetulan
      // masih membawa babak lain ikut ke-persist tercampur juga. Panggil
      // SEBELUM match.heat diubah supaya urutan operasi selalu: pulihkan
      // semua peserta ke data babak ini -> baru tempelkan heat baru.
      this._ensureFreshResultsForRound(round);

      match.heat = newHeat;
      [match.team1, match.team2].forEach((t) => {
        const p = this._findParticipantByTeam(t);
        if (p) {
          if (!p.result) this.$set(p, "result", this.makeEmptyResult());
          this.$set(p.result, "heat", newHeat);
        }
      });

      this._persistAfterCrossRoundEdit(round);
      this.saveBracketToDB(true);
      this._bumpParticipantReactivity();
    },

    /** Pindahkan semua pemenang babak aktif ke pool babak kompetitif berikutnya */
    // Memindahkan pemenang babak aktif ke pool babak berikutnya (Final A,
    // dst). KHUSUS kalau babak yang ditinggalkan adalah Semifinal, tombol
    // ini SEKALIGUS mengarahkan 2 tim yang KALAH ke pool Final B — operator
    // tidak perlu lagi tombol "Assign Final B" terpisah (dulu ada, sekarang
    // digabung ke sini atas permintaan user, sekaligus menutup seluruh
    // kelas bug "tim kalah bawa waktu Semifinal ke Final B" yang muncul
    // krn ada jeda antara klik Advance & klik Assign Final B — di mana
    // operator sempat membuka tab Semifinal lagi di antaranya, memulihkan
    // waktu asli ke `result` yang dipakai bersama sebelum akhirnya
    // ke-assign salah ke Final B. Sekarang keduanya jadi SATU aksi atomik.
    advanceToNextRound() {
      const round = this.currentRound;
      if (!round || round.bronze) {
        this.$bvToast &&
          this.$bvToast.toast(
            "Tidak ada babak kompetitif yang sedang aktif.",
            { variant: "warning", autoHideDelay: 2500, title: "Tidak bisa lanjut" }
          );
        return;
      }

      if (!round.matches.length || (round.pool || []).length) {
        this.$bvToast &&
          this.$bvToast.toast(
            "Masih ada tim yang belum dipasangkan Heat pada babak ini.",
            { variant: "warning", autoHideDelay: 2500, title: "Belum lengkap" }
          );
        return;
      }

      const orphanEmpty = round.matches.filter(
        (m) =>
          !m.bye &&
          !(m.team1 && m.team1.name) &&
          !(m.team2 && m.team2.name)
      );
      if (orphanEmpty.length) {
        this.$bvToast &&
          this.$bvToast.toast(
            `Ada ${orphanEmpty.length} slot match yang masih kosong (belum diisi tim apa pun). Isi dulu slot itu di bagan sebelum lanjut.`,
            { variant: "warning", autoHideDelay: 3000, title: "Belum lengkap" }
          );
        return;
      }

      const undecided = round.matches.filter(
        (m) => m.team1.name && m.team2.name && !m.winner
      );
      if (undecided.length) {
        this.$bvToast &&
          this.$bvToast.toast(
            `Masih ada ${undecided.length} match yang belum punya pemenang.`,
            { variant: "warning", autoHideDelay: 2500, title: "Belum lengkap" }
          );
        return;
      }

      let nextRoundIndex = -1;
      for (let i = this.currentRoundIndex + 1; i < this.rounds.length; i++) {
        if (!this.rounds[i].bronze) {
          nextRoundIndex = i;
          break;
        }
      }
      if (nextRoundIndex === -1) {
        this.$bvToast &&
          this.$bvToast.toast(
            "Ini sudah babak terakhir (Final) — tidak ada babak berikutnya untuk dituju.",
            { variant: "info", autoHideDelay: 2500, title: "Sudah Final" }
          );
        return;
      }

      const winners = round.matches
        .map((m) => m.winner)
        .filter((w) => w && w.name);

      if (!winners.length) {
        this.$bvToast &&
          this.$bvToast.toast(
            "Tidak ada pemenang yang bisa dipindahkan ke babak berikutnya.",
            { variant: "danger", autoHideDelay: 3000, title: "Advance gagal" }
          );
        return;
      }

      const next = this.rounds[nextRoundIndex];

      // Khusus meninggalkan Semifinal (size 4, bukan bronze): sekaligus
      // siapkan pool Final B dari 2 tim yang kalah. Skip diam2 (bukan
      // error) kalau Final B tidak ada di bagan ini, atau sudah pernah
      // terisi 2 tim sebelumnya (mis. Reset manual/assign ulang) — winners
      // tetap lanjut ke Final A seperti biasa.
      const isLeavingSemifinal = !round.bronze && round.size === 4;
      let bronze = null;
      let bronzeLosers = [];
      if (isLeavingSemifinal) {
        bronze = this.rounds.find((r) => r.bronze) || null;
        if (bronze) {
          const bronzeHas1 = !!(bronze.matches[0] && bronze.matches[0].team1 && bronze.matches[0].team1.name);
          const bronzeHas2 = !!(bronze.matches[0] && bronze.matches[0].team2 && bronze.matches[0].team2.name);
          if (!bronzeHas1 || !bronzeHas2) {
            const losers = round.matches.map((m) => {
              if (!m.winner) return null;
              const lose =
                m.winner.name === (m.team1 && m.team1.name) ? m.team2 : m.team1;
              return lose && lose.name ? lose : null;
            });
            if (losers[0] && losers[1]) bronzeLosers = [losers[0], losers[1]];
          }
        }
      }

      // PENTING: item.result (start/finish/heat/dll.) adalah satu object yang
      // dipakai bersama lintas SEMUA babak (bukan per-round). Kalau tidak
      // direset di sini, nomor Heat babak SEBELUMNYA masih menempel di tim
      // yang baru menang, padahal babak baru belum tentu heat/lawannya sama.
      // Reset dulu supaya tim yang maju betul-betul berstatus "menunggu
      // di-assign manual ke slot bagan babak baru" tanpa Heat.
      this._resetParticipantResultsByName(winners.map((w) => w.name));
      next.pool = (next.pool || []).concat(
        winners.map((w) => ({ name: w.name, bibTeam: w.bibTeam || "" }))
      );

      if (bronzeLosers.length === 2) {
        // sama seperti pemenang — reset dulu supaya waktu Semifinal tidak
        // ikut terbawa ke Final B (Final B mulai kosong dari nol).
        this._resetParticipantResultsByName(bronzeLosers.map((l) => l.name));
        bronze.pool = [
          { name: bronzeLosers[0].name, bibTeam: bronzeLosers[0].bibTeam || "" },
          { name: bronzeLosers[1].name, bibTeam: bronzeLosers[1].bibTeam || "" },
        ];
      }

      // next.matches sudah pre-populated kosong (lihat makeEmptyRound) —
      // operator klik-assign tim yang menang satu per satu ke slot bagan
      // babak ini, sama seperti Round 1. Heat TIDAK auto-diisi di sini.
      this.currentRoundIndex = nextRoundIndex;
      this.persistRoundResults(); // persist Final A (babak yg baru jadi aktif)

      if (bronzeLosers.length === 2) {
        // Final B BUKAN babak yang baru aktif (Final A yang aktif) — harus
        // di-persist eksplisit di sini, persis pola _persistAfterCrossRoundEdit().
        this.persistRoundResultsFor(bronze);
        this.$bvToast &&
          this.$bvToast.toast(
            "Pemenang lanjut ke Final A, tim yang kalah otomatis diarahkan ke Final B.",
            { variant: "success", autoHideDelay: 2500, title: "Advance berhasil" }
          );
      }

      // auto-save — lihat catatan di assignTeamToMatchSlot() soal kenapa ini perlu
      this.saveBracketToDB(true);
    },

    // reset .result (heat, start/finish/race time, penalti, winLose, dll.)
    // milik satu/lebih tim by nama — dipakai saat tim pindah babak supaya
    // tidak membawa data babak sebelumnya (lihat komentar di advanceToNextRound).
    _resetParticipantResultsByName(names) {
      const wantUpper = new Set(
        (names || []).filter(Boolean).map((n) => String(n).toUpperCase())
      );
      if (!wantUpper.size) return;
      (this.participantArr || []).forEach((p) => {
        const key = String(p.nameTeam || p.teamName || "").toUpperCase();
        if (!wantUpper.has(key)) return;
        p.result = this.makeEmptyResult();
        this.ensurePenaltiesObject(p.result);
      });
    },


    /** SIGN BRACKET */
    /** load dari payload baru */
    loadFromRaceStartPayload() {
      const { bucket } = loadRaceStartPayloadForH2H();
      if (!bucket || !Array.isArray(bucket.teams) || bucket.teams.length === 0)
        return false;

      this.participant = bucket.teams.slice();
      this.titleCategories =
        `${bucket.divisionName} ${bucket.raceName} – ${bucket.initialName}`.trim();

      try {
        const events = localStorage.getItem("eventDetails");
        this.dataEvent = events ? JSON.parse(events) : {};
      } catch {
        this.dataEvent = {};
      }
      return true;
    },

    /** fallback format lama */
    async checkValueStorage() {
      let dataStorage = null,
        events = null;

      dataStorage = localStorage.getItem("participantByCategories");
      events = localStorage.getItem("eventDetails");

      this.dataEvent = events ? JSON.parse(events) : {};
      const raw = dataStorage ? JSON.parse(dataStorage) : [];
      const arr = Array.isArray(raw) ? raw : Object.values(raw || {});
      arr.sort((a, b) =>
        String(a.praStart || "").localeCompare(String(b.praStart || ""))
      );

      this.participant = arr.map(normalizeTeamForH2H);
      this.titleCategories = String(
        localStorage.getItem("currentCategories") || ""
      ).trim();
    },

    async assignRanks(items) {
      const itemsWith = items.filter(
        (it) => it.result.totalTime || it.result.raceTime
      );
      itemsWith.sort(
        (a, b) =>
          this.parsesTime(a.result.totalTime || a.result.raceTime) -
          this.parsesTime(b.result.totalTime || b.result.raceTime)
      );
      itemsWith.forEach((it, idx) => {
        it.result.ranked = idx + 1;
      });
    },

    parsesTime(timeStr) {
      if (!timeStr) return Number.POSITIVE_INFINITY;
      const [h = 0, m = 0, s = 0] = String(timeStr).split(":").map(parseFloat);
      return h * 3600 * 1000 + m * 60 * 1000 + s * 1000;
    },

    async calculateScore(ranked) {
      const scoreData = this.dataScore.find((d) => d.ranking === ranked);
      return scoreData ? scoreData.score : 0;
    },

    async parseTimeResult(timeResult) {
      const parts = String(timeResult || "00:00:00:000").split(":");
      const [hours, minutes, seconds, milliseconds] = parts.map(
        (p) => parseInt(p, 10) || 0
      );
      return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
    },

    getScoreByRanked(ranked) {
      const m = this.dataScore.find((d) => d.ranking === ranked);
      if (m) return m.score;
      // rank di luar daftar (mis. list cuma diisi Rank 1-4) → pakai score
      // fallback "Rank N+ dan seterusnya" dari Race Settings, kalau ada.
      const list = this.dataScore || [];
      const maxRank = list.length
        ? Math.max(...list.map((d) => d.ranking))
        : 0;
      if (Number(ranked) > maxRank) {
        return this.h2hDefaultScoreBeyondRank || 0;
      }
      return null;
    },

    async updateTime(val, visIndex, title) {
      // ambil item yang sedang terlihat (subset babak aktif)
      const visItem = this.visibleParticipants[visIndex];
      if (!visItem) return;

      // cari index sebenarnya di this.participant
      const targetIndex = this.participantArr.findIndex((p) => {
        const nameMatch =
          String(p.nameTeam || p.teamName || "").toUpperCase() ===
          String(visItem.nameTeam || visItem.teamName || "").toUpperCase();
        const bibMatch =
          String(p.bibTeam || "") === String(visItem.bibTeam || "");
        // cocokkan nama; kalau ada BIB, bantu perkuat kecocokan
        return nameMatch && (!visItem.bibTeam ? true : bibMatch);
      });

      if (targetIndex === -1) return;

      const target = this.participant[targetIndex];

      if (title === "start") target.result.startTime = val;
      if (title === "finish") {
        target.result.finishTime = val;
        if (target.result.startTime && target.result.finishTime) {
          target.result.raceTime = await this.hitungSelisihWaktu(
            target.result.startTime,
            target.result.finishTime
          );
        }
      }

      await this.assignRanks(this.visibleParticipants);
      this.evaluateHeatWinnersForCurrentRound();
      this.syncWinLoseFromBracketToParticipants(); // NEW
      this.persistRoundResults(); // NEW
    },

    async hitungSelisihWaktu(waktuAwal, waktuAkhir) {
      const [h1, m1, s1] = String(waktuAwal).split(":");
      const [h2, m2, s2] = String(waktuAkhir).split(":");

      const d1 = new Date(0);
      d1.setUTCHours(
        +h1 || 0,
        +m1 || 0,
        parseInt((s1 || "0").split(".")[0]) || 0,
        parseInt((s1 || "0").split(".")[1]) || 0
      );
      const d2 = new Date(0);
      d2.setUTCHours(
        +h2 || 0,
        +m2 || 0,
        parseInt((s2 || "0").split(".")[0]) || 0,
        parseInt((s2 || "0").split(".")[1]) || 0
      );

      const diff = d2 - d1;
      const ms = diff % 1000;
      const sec = Math.floor((diff / 1000) % 60);
      const min = Math.floor((diff / (1000 * 60)) % 60);
      const hr = Math.floor(diff / (1000 * 60 * 60));
      const pad = (n, w = 2) => String(n).padStart(w, "0");
      return `${pad(hr)}:${pad(min)}:${pad(sec)}.${pad(ms, 3)}`;
    },

    async tambahWaktu(waktuA, waktuB) {
      const psA = String(waktuA).split(":"),
        psB = String(waktuB).split(":");
      const msA =
        (+psA[0] || 0) * 3600000 +
        (+psA[1] || 0) * 60000 +
        (parseFloat(psA[2]) || 0) * 1000;
      const msB =
        (+psB[0] || 0) * 3600000 +
        (+psB[1] || 0) * 60000 +
        (parseFloat(psB[2]) || 0) * 1000;
      const total = msA + msB;
      const hr = Math.floor(total / 3600000);
      const rem = total % 3600000;
      const min = Math.floor(rem / 60000);
      const rem2 = rem % 60000;
      const sec = Math.floor(rem2 / 1000);
      const ms = rem2 % 1000;
      const pad = (n, w = 2) => String(n).padStart(w, "0");
      return `${pad(hr)}:${pad(min)}:${pad(sec)}.${pad(ms, 3)}`;
    },


    goTo() {
      localStorage.removeItem("raceStartPayload");
      localStorage.removeItem("participantByCategories");
      localStorage.removeItem("currentCategories");

      // TIDAK memanggil clearAllRoundResults() di sini — tombol Back ini
      // sering diklik tanpa wasit sadar hasil round terbaru belum di-Save
      // ke database. Cache lokal per-bucket aman dibiarkan; akan otomatis
      // termuat lagi lewat loadRoundResultsForCurrentRound() kalau bucket
      // ini dibuka lagi nanti.
      this.participant = [];
      this.titleCategories = "";
      this.$router.push(`/event-detail/${this.$route.params.id}`);
    },
  },
};
</script>

<style scoped>
.racetime-header {
  display: flex;
  flex-direction: column; /* susun vertikal */
  align-items: flex-start; /* rata kiri */
  gap: 2px; /* jarak kecil antara h4 dan small */
}

.racetime-header h4 {
  margin: 0;
  font-weight: 700;
  color: #1c4c7a;
}

.racetime-header small {
  color: #6c757d;
  font-size: 0.875rem;
}
/* ---- Styling utk Switch DRR Category select ---- */
.h2h-actionbar__select {
  min-width: 260px;
  flex: 1 1 260px;
}

.h2h-actionbar__select #h2hBucketSelect {
  border-radius: 12px;
  cursor: pointer;
}

#h2hBucketSelect {
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
}

#h2hBucketSelect:hover {
  border-color: rgb(0, 180, 255);
  box-shadow: 0 0 30px rgba(0, 180, 255, 0.5);
}

.switch-label {
  font-weight: 700;
  font-size: 13px;
  color: #2b3445;
}

/* Tab pilih Initial (Youth/Junior/Open dll) — gaya sama dgn halaman Details/Sprint */
.init-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  background: #f1f3f7;
  padding: 6px;
  border-radius: 10px;
}

.init-tab {
  border: none;
  background: transparent;
  color: #2b3445;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.25s ease;
}

.init-tab:hover {
  background: #dbeafe;
  color: #1e3a8a;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 180, 255, 0.4);
}

.init-tab.active {
  background: rgb(54, 142, 180);
  color: #fff;
  box-shadow: 0 0 30px rgba(0, 180, 255, 0.5);
}
/* ---- End styling utk Switch DRR Category select ---- */

.btn-action {
  background: #ffffff;
  border: 1px solid #cfd8e6;
  color: #1c4c7a;
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 14px;
}

/* .btn-action (scoped, single class) menang lawan Bootstrap's .btn-outline-*
   (global, single class) karena atribut data-v-xxxx scoped menambah
   spesifisitas — jadi tanpa override eksplisit ini, tombol
   "btn-action btn-outline-danger" (mis. Reset All) tampil putih/netral
   biasa, BUKAN merah, walau variant class-nya sudah benar. Aksi
   destruktif dibuat solid merah & menonjol supaya operator sadar sebelum
   klik. */
.btn-action.btn-outline-danger {
  background: #dc2626;
  border-color: #dc2626;
  color: #ffffff;
}
.btn-action.btn-outline-danger:hover {
  background: #b91c1c;
  border-color: #b91c1c;
  color: #ffffff;
}

/* Print/Save Round-All Round-Overall — dikelompokkan per scope (bukan 6
   tombol flat sejajar) supaya operator langsung lihat scope-nya sebelum
   pilih Print/Save, dan tidak salah pencet "Save" mengira itu utk semua
   babak padahal cuma babak aktif. Garis warna di kiri tiap grup = penanda
   cepat scope (biru=Round, ungu=All Rounds, kuning=Overall). */
.h2h-actions-panel {
  gap: 10px;
}
.h2h-action-group {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px 5px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  border-left-width: 3px;
  background: #f8fafc;
}
.h2h-action-group--round {
  border-left-color: #3b82f6;
}
.h2h-action-group--all {
  border-left-color: #8b5cf6;
}
.h2h-action-group--overall {
  border-left-color: #f59e0b;
}
.h2h-action-group__label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  padding-right: 8px;
  margin-right: 2px;
  border-right: 1px dashed #cbd5e1;
  white-space: nowrap;
}
.h2h-action-btn {
  display: inline-flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #cfd8e6;
  color: #1c4c7a;
  font-weight: 700;
  font-size: 13px;
  border-radius: 8px;
  padding: 6px 10px;
  white-space: nowrap;
}
.h2h-action-btn:hover {
  background: #eef4ff;
}
.h2h-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
/* Save = tombol solid (nulis ke DB, konsekuensinya lebih besar drpd cuma
   generate file PDF) supaya beda bobot visual dgn Print. */
.h2h-action-btn--save {
  background: #1c4c7a;
  border-color: #1c4c7a;
  color: #ffffff;
}
.h2h-action-btn--save:hover {
  background: #163c61;
}

/* Connect/Disconnect: .btn-action's white background above wins by default
   over Bootstrap's .btn-success/.btn-danger (equal specificity, .btn-action
   declared later) — these overrides use an extra class to win instead. */
.btn-connect {
  min-width: 190px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background-color 0.2s ease, border-color 0.2s ease,
    opacity 0.2s ease;
}
.btn-connect.btn-success {
  background: #16a34a;
  border-color: #16a34a;
  color: #fff;
}
.btn-connect.btn-success:hover:not(:disabled) {
  background: #15803d;
  border-color: #15803d;
}
.btn-connect.btn-danger {
  background: #dc2626;
  border-color: #dc2626;
  color: #fff;
}
.btn-connect.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
  border-color: #b91c1c;
}
.btn-connect:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-action-racetime {
  background: #ffffff;
  border: 1px solid #cfe1e6;
  color: #1c4c7a;
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 14px;
}

/* ===== HERO / BANNER ===== */
.detail-hero {
  position: relative;
  overflow: hidden;
}
.detail-hero .hero-bg {
  position: absolute;
  inset: 0;
  background-image: url("https://images.unsplash.com/photo-1709810953776-ee6027ff8104?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
  background-size: cover;
  background-position: center;
}
.detail-hero .hero-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45));
}
.detail-hero .hero-inner {
  position: relative;
  z-index: 1;
  padding: 50px;
}
.detail-hero h2 {
  color: #fff;
  font-weight: 800;
  font-size: clamp(26px, 4.2vw, 46px);
  line-height: 1.05;
  margin-bottom: 6px !important;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.55);
  letter-spacing: 0.2px;
}
.detail-hero .meta {
  color: rgba(255, 255, 255, 0.92);
  font-size: clamp(12px, 1.6vw, 16px);
}
.hero-logo {
  width: 150px;
  height: 150px;
  margin-right: 10px;
  border-radius: 30px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 0 20px rgba(0, 128, 255, 0.6);
}

.event-logo-img {
  width: 140px;
  height: 140px;
  object-fit: contain;
  border-radius: 10px;
}

/* ===== TABLE WRAPPER: overflow horizontal tanpa mengecilkan kolom ===== */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}
.table-wrapper::-webkit-scrollbar {
  height: 8px;
}
.table-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}
.table-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.28);
  border-radius: 8px;
}

/* ===== TABLE ===== */
table {
  border-collapse: collapse;
  width: max-content;
  min-width: 100%;
  border-radius: 12px;
  overflow: hidden;
}
thead {
  background: #383838;
  color: #fff;
  font-weight: 600;
}
thead th {
  padding: 12px 15px;
  text-align: left;
  font-size: 14px;
  border-bottom: 2px solid #f1f1f1;
}
tbody tr:nth-child(odd) {
  background: #f9f9f9;
}
tbody tr:nth-child(even) {
  background: #f2f2f2;
}
th,
td {
  border: none;
  white-space: nowrap;
} /* <-- cegah wrap; geser ke samping */

.max-char {
  max-width: 260px;
  word-wrap: break-word;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
}
.large-bold {
  font-size: 1.2rem;
  font-weight: bold;
}
.text-strong {
  color: #000;
}
.penalty-char {
  color: red;
}
.result-char {
  color: green;
}
.text-monospace {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}

/* ---- Styling utk penalty section select ---- */
.small-select {
  margin-bottom: 5px;
  width: 80px;
}

.small-select {
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-bottom: 6px; /* jarak antar select */
}

.small-select:hover {
  border-color: rgb(0, 180, 255);
  box-shadow: 0 0 30px rgba(0, 180, 255, 0.5);
}

/* ===== PORT STATUS ===== */
.status-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: 0;
  transition: background-color 0.3s;
}
.connected {
  background: rgb(0, 255, 0);
}
.disconnected {
  background: red;
}

/* ===== BRACKET (refined) ===== */
.bracket {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(260px, 1fr);
  gap: 18px;
  overflow-x: auto;
  padding-bottom: 8px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}
.bracket::-webkit-scrollbar {
  height: 8px;
}
.bracket::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}
.bracket::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.28);
  border-radius: 8px;
}

.bracket__round {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
  padding: 14px;
  min-width: 260px;
  position: relative;
}
.bracket__round--bronze {
  background: linear-gradient(180deg, #fff7ef, #ffffff);
}

.bracket__round-header {
  position: sticky;
  top: 0;
  z-index: 1;
  background: transparent;
  padding-bottom: 8px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
}
.bracket__round-title {
  font-weight: 800;
  letter-spacing: 0.3px;
}
.bracket__round-meta {
  font-size: 12px;
  color: #6b7280;
}

.bracket__list {
  display: grid;
  gap: 12px;
}

.bracket__match {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 10px;
  background: #fafafa;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.bracket__match:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  background: #fff;
}

.bracket__team {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 8px 10px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
}
.bracket__team + .bracket__team {
  margin-top: 8px;
} /* kalau tanpa vs */
.bracket__team-main {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bracket__pool {
  margin-bottom: 12px;
  padding: 8px 10px;
  border: 1px dashed rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  background: #fffbeb;
}
.bracket__pool-title {
  font-size: 12px;
  font-weight: 800;
  color: #92400e;
  margin-bottom: 6px;
}
.bracket__pool-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.bracket__pool-chip {
  font-size: 12px;
  font-weight: 700;
  color: #92400e;
  background: #fef3c7;
  border: 1px solid rgba(146, 64, 14, 0.15);
  border-radius: 999px;
  padding: 2px 10px;
}

/* ===== Card pembungkus seluruh area bracket H2H ===== */
.bracket-card {
  background: #ffffff;
  border: 1px solid #dde3ec;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
}

/* ===== vue-tournament-bracket (Head to Head bracket display) =====
   Library-nya cuma nyediain skeleton flex + connector line (warna abu
   default #999) — semua "kartu" match (nama tim, badge Heat, tombol
   dll.) sengaja di-restyle total di sini karena default-nya
   solid abu tanpa rounded corner. PENTING: class winner/defeated di bawah
   ini datang dari LIBRARY (bukan buatan kita) — jangan diganti namanya. */
.bracket-vtb-wrap {
  overflow-x: auto;
  padding-bottom: 8px;
}
/* posisikan bagan di tengah kalau lebih sempit dari container — pakai
   width:fit-content + margin:auto (BUKAN flexbox align-items:center) supaya
   saat bagan lebih LEBAR dari container (banyak babak), overflow-x:auto
   tetap bisa di-scroll normal dari kiri tanpa ada bagian yang ke-clip
   (flexbox center akan memotong sisi kiri konten yang overflow). */
.bracket-vtb-wrap >>> .vtb-wrapper {
  width: -moz-fit-content;
  width: fit-content;
  margin: 0 auto;
}

/* kartu match: bungkus nama tim (.vtb-item-players) + footer Heat/tombol
   jadi SATU card putih rounded — defaultnya abu solid tanpa radius.
   BUG FIX: dulu pakai overflow:hidden di sini utk membulatkan sudut, tapi
   itu bisa MEMOTONG/menghalangi klik baris team2 kalau tinggi konten kartu
   (badge Heat, dll — semuanya tambahan kita, bukan
   bawaan library) berubah-ubah lebih tinggi dari asumsi awal library.
   Sekarang radius dipasang langsung di elemen ujung (baris pertama & footer)
   supaya TIDAK ada clipping konten sama sekali. */
.bracket-vtb-wrap >>> .vtb-item-players {
  background: #ffffff !important;
  color: inherit !important;
  border: 1px solid #cbd2dc;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  /* jaga2 thd garis penghubung antar babak (pseudo-element absolute milik
     library, dihitung dari tinggi kartu asumsi bawaan) supaya tidak pernah
     menutupi/menghalangi klik di atas kartu, walau kartu kita jadi lebih
     tinggi dari standar bawaan library */
  position: relative;
  z-index: 1;
}

.bracket-vtb-wrap >>> .vtb-player {
  min-width: 260px;
  padding: 10px 14px;
  background: #ffffff;
  border-bottom: 1px solid #e5e9f0;
  transition: background-color 0.15s ease;
}
.bracket-vtb-wrap >>> .vtb-player:first-of-type {
  border-radius: 12px 12px 0 0;
}
.bracket-vtb-wrap >>> .vtb-player:last-of-type {
  border-bottom: none;
}
.bracket-vtb-wrap >>> .vtb-player:hover {
  background: #eef2f7;
}

/* winner/defeated/highlight = class asli dari library */
.bracket-vtb-wrap >>> .vtb-player.winner {
  background: #ecfdf5;
  box-shadow: inset 3px 0 0 #16a34a;
}
.bracket-vtb-wrap >>> .vtb-player.defeated {
  background: #fef2f2;
  box-shadow: inset 3px 0 0 #dc2626;
  opacity: 0.85;
}
.bracket-vtb-wrap >>> .vtb-player.winner.highlight {
  background: #d1fae5;
}
.bracket-vtb-wrap >>> .vtb-player.defeated.highlight {
  background: #fee2e2;
}

/* garis penghubung antar babak — dibuat sedikit lebih gelap dari abu muda
   sebelumnya (#cbd5e1) supaya lebih kelihatan di atas card putih */
.bracket-vtb-wrap >>> .vtb-item-parent:after,
.bracket-vtb-wrap >>> .vtb-item-child:before,
.bracket-vtb-wrap >>> .vtb-item-child:after {
  background-color: #94a3b8 !important;
}

/* nama+bib+bendera di kiri, waktu hasil di kanan — sebaris (bukan
   bertumpuk), makanya .vtb-team-name jadi flex row */
.vtb-team-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #1c4c7a;
}
.bracket-vtb-wrap >>> .vtb-player.winner .vtb-team-name {
  color: #15803d;
}
.bracket-vtb-wrap >>> .vtb-player.defeated .vtb-team-name {
  color: #64748b;
  font-weight: 600;
}
.vtb-team-name.is-placeholder {
  color: #94a3b8;
  font-style: italic;
  font-weight: 500;
}
.vtb-team-name__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
/* Medali di sebelah KANAN Time (bukan sebelah nama) — pengganti section
   "Podium" terpisah yang dihapus. Cuma muncul di kartu Final A
   (gold/silver) & Final B (bronze utk menang, teks "4th" bold-italic utk
   yg kalah). Dibungkus lingkaran putih supaya kontras & konsisten
   tampilannya di atas latar hijau/merah menang-kalah kartu bagan. */
.vtb-medal-badge {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.25);
  margin-left: 2px;
}
.vtb-medal-icon {
  width: 13px;
  height: 13px;
}
.vtb-medal-icon--gold {
  color: #d4af37;
}
.vtb-medal-icon--silver {
  color: #9aa5b1;
}
.vtb-medal-icon--bronze {
  color: #b56a34;
}
.vtb-fourth-label {
  font-weight: 700;
  font-style: italic;
  font-size: 9px;
  color: #475569;
  line-height: 1;
}
.vtb-team-time {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #64748b;
}
.bracket-vtb-wrap >>> .vtb-player.winner .vtb-team-time {
  color: #16a34a;
}

/* klik-assign/hapus tim langsung di slot bagan — buka modal (bukan
   dropdown inline) krn bagan ada di dalam container overflow-x:auto */
.vtb-clickable {
  cursor: pointer;
  text-decoration: underline dotted;
  text-underline-offset: 3px;
}
.vtb-clickable:hover {
  color: #2563eb !important;
}

/* footer (badge Heat) — lanjutan card putih yang
   sama, dikasih garis pemisah tipis dari baris nama tim di atasnya */
.vtb-match-footer {
  background: #f1f4f8;
  border-top: 1px solid #e2e7ee;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  border-radius: 0 0 12px 12px;
}
/* Highlight per Round — fitur baru: match yang termasuk currentRound
   (dipilih via Prev/Next Round / dropdown Select Round) ditandai jelas
   supaya operator langsung lihat bagian bracket mana yang lagi dia isi. */
.vtb-match-footer--active {
  background: #eff6ff;
  border-top-color: #93c5fd;
  box-shadow: inset 0 2px 0 #2563eb;
}
.bracket-vtb-wrap >>> .vtb-item-players:has(.vtb-match-footer--active) {
  border-color: #93c5fd;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
}
/* saat capture utk Download Bracket (PDF) — hilangkan highlight biru
   "Babak Aktif" (badge + background biru match-footer), sisakan cuma
   label nama babak (.vtb-round-badge). */
.pdf-export-mode .vtb-active-round-badge {
  display: none !important;
}
.pdf-export-mode >>> .vtb-match-footer--active {
  background: #f1f4f8 !important;
  border-top-color: #e2e7ee !important;
  box-shadow: none !important;
}
.pdf-export-mode >>> .vtb-item-players:has(.vtb-match-footer--active) {
  border-color: #cbd2dc !important;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08) !important;
}
/* BUG FIX: box-shadow inset (border hijau/merah kiri Win/Lose) di-render
   html2canvas sbg potongan diagonal yang jelek (keterbatasan library, bukan
   masalah CSS-nya) — di export PDF, hilangkan cuma box-shadow-nya, sisakan
   tint background hijau/merah yang tetap render bersih. */
.pdf-export-mode >>> .vtb-player.winner {
  box-shadow: none !important;
}
.pdf-export-mode >>> .vtb-player.defeated {
  box-shadow: none !important;
}
.vtb-active-round-badge {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #ffffff;
  background: #2563eb;
  border-radius: 999px;
  padding: 3px 10px;
}
/* label babak PERMANEN di tiap kartu match — beda dgn vtb-active-round-badge
   yang cuma muncul utk babak yg lagi aktif dipilih */
.vtb-round-badge {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #64748b;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 3px 10px;
}
.vtb-heat-badge {
  font-size: 11px;
  font-weight: 800;
  color: #2563eb;
  background: #eef6ff;
  border: 1px solid rgba(37, 99, 235, 0.15);
  border-radius: 999px;
  padding: 3px 10px;
}
/* match riil yang belum diberi nomor Heat sama sekali — beda warna supaya
   operator sadar masih perlu klik utk menentukan Heat-nya */
.vtb-heat-badge--empty {
  color: #b45309;
  background: #fff7ed;
  border-color: rgba(180, 83, 9, 0.2);
}
.bracket-size-badge {
  display: inline-block;
  margin-top: 4px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.03em;
  color: #7c3aed;
  background: #f3ecff;
  border: 1px solid rgba(124, 58, 237, 0.18);
  border-radius: 999px;
  padding: 3px 10px;
}
.bracket-bye-info-badge {
  display: inline-flex;
  align-items: center;
  margin-top: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #b45309;
  background: #fff7ed;
  border: 1px solid rgba(180, 83, 9, 0.2);
  border-radius: 999px;
  padding: 3px 10px;
}
/* header grup "Penalties Group" — klik utk minimize/expand kolom2 penalti */
.penalties-group-th {
  cursor: pointer;
  user-select: none;
}
.penalties-group-th:hover {
  /* thead background gelap (#383838) + teks putih — hover HARUS tetap
     gelap (bukan warna terang spt #eef2f7 sebelumnya) supaya teks putihnya
     tidak "hilang" ketika di-hover */
  background: #4d4d4d;
}

/* kolom Heat di tabel hasil — read-only, cuma menampilkan Heat yang sudah
   ditentukan lewat bagan (lihat openHeatEditor) — kosong kalau BYE */
.h2h-heat-readonly {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  color: #2563eb;
  background: #eef6ff;
  border: 1px solid rgba(37, 99, 235, 0.15);
  border-radius: 999px;
  padding: 3px 10px;
}
.bracket-vtb-bronze {
  border-top: 1px dashed #cbd5e1;
  padding-top: 16px;
}
.bracket-vtb-bronze__title {
  font-weight: 800;
  color: #92400e;
  margin-bottom: 8px;
}
.bracket__heat {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  color: #2563eb;
  background: #eef6ff;
  border: 1px solid rgba(37, 99, 235, 0.15);
  border-radius: 999px;
  padding: 2px 8px;
  margin-bottom: 6px;
}
.bracket__name {
  font-weight: 700;
  color: #111827;
  max-width: 170px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bracket__score {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-weight: 800;
  color: #111827;
  padding-left: 8px;
}

.bracket__vs {
  text-align: center;
  color: #6b7280;
  font-size: 12px;
  margin: 6px 0;
}

.bracket__footer {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.bracket__actions {
  display: flex;
  gap: 6px;
}
.btn-xs {
  --padY: 2px;
  --padX: 8px;
  padding: var(--padY) var(--padX);
  font-size: 12px;
  line-height: 1.2;
  border-radius: 8px;
}
.bracket__winner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #065f46;
  background: #ecfdf5;
  border: 1px solid rgba(16, 185, 129, 0.18);
  padding: 2px 8px;
  border-radius: 999px;
}
.bracket__winner--bye {
  color: #92400e;
  background: #fef3c7;
  border-color: rgba(146, 64, 14, 0.18);
}

.bracket__team.is-bye {
  opacity: 0.7;
  background: #f9fafb;
  border-style: dashed;
}

thead th[rowspan="2"] {
  vertical-align: middle;
}
thead th[colspan="8"] {
  text-align: center;
}

.bracket-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 5; /* tetap terlihat saat scroll */
}
.toolbar-title {
  font-weight: 800;
  letter-spacing: 0.2px;
}
/* Bar aksi kanan: select + tombol sejajar rapi */
.toolbar-actions {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap; /* biar responsif */
}

/* Kelompok tombol (bukan .btn-group bootstrap agar tidak “paksa” tombol-only) */
.btn-group-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  cursor: pointer;
}

/* Sedikit konsistensi ukuran tombol custom */
.toolbar-divider {
  width: 1px;
  height: 28px;
  background: rgba(0, 0, 0, 0.08);
  margin: 0 6px;
}
.round-nav {
  display: flex;
  align-items: center;
}
.round-select {
  cursor: pointer;
  min-width: 200px;
  border-radius: 12px;
}
.bracket-toolbar .btn {
  border-radius: 10px;
}
.bracket-toolbar .btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
  transition: all 0.15s ease;
}

/* Responsif: tumpuk di layar kecil */
@media (max-width: 768px) {
  .bracket-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .toolbar-actions {
    width: 100%;
    gap: 8px;
  }
  .round-nav {
    width: 100%;
    justify-content: space-between;
  }
  .round-select {
    cursor: pointer;
    flex: 1;
    min-width: 0;
  }
}

/* Kolom Others: lebih kecil & rapat */
.pen-o-cell {
  width: 64px;
  min-width: 64px;
  padding-right: 6px;
}

/* BootstrapVue render: input.form-control */
.pen-o-input.form-control,
.pen-o-input.form-control.form-control-sm {
  max-width: 60px;
  height: 26px;
  padding: 2px 6px;
  font-size: 12px;
  line-height: 1.2;
  text-align: center;
  border-radius: 6px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  color: #fff;
}

.status-pill--dnf {
  background-color: #dc3545; /* merah */
}

.status-pill--dns {
  background-color: #6c757d; /* abu */
}

.status-pill--dsq {
  background-color: #343a40; /* hitam */
}

/* PATH  */
.controls-bar {
  gap: 10px;
}

/* Pill path */
.path-pill {
  display: inline-flex;
  align-items: center;
  max-width: 520px; /* sesuaikan */
  background: #fff;
  color: #0f172a;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  padding: 6px 12px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
  font-weight: 600;
  font-size: 0.9rem;
}
.path-pill--empty {
  color: #64748b;
  background: #f8fafc;
  border-color: #e5e7eb;
}
.path-pill .truncate {
  display: inline-block;
  max-width: 460px; /* = max-width pill - padding + ikon */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Meta Panel  */
.meta-panel {
  background: #fff;
  border: 1px solid #e8edf5;
  border-radius: 14px;
  padding: 12px 16px;
  box-shadow: 0 6px 16px rgba(16, 24, 40, 0.04);
}
.meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dashed #eef2f7;
}
.meta-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.meta-label {
  min-width: 120px; /* lebar label tetap */
  font-weight: 800;
  letter-spacing: 0.2px;
  color: #334155; /* slate-700 */
  font-style: italic;
}
.meta-value {
  font-weight: 600;
  color: #0f172a; /* slate-900 */
}
.badge-chip {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.85rem;
  border: 1px solid transparent;
}
.badge-chip--blue {
  background: #eef6ff;
  color: rgb(0, 180, 255);
  border-color: #dbeafe;
}

/* Responsif: di layar kecil, label di atas value */
@media (max-width: 575.98px) {
  .meta-row {
    flex-direction: column;
    align-items: flex-start;
    padding: 10px 0;
  }
  .meta-label {
    min-width: auto;
  }
  .meta-panel {
    padding: 12px;
  }
}

.bracket-hidden-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  margin: 16px 0;
  border: 2px dashed #d1d5db; /* abu-abu */
  border-radius: 12px;
  background: #f9fafb; /* abu terang */
  color: #374151; /* teks abu gelap */
  text-align: center;
}

.bracket-hidden-info .info-icon {
  font-size: 28px;
  color: #6b7280; /* abu-abu */
}

.bracket-empty {
  border: 1px dashed #dee2e6;
  border-radius: 6px;
}

</style>

<!-- unscoped: b-modal renders its content outside this component's scoped
     CSS reach (portalled to <body>), sama seperti kasus di EventSettings.vue -->
<style>
/* Tooltip BootstrapVue (v-b-tooltip) di-append ke <body>, jadi z-index
   bawaannya (1070) lebih tinggi drpd Navbar (z-index: 1000 di App.vue) —
   akibatnya tooltip tombol2 di header H2H (yg posisinya dekat/menempel
   Navbar) tampil MENIMPA Navbar. Turunkan supaya tooltip selalu di BAWAH
   Navbar, tanpa mengubah tampilan tooltip itu sendiri. */
.tooltip {
  z-index: 990 !important;
}

.heat-modal {
  max-height: 85vh !important;
}
.heat-modal .modal-body {
  max-height: calc(85vh - 112px);
  overflow-y: auto;
}
.heat-modal .heat-group__title {
  font-weight: 700;
  font-size: 0.95rem;
  margin-bottom: 6px;
  color: #343a40;
}
.heat-modal .heat-group__table th,
.heat-modal .heat-group__table td {
  vertical-align: middle;
}
/* table-layout: fixed + width tetap di tiap <th> supaya kolom Bib & Kategori
   sejajar rapi ANTAR tabel Heat 1/2/3/dst — tanpa ini tiap <table> auto-size
   kolomnya sendiri2 berdasar isi (nama tim/kategori beda panjang), jadi
   posisi kolom Bib bisa geser2 dari satu tabel Heat ke tabel Heat lainnya. */
.heat-modal .heat-group__table {
  table-layout: fixed;
}
.heat-modal .heat-group__table td {
  overflow-wrap: break-word;
}

/* Modal "Pilih Tim" & "Ubah Nomor Heat" — header custom (bukan header
   bawaan bootstrap-vue) + body dgn padding sendiri, dipakai bareng di 2
   modal supaya konsisten. content-class="h2h-picker-modal" mem-bulatkan
   sudut modal-content krn kita pakai body-class="p-0" (header custom jadi
   menempel rata ke tepi kalau modal-content tidak dibulatkan di sini). */
.h2h-picker-modal {
  border-radius: 16px;
  overflow: hidden;
  border: none;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
}
.h2h-picker-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  background: #2563eb;
  position: relative;
}
.h2h-picker-header__text {
  flex: 1 1 auto;
  min-width: 0;
}
.h2h-picker-header__title {
  font-weight: 800;
  font-size: 16px;
  color: #ffffff;
}
.h2h-picker-header__subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
}
.h2h-picker-close {
  flex: 0 0 auto;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.h2h-picker-close:hover {
  background: rgba(255, 255, 255, 0.28);
}
.h2h-picker-body {
  padding: 10px;
  max-height: 60vh;
  overflow-y: auto;
}
.h2h-picker-empty {
  padding: 24px 12px;
  text-align: center;
  color: #64748b;
  font-size: 13px;
}
.h2h-picker-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.h2h-picker-item:hover {
  background: #eff6ff;
  color: #2563eb;
}
.h2h-picker-item + .h2h-picker-item {
  margin-top: 2px;
}
.h2h-picker-item__name {
  flex: 1 1 auto;
}
.h2h-picker-item__chevron {
  color: #94a3b8;
  font-size: 16px;
}
.h2h-picker-item:hover .h2h-picker-item__chevron {
  color: #2563eb;
}

/* modal "Ubah Nomor Heat" — stepper angka + tombol aksi */
.h2h-heat-editor-body {
  padding: 20px !important;
  overflow: visible;
}
.h2h-heat-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}
.h2h-heat-stepper__btn {
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.h2h-heat-stepper__btn:hover {
  background: #eef2f7;
  color: #2563eb;
}
.h2h-heat-stepper__input {
  width: 90px;
  height: 44px;
  text-align: center;
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  -moz-appearance: textfield;
}
.h2h-heat-stepper__input::-webkit-outer-spin-button,
.h2h-heat-stepper__input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.h2h-heat-editor-actions {
  display: flex;
  gap: 10px;
}
.h2h-heat-editor-actions .btn-action {
  flex: 1 1 0;
  justify-content: center;
}
</style>
