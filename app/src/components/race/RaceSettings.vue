<template>
  <b-modal
    :id="id"
    v-model="localShow"
    hide-footer
    centered
    size="xl"
    body-class="p-0"
    content-class="rounded-20 overflow-hidden rs-modal"
    scrollable
  >
    <template #modal-header>
      <div class="d-flex justify-content-between align-items-center w-100">
        <h5 class="mb-0 font-weight-bold">Race Setting</h5>
        <!-- 🔸 pakai class custom agar sesuai desain -->
        <b-button size="sm" class="btn-close-red" @click="localShow = false">
          ✕
        </b-button>
      </div>
    </template>

    <!-- Body -->
    <div class="p-4" v-if="!loading">
      <div class="p-4">
        <!-- SPRINT -->
        <div class="rs-card mb-3" v-if="showSprint">
          <div class="px-3 py-3">
            <div
              class="h4 font-weight-bold mb-3 rs-section-toggle rs-header-row"
              @click="toggleSection('sprint')"
            >
              <span class="rs-header-text">
                <Icon
                  :icon="
                    collapsedSections.sprint
                      ? 'mdi:chevron-right'
                      : 'mdi:chevron-down'
                  "
                  class="mr-1"
                />
                Sprint
              </span>
              <img class="rs-section-banner" :src="sprintBannerImg" alt="" />
            </div>

            <div v-show="!collapsedSections.sprint">
            <!-- PEN. START (PS) -->
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="font-weight-bold">Pilihan Pen. Start (PS)</div>
              <b-button
                size="sm"
                variant="outline-primary"
                style="border-radius: 8px"
                :disabled="draft.sprint.startPenalties.length >= maxSprintPenalties"
                @click="addPenaltyRow('sprint', 'startPenalties')"
              >
                + Tambah
              </b-button>
            </div>
            <div
              v-if="draft.sprint.startPenalties.length"
              class="d-flex mb-1"
              style="gap: 10px"
            >
              <small class="text-muted flex-grow-1">Label</small>
              <small class="text-muted" style="width: 100px; flex: 0 0 100px"
                >Detik</small
              >
              <span style="width: 32px; flex: 0 0 32px"></span>
            </div>
            <div
              v-for="(p, idx) in draft.sprint.startPenalties"
              :key="'sprint-ps-' + idx"
              class="d-flex align-items-center mb-2"
              style="gap: 10px"
            >
              <b-form-input
                v-model="p.label"
                placeholder="Label (mis. False Start)"
                style="border-radius: 10px"
                class="flex-grow-1"
              />
              <b-form-input
                v-model.number="p.value"
                type="number"
                min="0"
                max="600"
                placeholder="Detik"
                style="border-radius: 10px; width: 100px; flex: 0 0 100px"
              />
              <b-button
                size="sm"
                variant="outline-danger"
                style="border-radius: 8px"
                :disabled="draft.sprint.startPenalties.length <= 1"
                @click="removePenaltyRow('sprint', 'startPenalties', idx)"
              >
                ✕
              </b-button>
            </div>
            <small class="text-muted d-block mb-3">
              Default FAJI: 0 (tidak ada), 50 (kesalahan start).
            </small>

            <!-- PEN. FINISH (PF) -->
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="font-weight-bold">Pilihan Pen. Finish (PF)</div>
              <b-button
                size="sm"
                variant="outline-primary"
                style="border-radius: 8px"
                :disabled="draft.sprint.finishPenalties.length >= maxSprintPenalties"
                @click="addPenaltyRow('sprint', 'finishPenalties')"
              >
                + Tambah
              </b-button>
            </div>
            <div
              v-if="draft.sprint.finishPenalties.length"
              class="d-flex mb-1"
              style="gap: 10px"
            >
              <small class="text-muted flex-grow-1">Label</small>
              <small class="text-muted" style="width: 100px; flex: 0 0 100px"
                >Detik</small
              >
              <span style="width: 32px; flex: 0 0 32px"></span>
            </div>
            <div
              v-for="(p, idx) in draft.sprint.finishPenalties"
              :key="'sprint-pf-' + idx"
              class="d-flex align-items-center mb-2"
              style="gap: 10px"
            >
              <b-form-input
                v-model="p.label"
                placeholder="Label (mis. Pelanggaran Elektronik)"
                style="border-radius: 10px"
                class="flex-grow-1"
              />
              <b-form-input
                v-model.number="p.value"
                type="number"
                min="0"
                max="600"
                placeholder="Detik"
                style="border-radius: 10px; width: 100px; flex: 0 0 100px"
              />
              <b-button
                size="sm"
                variant="outline-danger"
                style="border-radius: 8px"
                :disabled="draft.sprint.finishPenalties.length <= 1"
                @click="removePenaltyRow('sprint', 'finishPenalties', idx)"
              >
                ✕
              </b-button>
            </div>
            <small class="text-muted d-block mb-3">
              Default FAJI: 0 (tidak ada), 10 (pelanggaran elektronik finish).
            </small>

            <hr class="rs-divider" />

            <!-- SCORE BY RANK -->
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="font-weight-bold">Score by Rank</div>
              <b-button
                size="sm"
                variant="outline-primary"
                style="border-radius: 8px"
                :disabled="draft.sprint.scoreByRank.length >= maxSprintScoreRows"
                @click="addScoreRow('sprint')"
              >
                + Tambah
              </b-button>
            </div>
            <div
              v-if="draft.sprint.scoreByRank.length"
              class="d-flex mb-1"
              style="gap: 10px"
            >
              <small class="text-muted" style="width: 70px; flex: 0 0 70px"
                >Rank</small
              >
              <small class="text-muted flex-grow-1">Score</small>
              <span style="width: 32px; flex: 0 0 32px"></span>
            </div>
            <div
              class="rs-score-list"
              style="max-height: 260px; overflow-y: auto"
            >
              <div
                v-for="(p, idx) in draft.sprint.scoreByRank"
                :key="'sprint-score-' + idx"
                class="d-flex align-items-center mb-2"
                style="gap: 10px"
              >
                <b-form-input
                  :value="p.ranking"
                  disabled
                  style="border-radius: 10px; width: 70px; flex: 0 0 70px"
                />
                <b-form-input
                  v-model.number="p.score"
                  type="number"
                  min="0"
                  max="1000"
                  placeholder="Score"
                  style="border-radius: 10px"
                  class="flex-grow-1"
                />
                <b-button
                  size="sm"
                  variant="outline-danger"
                  style="border-radius: 8px"
                  :disabled="draft.sprint.scoreByRank.length <= 1"
                  @click="removeScoreRow('sprint', idx)"
                >
                  ✕
                </b-button>
              </div>
            </div>
            <small class="text-muted d-block mt-1 mb-2">
              Rank menyesuaikan urutan baris otomatis.
            </small>

            <div class="d-flex align-items-center mt-2" style="gap: 10px">
              <div class="font-weight-bold" style="white-space: nowrap">
                Score utk Rank {{ draft.sprint.scoreByRank.length + 1 }} dan
                seterusnya
              </div>
              <b-form-input
                v-model.number="draft.sprint.defaultScoreBeyondRank"
                type="number"
                min="0"
                max="1000"
                placeholder="0"
                style="border-radius: 10px; width: 100px; flex: 0 0 100px"
              />
            </div>
            <small class="text-muted d-block mt-1">
              Berlaku utk semua tim dengan peringkat di luar daftar di atas
              (mis. isi list Rank 1–5, lalu isi di sini utk Rank 6+). Isi 0
              kalau tim di luar daftar tidak mendapat score sama sekali.
            </small>

            <hr class="rs-divider" />

            <!-- PDF RESULT: on/off kolom tanda tangan -->
            <div class="font-weight-bold mb-2">PDF Result</div>
            <small class="text-muted d-block mb-2">
              Nama & tanda tangan diatur di Event Detail — di sini cuma
              mengatur tampil/tidaknya kolomnya di PDF Result Sprint.
            </small>
            <b-form-checkbox
              class="rs-switch mb-2"
              switch
              v-model="draft.sprint.showTechnicalDelegate"
              >Tampilkan Technical Delegate</b-form-checkbox
            >
            <b-form-checkbox
              class="rs-switch mb-2"
              switch
              v-model="draft.sprint.showChiefJudge"
              >Tampilkan Chief Judge</b-form-checkbox
            >
            <b-form-checkbox
              class="rs-switch mb-2"
              switch
              v-model="draft.sprint.showRaceDirector"
              >Tampilkan Race Director</b-form-checkbox
            >
            </div>
          </div>
        </div>

        <!-- HEAD TO HEAD -->
        <div class="rs-card mb-3" v-if="showH2H">
          <div class="px-3 py-3">
            <div
              class="h4 font-weight-bold mb-3 rs-section-toggle rs-header-row"
              @click="toggleSection('h2h')"
            >
              <span class="rs-header-text">
                <Icon
                  :icon="
                    collapsedSections.h2h ? 'mdi:chevron-right' : 'mdi:chevron-down'
                  "
                  class="mr-1"
                />
                Head to Head
              </span>
              <img class="rs-section-banner" :src="h2hBannerImg" alt="" />
            </div>

            <div v-show="!collapsedSections.h2h">
            <div class="font-weight-bold mb-2">Bouyan Setting</div>
            <div
              class="d-flex flex-wrap align-items-center mb-4"
              style="gap: 28px"
            >
              <b-form-checkbox class="rs-switch" switch v-model="draft.h2h.R1"
                >R1</b-form-checkbox
              >
              <b-form-checkbox class="rs-switch" switch v-model="draft.h2h.R2"
                >R2</b-form-checkbox
              >
              <b-form-checkbox class="rs-switch" switch v-model="draft.h2h.L1"
                >L1</b-form-checkbox
              >
              <b-form-checkbox class="rs-switch" switch v-model="draft.h2h.L2"
                >L2</b-form-checkbox
              >
            </div>

            <div
              v-for="grp in h2hPenaltyGroups"
              :key="grp.key"
              class="mb-4"
            >
              <div
                class="d-flex justify-content-between align-items-center mb-2"
              >
                <div class="font-weight-bold">{{ grp.title }}</div>
                <b-button
                  size="sm"
                  variant="outline-primary"
                  style="border-radius: 8px"
                  :disabled="draft.h2h[grp.key].length >= maxSprintPenalties"
                  @click="addPenaltyRow('h2h', grp.key)"
                >
                  + Tambah
                </b-button>
              </div>
              <div
                v-if="draft.h2h[grp.key].length"
                class="d-flex mb-1"
                style="gap: 10px"
              >
                <small class="text-muted flex-grow-1">Label</small>
                <small class="text-muted" style="width: 100px; flex: 0 0 100px"
                  >Detik</small
                >
                <span style="width: 32px; flex: 0 0 32px"></span>
              </div>
              <div
                v-for="(p, idx) in draft.h2h[grp.key]"
                :key="grp.key + '-' + idx"
                class="d-flex align-items-center mb-2"
                style="gap: 10px"
              >
                <b-form-input
                  v-model="p.label"
                  placeholder="Label"
                  style="border-radius: 10px"
                  class="flex-grow-1"
                />
                <b-form-input
                  v-model.number="p.value"
                  type="number"
                  min="0"
                  max="600"
                  placeholder="Detik"
                  style="border-radius: 10px; width: 100px; flex: 0 0 100px"
                />
                <b-button
                  size="sm"
                  variant="outline-danger"
                  style="border-radius: 8px"
                  :disabled="draft.h2h[grp.key].length <= 1"
                  @click="removePenaltyRow('h2h', grp.key, idx)"
                >
                  ✕
                </b-button>
              </div>
            </div>

            <hr class="rs-divider" />

            <!-- SCORE BY RANK -->
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="font-weight-bold">Score by Rank</div>
              <b-button
                size="sm"
                variant="outline-primary"
                style="border-radius: 8px"
                :disabled="draft.h2h.scoreByRank.length >= maxSprintScoreRows"
                @click="addScoreRow('h2h')"
              >
                + Tambah
              </b-button>
            </div>
            <div
              v-if="draft.h2h.scoreByRank.length"
              class="d-flex mb-1"
              style="gap: 10px"
            >
              <small class="text-muted" style="width: 70px; flex: 0 0 70px"
                >Rank</small
              >
              <small class="text-muted flex-grow-1">Score</small>
              <span style="width: 32px; flex: 0 0 32px"></span>
            </div>
            <div
              class="rs-score-list"
              style="max-height: 260px; overflow-y: auto"
            >
              <div
                v-for="(p, idx) in draft.h2h.scoreByRank"
                :key="'h2h-score-' + idx"
                class="d-flex align-items-center mb-2"
                style="gap: 10px"
              >
                <b-form-input
                  :value="p.ranking"
                  disabled
                  style="border-radius: 10px; width: 70px; flex: 0 0 70px"
                />
                <b-form-input
                  v-model.number="p.score"
                  type="number"
                  min="0"
                  max="1000"
                  placeholder="Score"
                  style="border-radius: 10px"
                  class="flex-grow-1"
                />
                <b-button
                  size="sm"
                  variant="outline-danger"
                  style="border-radius: 8px"
                  :disabled="draft.h2h.scoreByRank.length <= 1"
                  @click="removeScoreRow('h2h', idx)"
                >
                  ✕
                </b-button>
              </div>
            </div>
            <small class="text-muted d-block mt-1 mb-2">
              Rank menyesuaikan urutan baris otomatis.
            </small>

            <div class="d-flex align-items-center mt-2" style="gap: 10px">
              <div class="font-weight-bold" style="white-space: nowrap">
                Score utk Rank {{ draft.h2h.scoreByRank.length + 1 }} dan
                seterusnya
              </div>
              <b-form-input
                v-model.number="draft.h2h.defaultScoreBeyondRank"
                type="number"
                min="0"
                max="1000"
                placeholder="0"
                style="border-radius: 10px; width: 100px; flex: 0 0 100px"
              />
            </div>
            <small class="text-muted d-block mt-1">
              Berlaku utk semua tim dengan peringkat di luar daftar di atas
              (mis. isi list Rank 1–4, lalu isi di sini utk Rank 5+). Isi 0
              kalau tim di luar daftar tidak mendapat score sama sekali.
            </small>

            <hr class="rs-divider" />

            <!-- PDF RESULT: on/off kolom tanda tangan -->
            <div class="font-weight-bold mb-2">PDF Result</div>
            <small class="text-muted d-block mb-2">
              Nama & tanda tangan diatur di Event Detail — di sini cuma
              mengatur tampil/tidaknya kolomnya di PDF Result Head to Head.
            </small>
            <b-form-checkbox
              class="rs-switch mb-2"
              switch
              v-model="draft.h2h.showTechnicalDelegate"
              >Tampilkan Technical Delegate</b-form-checkbox
            >
            <b-form-checkbox
              class="rs-switch mb-2"
              switch
              v-model="draft.h2h.showChiefJudge"
              >Tampilkan Chief Judge</b-form-checkbox
            >
            <b-form-checkbox
              class="rs-switch mb-2"
              switch
              v-model="draft.h2h.showRaceDirector"
              >Tampilkan Race Director</b-form-checkbox
            >

            </div>
          </div>
        </div>

        <!-- SLALOM -->
        <div class="rs-card mb-3" v-if="showSlalom">
          <div class="px-3 py-3">
            <div
              class="h4 font-weight-bold mb-3 rs-section-toggle rs-header-row"
              @click="toggleSection('slalom')"
            >
              <span class="rs-header-text">
                <Icon
                  :icon="
                    collapsedSections.slalom
                      ? 'mdi:chevron-right'
                      : 'mdi:chevron-down'
                  "
                  class="mr-1"
                />
                Slalom
              </span>
              <img class="rs-section-banner" :src="slalomBannerImg" alt="" />
            </div>
            <div v-show="!collapsedSections.slalom">
            <div class="font-weight-bold mb-2">Gates Setting</div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="mb-0 font-weight-500">Total Gate</label>
            </div>
            <b-form-spinbutton
              style="border-radius: 10px"
              v-model="draft.slalom.totalGate"
              :max="maxGate"
              :min="minGate"
              step="1"
              class="w-100"
            />
            <div class="d-flex justify-content-between">
              <small class="text-danger">Min {{ minGate }} Gate</small>
              <small class="text-danger">Max {{ maxGate }} Gate</small>
            </div>

            <hr class="rs-divider" />

            <!-- PILIHAN PEN. START/FINISH/GATES -->
            <!-- Totalnya (jumlah gate) tetap ikut "Total Gate" di atas —
                 konfigurasi ini cuma daftar NILAI penalty yg bisa dipilih
                 operator per Start/Finish/tiap Gate, bukan jumlah gate. -->
            <div
              v-for="grp in slalomPenaltyGroups"
              :key="grp.key"
              class="mb-4"
            >
              <div
                class="d-flex justify-content-between align-items-center mb-2"
              >
                <div class="font-weight-bold">{{ grp.title }}</div>
                <b-button
                  size="sm"
                  variant="outline-primary"
                  style="border-radius: 8px"
                  :disabled="draft.slalom[grp.key].length >= maxSprintPenalties"
                  @click="addPenaltyRow('slalom', grp.key)"
                >
                  + Tambah
                </b-button>
              </div>
              <div
                v-if="draft.slalom[grp.key].length"
                class="d-flex mb-1"
                style="gap: 10px"
              >
                <small class="text-muted flex-grow-1">Label</small>
                <small class="text-muted" style="width: 100px; flex: 0 0 100px"
                  >Detik</small
                >
                <span style="width: 32px; flex: 0 0 32px"></span>
              </div>
              <div
                v-for="(p, idx) in draft.slalom[grp.key]"
                :key="grp.key + '-' + idx"
                class="d-flex align-items-center mb-2"
                style="gap: 10px"
              >
                <b-form-input
                  v-model="p.label"
                  placeholder="Label"
                  style="border-radius: 10px"
                  class="flex-grow-1"
                />
                <b-form-input
                  v-model.number="p.value"
                  type="number"
                  min="0"
                  max="600"
                  placeholder="Detik"
                  style="border-radius: 10px; width: 100px; flex: 0 0 100px"
                />
                <b-button
                  size="sm"
                  variant="outline-danger"
                  style="border-radius: 8px"
                  :disabled="draft.slalom[grp.key].length <= 1"
                  @click="removePenaltyRow('slalom', grp.key, idx)"
                >
                  ✕
                </b-button>
              </div>
            </div>

            <hr class="rs-divider" />

            <!-- SCORE BY RANK -->
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="font-weight-bold">Score by Rank</div>
              <b-button
                size="sm"
                variant="outline-primary"
                style="border-radius: 8px"
                :disabled="draft.slalom.scoreByRank.length >= maxSprintScoreRows"
                @click="addScoreRow('slalom')"
              >
                + Tambah
              </b-button>
            </div>
            <div
              v-if="draft.slalom.scoreByRank.length"
              class="d-flex mb-1"
              style="gap: 10px"
            >
              <small class="text-muted" style="width: 70px; flex: 0 0 70px"
                >Rank</small
              >
              <small class="text-muted flex-grow-1">Score</small>
              <span style="width: 32px; flex: 0 0 32px"></span>
            </div>
            <div
              class="rs-score-list"
              style="max-height: 260px; overflow-y: auto"
            >
              <div
                v-for="(p, idx) in draft.slalom.scoreByRank"
                :key="'slalom-score-' + idx"
                class="d-flex align-items-center mb-2"
                style="gap: 10px"
              >
                <b-form-input
                  :value="p.ranking"
                  disabled
                  style="border-radius: 10px; width: 70px; flex: 0 0 70px"
                />
                <b-form-input
                  v-model.number="p.score"
                  type="number"
                  min="0"
                  max="1000"
                  placeholder="Score"
                  style="border-radius: 10px"
                  class="flex-grow-1"
                />
                <b-button
                  size="sm"
                  variant="outline-danger"
                  style="border-radius: 8px"
                  :disabled="draft.slalom.scoreByRank.length <= 1"
                  @click="removeScoreRow('slalom', idx)"
                >
                  ✕
                </b-button>
              </div>
            </div>
            <small class="text-muted d-block mt-1 mb-2">
              Rank menyesuaikan urutan baris otomatis.
            </small>

            <div class="d-flex align-items-center mt-2" style="gap: 10px">
              <div class="font-weight-bold" style="white-space: nowrap">
                Score utk Rank {{ draft.slalom.scoreByRank.length + 1 }} dan
                seterusnya
              </div>
              <b-form-input
                v-model.number="draft.slalom.defaultScoreBeyondRank"
                type="number"
                min="0"
                max="1000"
                placeholder="0"
                style="border-radius: 10px; width: 100px; flex: 0 0 100px"
              />
            </div>
            <small class="text-muted d-block mt-1">
              Berlaku utk semua tim dengan peringkat di luar daftar di atas
              (mis. isi list Rank 1–5, lalu isi di sini utk Rank 6+). Isi 0
              kalau tim di luar daftar tidak mendapat score sama sekali.
            </small>

            <hr class="rs-divider" />

            <!-- PDF RESULT: on/off kolom tanda tangan -->
            <div class="font-weight-bold mb-2">PDF Result</div>
            <small class="text-muted d-block mb-2">
              Nama & tanda tangan diatur di Event Detail — di sini cuma
              mengatur tampil/tidaknya kolomnya di PDF Result Slalom.
            </small>
            <b-form-checkbox
              class="rs-switch mb-2"
              switch
              v-model="draft.slalom.showTechnicalDelegate"
              >Tampilkan Technical Delegate</b-form-checkbox
            >
            <b-form-checkbox
              class="rs-switch mb-2"
              switch
              v-model="draft.slalom.showChiefJudge"
              >Tampilkan Chief Judge</b-form-checkbox
            >
            <b-form-checkbox
              class="rs-switch mb-2"
              switch
              v-model="draft.slalom.showRaceDirector"
              >Tampilkan Race Director</b-form-checkbox
            >
            </div>
          </div>
        </div>

        <!-- DOWN RIVER RACE -->
        <div class="rs-card mb-3" v-if="showDrr">
          <div class="px-3 py-3">
            <div
              class="h4 font-weight-bold mb-3 rs-section-toggle rs-header-row"
              @click="toggleSection('drr')"
            >
              <span class="rs-header-text">
                <Icon
                  :icon="
                    collapsedSections.drr ? 'mdi:chevron-right' : 'mdi:chevron-down'
                  "
                  class="mr-1"
                />
                Down River Race
              </span>
              <img class="rs-section-banner" :src="drrBannerImg" alt="" />
            </div>
            <div v-show="!collapsedSections.drr">
            <div class="font-weight-bold mb-2">Section Setting</div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="mb-0 font-weight-500">Total Section</label>
            </div>
            <b-form-spinbutton
              style="border-radius: 10px"
              v-model="draft.drr.totalSection"
              :min="minSection"
              :max="maxSection"
              step="1"
              class="w-100"
            />
            <div class="d-flex justify-content-between">
              <small class="text-danger">Min {{ minSection }} Section</small>
              <small class="text-danger">Max {{ maxSection }} Section</small>
            </div>

            <hr class="rs-divider" />

            <!-- PILIHAN PEN. START/FINISH/SECTION -->
            <!-- Tentukan dulu Total Section di atas (min 2), baru atur
                 daftar nilai penalty yg bisa dipilih di sini — daftar ini
                 CUMA pilihan nilai per Start/Finish/tiap Section, bukan
                 jumlah section itu sendiri. -->
            <div
              v-for="grp in drrPenaltyGroups"
              :key="grp.key"
              class="mb-4"
            >
              <div
                class="d-flex justify-content-between align-items-center mb-2"
              >
                <div class="font-weight-bold">{{ grp.title }}</div>
                <b-button
                  size="sm"
                  variant="outline-primary"
                  style="border-radius: 8px"
                  :disabled="draft.drr[grp.key].length >= maxSprintPenalties"
                  @click="addPenaltyRow('drr', grp.key)"
                >
                  + Tambah
                </b-button>
              </div>
              <div
                v-if="draft.drr[grp.key].length"
                class="d-flex mb-1"
                style="gap: 10px"
              >
                <small class="text-muted flex-grow-1">Label</small>
                <small class="text-muted" style="width: 100px; flex: 0 0 100px"
                  >Detik</small
                >
                <span style="width: 32px; flex: 0 0 32px"></span>
              </div>
              <div
                v-for="(p, idx) in draft.drr[grp.key]"
                :key="grp.key + '-' + idx"
                class="d-flex align-items-center mb-2"
                style="gap: 10px"
              >
                <b-form-input
                  v-model="p.label"
                  placeholder="Label"
                  style="border-radius: 10px"
                  class="flex-grow-1"
                />
                <b-form-input
                  v-model.number="p.value"
                  type="number"
                  :min="grp.key === 'sectionPenalties' ? -600 : 0"
                  max="600"
                  :placeholder="
                    grp.key === 'sectionPenalties' ? 'Detik (boleh minus)' : 'Detik'
                  "
                  style="border-radius: 10px; width: 100px; flex: 0 0 100px"
                />
                <b-button
                  size="sm"
                  variant="outline-danger"
                  style="border-radius: 8px"
                  :disabled="draft.drr[grp.key].length <= 1"
                  @click="removePenaltyRow('drr', grp.key, idx)"
                >
                  ✕
                </b-button>
              </div>
              <small v-if="grp.key === 'sectionPenalties'" class="text-muted d-block mt-1">
                Nilai minus (mis. -10) berlaku sbg bonus/pengurang waktu penalty.
              </small>
            </div>

            <hr class="rs-divider" />

            <!-- SCORE BY RANK -->
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="font-weight-bold">Score by Rank</div>
              <b-button
                size="sm"
                variant="outline-primary"
                style="border-radius: 8px"
                :disabled="draft.drr.scoreByRank.length >= maxSprintScoreRows"
                @click="addScoreRow('drr')"
              >
                + Tambah
              </b-button>
            </div>
            <div
              v-if="draft.drr.scoreByRank.length"
              class="d-flex mb-1"
              style="gap: 10px"
            >
              <small class="text-muted" style="width: 70px; flex: 0 0 70px"
                >Rank</small
              >
              <small class="text-muted flex-grow-1">Score</small>
              <span style="width: 32px; flex: 0 0 32px"></span>
            </div>
            <div
              class="rs-score-list"
              style="max-height: 260px; overflow-y: auto"
            >
              <div
                v-for="(p, idx) in draft.drr.scoreByRank"
                :key="'drr-score-' + idx"
                class="d-flex align-items-center mb-2"
                style="gap: 10px"
              >
                <b-form-input
                  :value="p.ranking"
                  disabled
                  style="border-radius: 10px; width: 70px; flex: 0 0 70px"
                />
                <b-form-input
                  v-model.number="p.score"
                  type="number"
                  min="0"
                  max="1000"
                  placeholder="Score"
                  style="border-radius: 10px"
                  class="flex-grow-1"
                />
                <b-button
                  size="sm"
                  variant="outline-danger"
                  style="border-radius: 8px"
                  :disabled="draft.drr.scoreByRank.length <= 1"
                  @click="removeScoreRow('drr', idx)"
                >
                  ✕
                </b-button>
              </div>
            </div>
            <small class="text-muted d-block mt-1 mb-2">
              Rank menyesuaikan urutan baris otomatis.
            </small>

            <div class="d-flex align-items-center mt-2" style="gap: 10px">
              <div class="font-weight-bold" style="white-space: nowrap">
                Score utk Rank {{ draft.drr.scoreByRank.length + 1 }} dan
                seterusnya
              </div>
              <b-form-input
                v-model.number="draft.drr.defaultScoreBeyondRank"
                type="number"
                min="0"
                max="1000"
                placeholder="0"
                style="border-radius: 10px; width: 100px; flex: 0 0 100px"
              />
            </div>
            <small class="text-muted d-block mt-1">
              Berlaku utk semua tim dengan peringkat di luar daftar di atas
              (mis. isi list Rank 1–5, lalu isi di sini utk Rank 6+). Isi 0
              kalau tim di luar daftar tidak mendapat score sama sekali.
            </small>

            <hr class="rs-divider" />

            <!-- PDF RESULT: on/off kolom tanda tangan -->
            <div class="font-weight-bold mb-2">PDF Result</div>
            <small class="text-muted d-block mb-2">
              Nama & tanda tangan diatur di Event Detail — di sini cuma
              mengatur tampil/tidaknya kolomnya di PDF Result DRR.
            </small>
            <b-form-checkbox
              class="rs-switch mb-2"
              switch
              v-model="draft.drr.showTechnicalDelegate"
              >Tampilkan Technical Delegate</b-form-checkbox
            >
            <b-form-checkbox
              class="rs-switch mb-2"
              switch
              v-model="draft.drr.showChiefJudge"
              >Tampilkan Chief Judge</b-form-checkbox
            >
            <b-form-checkbox
              class="rs-switch mb-2"
              switch
              v-model="draft.drr.showRaceDirector"
              >Tampilkan Race Director</b-form-checkbox
            >
            </div>
          </div>
        </div>

        <!-- RAFTING CROSS -->
        <div class="rs-card mb-3" v-if="showRx">
          <div class="px-3 py-3">
            <div
              class="h4 font-weight-bold mb-3 rs-section-toggle rs-header-row"
              @click="toggleSection('rx')"
            >
              <span class="rs-header-text">
                <Icon
                  :icon="
                    collapsedSections.rx ? 'mdi:chevron-right' : 'mdi:chevron-down'
                  "
                  class="mr-1"
                />
                Rafting Cross
              </span>
              <img class="rs-section-banner" :src="rxBannerImg" alt="" />
            </div>
            <div v-show="!collapsedSections.rx">
            <div class="font-weight-bold mb-2">Heat Setting</div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="mb-0 font-weight-500">Teams per Heat</label>
            </div>
            <b-form-spinbutton
              style="border-radius: 10px"
              v-model="draft.rx.teamsPerHeat"
              :min="minTeamsPerHeat"
              :max="maxTeamsPerHeat"
              step="1"
              class="w-100"
            />
            <div class="d-flex justify-content-between mb-3">
              <small class="text-danger">Min {{ minTeamsPerHeat }} Teams</small>
              <small class="text-danger">Max {{ maxTeamsPerHeat }} Teams</small>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="mb-0 font-weight-500">Qualifiers per Heat</label>
            </div>
            <b-form-spinbutton
              style="border-radius: 10px"
              v-model="draft.rx.qualifiersPerHeat"
              :min="1"
              :max="draft.rx.teamsPerHeat - 1"
              step="1"
              class="w-100"
            />
            <div class="d-flex justify-content-between mb-3">
              <small class="text-muted"
                >Must be less than Teams per Heat</small
              >
            </div>
            <div class="font-weight-bold mb-2">Gate Penalty</div>
            <div class="d-flex flex-wrap align-items-center" style="gap: 28px">
              <b-form-checkbox
                class="rs-switch"
                switch
                v-model="draft.rx.gate1.enabled"
                >Gate 1</b-form-checkbox
              >
              <b-form-checkbox
                class="rs-switch"
                switch
                v-model="draft.rx.gate2.enabled"
                >Gate 2</b-form-checkbox
              >
            </div>

            <hr class="rs-divider" />

            <!-- PILIHAN PEN. GATE 1/GATE 2 -->
            <!-- Independen per gate (dulu Gate 1 & Gate 2 berbagi 1 daftar
                 global yg sama, tidak bisa dikustomisasi per-event sama
                 sekali) — daftar ini cuma pilihan NILAI penalty, bukan
                 on/off gate-nya sendiri (diatur di toggle Gate 1/Gate 2 di
                 atas). -->
            <div v-for="grp in rxPenaltyGroups" :key="grp.key" class="mb-4">
              <div
                class="d-flex justify-content-between align-items-center mb-2"
              >
                <div class="font-weight-bold">{{ grp.title }}</div>
                <b-button
                  size="sm"
                  variant="outline-primary"
                  style="border-radius: 8px"
                  :disabled="draft.rx[grp.key].length >= maxSprintPenalties"
                  @click="addPenaltyRow('rx', grp.key)"
                >
                  + Tambah
                </b-button>
              </div>
              <div
                v-if="draft.rx[grp.key].length"
                class="d-flex mb-1"
                style="gap: 10px"
              >
                <small class="text-muted flex-grow-1">Label</small>
                <small class="text-muted" style="width: 100px; flex: 0 0 100px"
                  >Detik</small
                >
                <span style="width: 32px; flex: 0 0 32px"></span>
              </div>
              <div
                v-for="(p, idx) in draft.rx[grp.key]"
                :key="grp.key + '-' + idx"
                class="d-flex align-items-center mb-2"
                style="gap: 10px"
              >
                <b-form-input
                  v-model="p.label"
                  placeholder="Label"
                  style="border-radius: 10px"
                  class="flex-grow-1"
                />
                <b-form-input
                  v-model.number="p.value"
                  type="number"
                  min="0"
                  max="600"
                  placeholder="Detik"
                  style="border-radius: 10px; width: 100px; flex: 0 0 100px"
                />
                <b-button
                  size="sm"
                  variant="outline-danger"
                  style="border-radius: 8px"
                  :disabled="draft.rx[grp.key].length <= 1"
                  @click="removePenaltyRow('rx', grp.key, idx)"
                >
                  ✕
                </b-button>
              </div>
            </div>

            <hr class="rs-divider" />

            <!-- SCORE BY RANK -->
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="font-weight-bold">Score by Rank</div>
              <b-button
                size="sm"
                variant="outline-primary"
                style="border-radius: 8px"
                :disabled="draft.rx.scoreByRank.length >= maxSprintScoreRows"
                @click="addScoreRow('rx')"
              >
                + Tambah
              </b-button>
            </div>
            <div
              v-if="draft.rx.scoreByRank.length"
              class="d-flex mb-1"
              style="gap: 10px"
            >
              <small class="text-muted" style="width: 70px; flex: 0 0 70px"
                >Rank</small
              >
              <small class="text-muted flex-grow-1">Score</small>
              <span style="width: 32px; flex: 0 0 32px"></span>
            </div>
            <div
              class="rs-score-list"
              style="max-height: 260px; overflow-y: auto"
            >
              <div
                v-for="(p, idx) in draft.rx.scoreByRank"
                :key="'rx-score-' + idx"
                class="d-flex align-items-center mb-2"
                style="gap: 10px"
              >
                <b-form-input
                  :value="p.ranking"
                  disabled
                  style="border-radius: 10px; width: 70px; flex: 0 0 70px"
                />
                <b-form-input
                  v-model.number="p.score"
                  type="number"
                  min="0"
                  max="1000"
                  placeholder="Score"
                  style="border-radius: 10px"
                  class="flex-grow-1"
                />
                <b-button
                  size="sm"
                  variant="outline-danger"
                  style="border-radius: 8px"
                  :disabled="draft.rx.scoreByRank.length <= 1"
                  @click="removeScoreRow('rx', idx)"
                >
                  ✕
                </b-button>
              </div>
            </div>
            <small class="text-muted d-block mt-1 mb-2">
              Rank menyesuaikan urutan baris otomatis.
            </small>

            <div class="d-flex align-items-center mt-2" style="gap: 10px">
              <div class="font-weight-bold" style="white-space: nowrap">
                Score utk Rank {{ draft.rx.scoreByRank.length + 1 }} dan
                seterusnya
              </div>
              <b-form-input
                v-model.number="draft.rx.defaultScoreBeyondRank"
                type="number"
                min="0"
                max="1000"
                placeholder="0"
                style="border-radius: 10px; width: 100px; flex: 0 0 100px"
              />
            </div>
            <small class="text-muted d-block mt-1">
              Berlaku utk semua tim dengan peringkat di luar daftar di atas
              (mis. isi list Rank 1–5, lalu isi di sini utk Rank 6+). Isi 0
              kalau tim di luar daftar tidak mendapat score sama sekali.
            </small>

            <hr class="rs-divider" />

            <!-- PDF RESULT: on/off kolom tanda tangan -->
            <div class="font-weight-bold mb-2">PDF Result</div>
            <small class="text-muted d-block mb-2">
              Nama & tanda tangan diatur di Event Detail — di sini cuma
              mengatur tampil/tidaknya kolomnya di PDF Result Rafting Cross.
            </small>
            <b-form-checkbox
              class="rs-switch mb-2"
              switch
              v-model="draft.rx.showTechnicalDelegate"
              >Tampilkan Technical Delegate</b-form-checkbox
            >
            <b-form-checkbox
              class="rs-switch mb-2"
              switch
              v-model="draft.rx.showChiefJudge"
              >Tampilkan Chief Judge</b-form-checkbox
            >
            <b-form-checkbox
              class="rs-switch mb-2"
              switch
              v-model="draft.rx.showRaceDirector"
              >Tampilkan Race Director</b-form-checkbox
            >
            </div>
          </div>
        </div>

        <div
          v-if="!showSprint && !showH2H && !showSlalom && !showDrr && !showRx"
          class="text-center text-muted py-4"
        >
          Belum ada Race Category yang dipilih untuk event ini. Atur dulu di
          Event Settings.
        </div>

        <!-- Footer -->
        <div class="d-flex justify-content-between align-items-center mt-4">
          <b-button
            style="border-radius: 12px"
            variant="outline-danger"
            @click="close"
            >Cancel</b-button
          >
          <b-button
            style="border-radius: 12px"
            class="px-4 btn-confirm"
            variant="outline-primary"
            @click="confirm"
            >Update</b-button
          >
        </div>
      </div>
    </div>

    <div v-else class="p-5 text-center text-muted">Loading…</div>
  </b-modal>
</template>

<script>
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";
import { loadEnabledCategoryKeys } from "@/utils/eventCategories";
// Gambar dekoratif di pojok kanan header tiap panel kategori (immersive) —
// satu gambar khas per kategori, murni visual (tidak ada makna fungsional).
import sprintBannerImg from "@/assets/images/Rectangle-3.png";
import h2hBannerImg from "@/assets/images/Rectangle-4.png";
import slalomBannerImg from "@/assets/images/Rectangle-4-1.png";
import drrBannerImg from "@/assets/images/Rectangle-4-2.png";
import rxBannerImg from "@/assets/images/Rectangle-5.png";

// Default sesuai Pasal 37 & 43 FAJI: PS (Pen. Start) = 0/50 detik,
// PF (Pen. Finish) = 0/10 detik. PS dan PF diatur independen.
const DEFAULT_START_PENALTIES = [
  { label: "0", value: 0 },
  { label: "50", value: 50 },
];
const DEFAULT_FINISH_PENALTIES = [
  { label: "0", value: 0 },
  { label: "10", value: 10 },
];

// Default tabel Rank -> Score Sprint (sama dgn optionRanked type "SPRINT"
// yang sebelumnya hardcoded/global) — sekarang bisa dikustomisasi per-event.
const DEFAULT_SPRINT_SCORE_BY_RANK = [
  { ranking: 1, score: 100 },
  { ranking: 2, score: 92 },
  { ranking: 3, score: 86 },
  { ranking: 4, score: 82 },
  { ranking: 5, score: 79 },
  { ranking: 6, score: 76 },
  { ranking: 7, score: 73 },
  { ranking: 8, score: 70 },
  { ranking: 9, score: 67 },
  { ranking: 10, score: 64 },
  { ranking: 11, score: 61 },
  { ranking: 12, score: 58 },
  { ranking: 13, score: 55 },
  { ranking: 14, score: 52 },
  { ranking: 15, score: 49 },
  { ranking: 16, score: 46 },
  { ranking: 17, score: 43 },
  { ranking: 18, score: 40 },
  { ranking: 19, score: 38 },
  { ranking: 20, score: 36 },
  { ranking: 21, score: 34 },
  { ranking: 22, score: 32 },
  { ranking: 23, score: 30 },
  { ranking: 24, score: 28 },
  { ranking: 25, score: 26 },
  { ranking: 26, score: 24 },
  { ranking: 27, score: 22 },
  { ranking: 28, score: 20 },
  { ranking: 29, score: 18 },
  { ranking: 30, score: 16 },
  { ranking: 31, score: 14 },
  { ranking: 32, score: 12 },
];

// Default H2H PS/CL/PF — sebelumnya berbagi satu list yang sama (0/5/10/50),
// sekarang tiap satu (PS, CL, PF) diatur independen.
const DEFAULT_H2H_PENALTIES = [
  { label: "0", value: 0 },
  { label: "5", value: 5 },
  { label: "10", value: 10 },
  { label: "50", value: 50 },
];

// Default Pilihan Pen. Start (PS) / Pen. Finish (PF) / Pen. Gates (PG)
// Slalom — sebelumnya hardcoded & TIDAK bisa dikustomisasi sama sekali
// (PS/PF berbagi {0,10,50}, Gate {0,5,50} tetap di kode SlalomRace.vue).
// Sekarang independen per-event, pola sama dgn DEFAULT_H2H_PENALTIES.
const DEFAULT_SLALOM_START_PENALTIES = [
  { label: "0", value: 0 },
  { label: "10", value: 10 },
  { label: "50", value: 50 },
];
const DEFAULT_SLALOM_FINISH_PENALTIES = [
  { label: "0", value: 0 },
  { label: "10", value: 10 },
  { label: "50", value: 50 },
];
const DEFAULT_SLALOM_GATE_PENALTIES = [
  { label: "0", value: 0 },
  { label: "5", value: 5 },
  { label: "50", value: 50 },
];

// Default Pilihan Pen. Start (PS) / Pen. Finish (PF) / Pen. Section DRR —
// sebelumnya hardcoded & TIDAK bisa dikustomisasi sama sekali (PS/PF
// berbagi whitelist {0,10,50} langsung di kode DownRiverRace.vue, Section
// selalu pakai daftar optionPenalties global tanpa filter). Sekarang
// independen per-event, pola sama dgn DEFAULT_SLALOM_*_PENALTIES.
const DEFAULT_DRR_START_PENALTIES = [
  { label: "0", value: 0 },
  { label: "10", value: 10 },
  { label: "50", value: 50 },
];
const DEFAULT_DRR_FINISH_PENALTIES = [
  { label: "0", value: 0 },
  { label: "10", value: 10 },
  { label: "50", value: 50 },
];
const DEFAULT_DRR_SECTION_PENALTIES = [
  { label: "0", value: 0 },
  { label: "5", value: 5 },
  { label: "10", value: 10 },
  { label: "50", value: 50 },
];

// Default Pilihan Pen. Gate 1 (G1) / Pen. Gate 2 (G2) Rafting Cross —
// sebelumnya kedua gate berbagi SATU daftar optionPenalties GLOBAL yang
// sama (tidak bisa dikustomisasi per-event sama sekali). Sekarang masing2
// independen per-event, pola sama dgn DEFAULT_SLALOM_*_PENALTIES.
const DEFAULT_RX_GATE1_PENALTIES = [
  { label: "0", value: 0 },
  { label: "10", value: 10 },
  { label: "50", value: 50 },
];
const DEFAULT_RX_GATE2_PENALTIES = [
  { label: "0", value: 0 },
  { label: "10", value: 10 },
  { label: "50", value: 50 },
];

// Default tabel Rank -> Score H2H, sama persis dgn optionRanked type
// "HEADTOHEAD" yang sebelumnya hardcoded/global — sekarang bisa
// dikustomisasi per-event (pola sama dgn DEFAULT_SPRINT_SCORE_BY_RANK).
const DEFAULT_H2H_SCORE_BY_RANK = [
  { ranking: 1, score: 100 },
  { ranking: 2, score: 92 },
  { ranking: 3, score: 86 },
  { ranking: 4, score: 82 },
  { ranking: 5, score: 79 },
  { ranking: 6, score: 76 },
  { ranking: 7, score: 73 },
  { ranking: 8, score: 70 },
  { ranking: 9, score: 67 },
  { ranking: 10, score: 64 },
  { ranking: 11, score: 61 },
  { ranking: 12, score: 58 },
  { ranking: 13, score: 55 },
  { ranking: 14, score: 52 },
  { ranking: 15, score: 49 },
  { ranking: 16, score: 46 },
  { ranking: 17, score: 43 },
  { ranking: 18, score: 40 },
  { ranking: 19, score: 38 },
  { ranking: 20, score: 36 },
  { ranking: 21, score: 34 },
  { ranking: 22, score: 32 },
  { ranking: 23, score: 30 },
  { ranking: 24, score: 28 },
  { ranking: 25, score: 26 },
  { ranking: 26, score: 24 },
  { ranking: 27, score: 22 },
  { ranking: 28, score: 20 },
  { ranking: 29, score: 18 },
  { ranking: 30, score: 16 },
  { ranking: 31, score: 14 },
  { ranking: 32, score: 12 },
];

// Default tabel Rank -> Score Slalom & DRR, sama persis dgn optionRanked
// type "SLALOM" (dan tabel hardcoded DRR) yang sebelumnya
// hardcoded/global — sekarang bisa dikustomisasi per-event.
const DEFAULT_SLALOM_SCORE_BY_RANK = [
  { ranking: 1, score: 350 },
  { ranking: 2, score: 322 },
  { ranking: 3, score: 301 },
  { ranking: 4, score: 287 },
  { ranking: 5, score: 277 },
  { ranking: 6, score: 266 },
  { ranking: 7, score: 256 },
  { ranking: 8, score: 245 },
  { ranking: 9, score: 235 },
  { ranking: 10, score: 224 },
  { ranking: 11, score: 214 },
  { ranking: 12, score: 203 },
  { ranking: 13, score: 193 },
  { ranking: 14, score: 182 },
  { ranking: 15, score: 172 },
  { ranking: 16, score: 161 },
  { ranking: 17, score: 151 },
  { ranking: 18, score: 140 },
  { ranking: 19, score: 133 },
  { ranking: 20, score: 126 },
  { ranking: 21, score: 119 },
  { ranking: 22, score: 112 },
  { ranking: 23, score: 105 },
  { ranking: 24, score: 98 },
  { ranking: 25, score: 91 },
  { ranking: 26, score: 84 },
  { ranking: 27, score: 77 },
  { ranking: 28, score: 70 },
  { ranking: 29, score: 63 },
  { ranking: 30, score: 56 },
  { ranking: 31, score: 49 },
  { ranking: 32, score: 42 },
];
const DEFAULT_DRR_SCORE_BY_RANK = DEFAULT_SLALOM_SCORE_BY_RANK.map((p) => ({
  ...p,
}));

// RX belum punya kurva sendiri — dibuat mirip Sprint dulu sesuai
// permintaan (bisa dikustomisasi belakangan per-event).
const DEFAULT_RX_SCORE_BY_RANK = DEFAULT_SPRINT_SCORE_BY_RANK.map((p) => ({
  ...p,
}));

// Default on/off kolom Technical Delegate/Chief Judge/Race Director di PDF
// Result per kategori — default TAMPIL (true) di kelimanya, event manager
// bisa matikan per kategori lewat toggle di bawah kalau tidak relevan utk
// kategori itu (mis. Chief Judge cuma ada di Sprint, TD tidak dipakai di RX).
const DEFAULT_PDF_SIGNATURE_TOGGLES = {
  showTechnicalDelegate: true,
  showChiefJudge: true,
  showRaceDirector: true,
};

const DEFAULT_SETTINGS = {
  sprint: {
    startPenalties: DEFAULT_START_PENALTIES.map((p) => ({ ...p })),
    finishPenalties: DEFAULT_FINISH_PENALTIES.map((p) => ({ ...p })),
    scoreByRank: DEFAULT_SPRINT_SCORE_BY_RANK.map((p) => ({ ...p })),
    // score utk tim dgn rank di luar daftar scoreByRank (mis. list cuma
    // diisi Rank 1-5, sisanya 6+ semua dapat score ini). 0 = tidak dapat
    // score.
    defaultScoreBeyondRank: 0,
    ...DEFAULT_PDF_SIGNATURE_TOGGLES,
  },
  h2h: {
    R1: true,
    R2: true,
    L1: true,
    L2: true,
    startPenalties: DEFAULT_H2H_PENALTIES.map((p) => ({ ...p })),
    cutLinePenalties: DEFAULT_H2H_PENALTIES.map((p) => ({ ...p })),
    finishPenalties: DEFAULT_H2H_PENALTIES.map((p) => ({ ...p })),
    scoreByRank: DEFAULT_H2H_SCORE_BY_RANK.map((p) => ({ ...p })),
    defaultScoreBeyondRank: 0,
    ...DEFAULT_PDF_SIGNATURE_TOGGLES,
  },
  slalom: {
    totalGate: 14,
    startPenalties: DEFAULT_SLALOM_START_PENALTIES.map((p) => ({ ...p })),
    finishPenalties: DEFAULT_SLALOM_FINISH_PENALTIES.map((p) => ({ ...p })),
    gatePenalties: DEFAULT_SLALOM_GATE_PENALTIES.map((p) => ({ ...p })),
    scoreByRank: DEFAULT_SLALOM_SCORE_BY_RANK.map((p) => ({ ...p })),
    defaultScoreBeyondRank: 0,
    ...DEFAULT_PDF_SIGNATURE_TOGGLES,
  },
  drr: {
    totalSection: 5,
    startPenalties: DEFAULT_DRR_START_PENALTIES.map((p) => ({ ...p })),
    finishPenalties: DEFAULT_DRR_FINISH_PENALTIES.map((p) => ({ ...p })),
    sectionPenalties: DEFAULT_DRR_SECTION_PENALTIES.map((p) => ({ ...p })),
    scoreByRank: DEFAULT_DRR_SCORE_BY_RANK.map((p) => ({ ...p })),
    defaultScoreBeyondRank: 0,
    ...DEFAULT_PDF_SIGNATURE_TOGGLES,
  },
  rx: {
    teamsPerHeat: 4,
    qualifiersPerHeat: 2,
    gate1: { enabled: true },
    gate2: { enabled: true },
    gate1Penalties: DEFAULT_RX_GATE1_PENALTIES.map((p) => ({ ...p })),
    gate2Penalties: DEFAULT_RX_GATE2_PENALTIES.map((p) => ({ ...p })),
    scoreByRank: DEFAULT_RX_SCORE_BY_RANK.map((p) => ({ ...p })),
    defaultScoreBeyondRank: 0,
    ...DEFAULT_PDF_SIGNATURE_TOGGLES,
  },
};

export default {
  name: "RaceSettingsModal",
  components: { Icon },
  props: {
    id: { type: String, default: "race-settings-modal" },
    value: { type: Boolean, default: false },
    settings: { type: Object, default: () => ({ ...DEFAULT_SETTINGS }) },
    minGate: { type: Number, default: 8 },
    maxGate: { type: Number, default: 14 },
    // Minimal 2 Section — Total Section HARUS ditentukan dulu di sini
    // sebelum daftar Pilihan Pen. Section di bawahnya bisa diisi dgn benar
    // (tim butuh minimal 2 section supaya konsep "per-section" berarti apa2).
    minSection: { type: Number, default: 2 },
    maxSection: { type: Number, default: 6 },
    minTeamsPerHeat: { type: Number, default: 3 },
    maxTeamsPerHeat: { type: Number, default: 8 },
    maxSprintPenalties: { type: Number, default: 8 },
    maxSprintScoreRows: { type: Number, default: 64 },
    eventId: { type: String, default: "" },
    eventName: { type: String, default: "" },
  },
  data() {
    return {
      localShow: this.value,
      loading: false,
      saving: false, // <-- untuk disable tombol Update
      // gambar dekoratif header panel (lihat komentar di import-nya)
      sprintBannerImg,
      h2hBannerImg,
      slalomBannerImg,
      drrBannerImg,
      rxBannerImg,
      draft: this.mergeWithDefaults(this.settings),
      // null = belum dimuat/gagal dimuat -> fail-open (tampilkan semua
      // kategori) supaya kegagalan fetch tidak diam-diam menyembunyikan
      // konfigurasi yang valid. Set berisi key kategori (SPRINT/HEAD2HEAD/
      // SLALOM/DRR/RX) kalau berhasil dimuat.
      enabledCategoryKeys: null,
      // per-kategori: true = konten config-nya sedang disembunyikan
      // (chevron kanan), false = terbuka (chevron bawah). Default SEMUA
      // true (tersembunyi), sama seperti Judges Configuration.
      collapsedSections: {
        sprint: true,
        h2h: true,
        slalom: true,
        drr: true,
        rx: true,
      },
    };
  },
  computed: {
    showSprint() {
      return !this.enabledCategoryKeys || this.enabledCategoryKeys.has("SPRINT");
    },
    showH2H() {
      return !this.enabledCategoryKeys || this.enabledCategoryKeys.has("HEAD2HEAD");
    },
    showSlalom() {
      return !this.enabledCategoryKeys || this.enabledCategoryKeys.has("SLALOM");
    },
    showDrr() {
      return !this.enabledCategoryKeys || this.enabledCategoryKeys.has("DRR");
    },
    showRx() {
      return !this.enabledCategoryKeys || this.enabledCategoryKeys.has("RX");
    },
    h2hPenaltyGroups() {
      return [
        { key: "startPenalties", title: "Pilihan Pen. Start (PS)" },
        { key: "cutLinePenalties", title: "Pilihan Cut Line (CL)" },
        { key: "finishPenalties", title: "Pilihan Pen. Finish (PF)" },
      ];
    },
    slalomPenaltyGroups() {
      return [
        { key: "startPenalties", title: "Pilihan Pen. Start (PS)" },
        { key: "finishPenalties", title: "Pilihan Pen. Finish (PF)" },
        { key: "gatePenalties", title: "Pilihan Pen. Gates (PG)" },
      ];
    },
    drrPenaltyGroups() {
      return [
        { key: "startPenalties", title: "Pilihan Pen. Start (PS)" },
        { key: "finishPenalties", title: "Pilihan Pen. Finish (PF)" },
        { key: "sectionPenalties", title: "Pilihan Pen. Section" },
      ];
    },
    rxPenaltyGroups() {
      return [
        { key: "gate1Penalties", title: "Pilihan Pen. Gate 1 (G1)" },
        { key: "gate2Penalties", title: "Pilihan Pen. Gate 2 (G2)" },
      ];
    },
  },
  watch: {
    value(v) {
      this.localShow = v;
      if (v) {
        this.loading = true;
        this.fetchSettingsIPC();
        this.fetchEnabledCategories();
      }
    },
    localShow(v) {
      this.$emit("input", v);
    },
    settings: {
      deep: true,
      handler(newVal) {
        if (!this.localShow) {
          this.draft = this.mergeWithDefaults(newVal);
        }
      },
    },
    "draft.rx.teamsPerHeat"(v) {
      // qualifiers per heat harus selalu < teams per heat; clamp langsung
      // (bukan cuma pas confirm()) supaya tampilan spinbutton tidak pernah
      // menunjukkan nilai yang sudah melebihi batas max-nya sendiri.
      const max = Number(v) - 1;
      if (this.draft.rx.qualifiersPerHeat > max) {
        this.draft.rx.qualifiersPerHeat = Math.max(1, max);
      }
    },
  },
  mounted() {
    if (this.eventId) {
      this.fetchSettingsIPC();
      this.fetchEnabledCategories();
    }
  },
  methods: {
    toggleSection(key) {
      this.$set(this.collapsedSections, key, !this.collapsedSections[key]);
    },
    async fetchEnabledCategories() {
      this.enabledCategoryKeys = await loadEnabledCategoryKeys(this.eventId);
    },
    _clone(obj) {
      try {
        return JSON.parse(JSON.stringify(obj || {}));
      } catch {
        return this.mergeWithDefaults({});
      }
    },

    mergeWithDefaults(incoming) {
      const src = incoming && typeof incoming === "object" ? incoming : {};
      const toInt = (v, fb) => {
        const n = parseInt(v, 10);
        return Number.isFinite(n) ? n : fb;
      };
      // allowNegative: KHUSUS Pilihan Pen. Section DRR — section boleh
      // punya nilai minus (mis. -10) sbg bonus/pengurang waktu, beda dari
      // penalty kategori lain yg selalu >= 0.
      const cleanList = (raw, fallback, allowNegative) => {
        const arr = Array.isArray(raw) ? raw : fallback;
        const min = allowNegative ? -600 : 0;
        const clean = arr.slice(0, this.maxSprintPenalties).map((p) => ({
          label: String((p && p.label) || "").slice(0, 40) || "0",
          value: Math.max(min, Math.min(600, toInt(p && p.value, 0))),
        }));
        return clean.length > 0 ? clean : fallback.map((p) => ({ ...p }));
      };

      const cleanScoreList = (raw, fallback) => {
        const arr =
          Array.isArray(raw) && raw.length > 0 ? raw : fallback;
        const clean = arr
          .slice(0, this.maxSprintScoreRows)
          .map((p, idx) => ({
            ranking: idx + 1,
            score: Math.max(0, Math.min(1000, toInt(p && p.score, 0))),
          }));
        return clean.length > 0 ? clean : fallback.map((p) => ({ ...p }));
      };

      // Default TAMPIL (true) kalau belum pernah diatur sama sekali —
      // dibedakan dari "eksplisit dimatikan" (false) via `undefined` check,
      // BUKAN `!!raw` (yg bakal salah paksa jadi false pas raw belum ada).
      const boolOrDefault = (raw, fallback) =>
        raw === undefined || raw === null ? fallback : !!raw;
      const signatureToggles = (catSrc) => ({
        showTechnicalDelegate: boolOrDefault(
          catSrc && catSrc.showTechnicalDelegate,
          true
        ),
        showChiefJudge: boolOrDefault(catSrc && catSrc.showChiefJudge, true),
        showRaceDirector: boolOrDefault(
          catSrc && catSrc.showRaceDirector,
          true
        ),
      });

      return {
        sprint: {
          startPenalties: cleanList(
            src.sprint && src.sprint.startPenalties,
            DEFAULT_START_PENALTIES
          ),
          finishPenalties: cleanList(
            src.sprint && src.sprint.finishPenalties,
            DEFAULT_FINISH_PENALTIES
          ),
          scoreByRank: cleanScoreList(
            src.sprint && src.sprint.scoreByRank,
            DEFAULT_SPRINT_SCORE_BY_RANK
          ),
          defaultScoreBeyondRank: Math.max(
            0,
            Math.min(
              1000,
              toInt(src.sprint && src.sprint.defaultScoreBeyondRank, 0)
            )
          ),
          ...signatureToggles(src.sprint),
        },
        h2h: {
          R1: !!(src.h2h && src.h2h.R1),
          R2: !!(src.h2h && src.h2h.R2),
          L1: !!(src.h2h && src.h2h.L1),
          L2: !!(src.h2h && src.h2h.L2),
          startPenalties: cleanList(
            src.h2h && src.h2h.startPenalties,
            DEFAULT_H2H_PENALTIES
          ),
          cutLinePenalties: cleanList(
            src.h2h && src.h2h.cutLinePenalties,
            DEFAULT_H2H_PENALTIES
          ),
          finishPenalties: cleanList(
            src.h2h && src.h2h.finishPenalties,
            DEFAULT_H2H_PENALTIES
          ),
          scoreByRank: cleanScoreList(
            src.h2h && src.h2h.scoreByRank,
            DEFAULT_H2H_SCORE_BY_RANK
          ),
          defaultScoreBeyondRank: Math.max(
            0,
            Math.min(
              1000,
              toInt(src.h2h && src.h2h.defaultScoreBeyondRank, 0)
            )
          ),
          ...signatureToggles(src.h2h),
        },
        slalom: {
          totalGate: toInt(src.slalom && src.slalom.totalGate, 14),
          startPenalties: cleanList(
            src.slalom && src.slalom.startPenalties,
            DEFAULT_SLALOM_START_PENALTIES
          ),
          finishPenalties: cleanList(
            src.slalom && src.slalom.finishPenalties,
            DEFAULT_SLALOM_FINISH_PENALTIES
          ),
          gatePenalties: cleanList(
            src.slalom && src.slalom.gatePenalties,
            DEFAULT_SLALOM_GATE_PENALTIES
          ),
          scoreByRank: cleanScoreList(
            src.slalom && src.slalom.scoreByRank,
            DEFAULT_SLALOM_SCORE_BY_RANK
          ),
          defaultScoreBeyondRank: Math.max(
            0,
            Math.min(
              1000,
              toInt(src.slalom && src.slalom.defaultScoreBeyondRank, 0)
            )
          ),
          ...signatureToggles(src.slalom),
        },
        drr: {
          totalSection: toInt(src.drr && src.drr.totalSection, 5),
          startPenalties: cleanList(
            src.drr && src.drr.startPenalties,
            DEFAULT_DRR_START_PENALTIES
          ),
          finishPenalties: cleanList(
            src.drr && src.drr.finishPenalties,
            DEFAULT_DRR_FINISH_PENALTIES
          ),
          sectionPenalties: cleanList(
            src.drr && src.drr.sectionPenalties,
            DEFAULT_DRR_SECTION_PENALTIES,
            true
          ),
          scoreByRank: cleanScoreList(
            src.drr && src.drr.scoreByRank,
            DEFAULT_DRR_SCORE_BY_RANK
          ),
          defaultScoreBeyondRank: Math.max(
            0,
            Math.min(
              1000,
              toInt(src.drr && src.drr.defaultScoreBeyondRank, 0)
            )
          ),
          ...signatureToggles(src.drr),
        },
        rx: (() => {
          const teamsPerHeat = Math.max(
            this.minTeamsPerHeat,
            Math.min(
              this.maxTeamsPerHeat,
              toInt(src.rx && src.rx.teamsPerHeat, 4)
            )
          );
          const qualifiersPerHeat = Math.max(
            1,
            Math.min(
              teamsPerHeat - 1,
              toInt(src.rx && src.rx.qualifiersPerHeat, 2)
            )
          );
          const gate1Enabled =
            src.rx && src.rx.gate1 && src.rx.gate1.enabled !== undefined
              ? !!src.rx.gate1.enabled
              : true;
          const gate2Enabled =
            src.rx && src.rx.gate2 && src.rx.gate2.enabled !== undefined
              ? !!src.rx.gate2.enabled
              : true;
          return {
            teamsPerHeat,
            qualifiersPerHeat,
            gate1: { enabled: gate1Enabled },
            gate2: { enabled: gate2Enabled },
            gate1Penalties: cleanList(
              src.rx && src.rx.gate1Penalties,
              DEFAULT_RX_GATE1_PENALTIES
            ),
            gate2Penalties: cleanList(
              src.rx && src.rx.gate2Penalties,
              DEFAULT_RX_GATE2_PENALTIES
            ),
            scoreByRank: cleanScoreList(
              src.rx && src.rx.scoreByRank,
              DEFAULT_RX_SCORE_BY_RANK
            ),
            defaultScoreBeyondRank: Math.max(
              0,
              Math.min(
                1000,
                toInt(src.rx && src.rx.defaultScoreBeyondRank, 0)
              )
            ),
            ...signatureToggles(src.rx),
          };
        })(),
      };
    },

    async fetchSettingsIPC() {
      try {
        if (typeof ipcRenderer === "undefined" || !this.eventId) {
          this.loading = false;
          return;
        }
        const token = Date.now();
        this._lastFetchToken = token;

        ipcRenderer.send("race-settings:get", this.eventId);
        ipcRenderer.once("race-settings:get-reply", (_e, res) => {
          if (this._lastFetchToken !== token) return; // abaikan balasan lama
          if (res && res.ok && res.settings) {
            this.draft = this.mergeWithDefaults(res.settings);
          } else {
            this.draft = this.mergeWithDefaults({});
          }
          this.loading = false;
        });
      } catch (err) {
        this.draft = this.mergeWithDefaults({});
        this.loading = false;
      }
    },

    close() {
      if (this.saving) return; // hindari menutup saat sedang simpan
      this.localShow = false;
    },

    // scope: "sprint" | "h2h" — generik supaya editor list Label+Detik tidak
    // perlu diduplikasi per kategori.
    addPenaltyRow(scope, listKey) {
      const list = this.draft[scope] && this.draft[scope][listKey];
      if (!list || list.length >= this.maxSprintPenalties) return;
      list.push({ label: "", value: 0 });
    },

    removePenaltyRow(scope, listKey, idx) {
      const list = this.draft[scope] && this.draft[scope][listKey];
      if (!list || list.length <= 1) return;
      list.splice(idx, 1);
    },

    // Rank di list "Score by Rank" selalu berurutan 1..N mengikuti posisi
    // baris (bukan input bebas) — supaya tidak ada rank ganda/bolong.
    // scope: "sprint" | "h2h" — generik supaya editor Score by Rank tidak
    // perlu diduplikasi per kategori (sama pola dgn addPenaltyRow()).
    addScoreRow(scope) {
      const list = this.draft[scope] && this.draft[scope].scoreByRank;
      if (!list || list.length >= this.maxSprintScoreRows) return;
      const last = list[list.length - 1];
      list.push({ ranking: list.length + 1, score: last ? last.score : 0 });
    },

    removeScoreRow(scope, idx) {
      const list = this.draft[scope] && this.draft[scope].scoreByRank;
      if (!list || list.length <= 1) return;
      list.splice(idx, 1);
      list.forEach((p, i) => (p.ranking = i + 1));
    },

    confirm() {
      if (!this.eventId) {
        return;
      }

      // 1) Clamp nilai lokal
      // allowNegative: KHUSUS Pilihan Pen. Section DRR (lihat cleanList() di
      // mergeWithDefaults() utk alasan yg sama).
      const cleanPenaltyList = (list, allowNegative) =>
        (list || []).map((p) => {
          const min = allowNegative ? -600 : 0;
          const value = Math.max(min, Math.min(600, parseInt(p.value, 10) || 0));
          const label = String(p.label || "").trim() || String(value);
          return { label, value };
        });
      this.draft.sprint.startPenalties = cleanPenaltyList(
        this.draft.sprint.startPenalties
      );
      this.draft.sprint.finishPenalties = cleanPenaltyList(
        this.draft.sprint.finishPenalties
      );
      this.draft.h2h.startPenalties = cleanPenaltyList(
        this.draft.h2h.startPenalties
      );
      this.draft.h2h.cutLinePenalties = cleanPenaltyList(
        this.draft.h2h.cutLinePenalties
      );
      this.draft.h2h.finishPenalties = cleanPenaltyList(
        this.draft.h2h.finishPenalties
      );
      this.draft.slalom.startPenalties = cleanPenaltyList(
        this.draft.slalom.startPenalties
      );
      this.draft.slalom.finishPenalties = cleanPenaltyList(
        this.draft.slalom.finishPenalties
      );
      this.draft.slalom.gatePenalties = cleanPenaltyList(
        this.draft.slalom.gatePenalties
      );
      this.draft.drr.startPenalties = cleanPenaltyList(
        this.draft.drr.startPenalties
      );
      this.draft.drr.finishPenalties = cleanPenaltyList(
        this.draft.drr.finishPenalties
      );
      this.draft.drr.sectionPenalties = cleanPenaltyList(
        this.draft.drr.sectionPenalties,
        true
      );
      this.draft.rx.gate1Penalties = cleanPenaltyList(
        this.draft.rx.gate1Penalties
      );
      this.draft.rx.gate2Penalties = cleanPenaltyList(
        this.draft.rx.gate2Penalties
      );

      this.draft.sprint.scoreByRank = (this.draft.sprint.scoreByRank || []).map(
        (p, idx) => ({
          ranking: idx + 1,
          score: Math.max(0, Math.min(1000, parseInt(p.score, 10) || 0)),
        })
      );
      this.draft.sprint.defaultScoreBeyondRank = Math.max(
        0,
        Math.min(1000, parseInt(this.draft.sprint.defaultScoreBeyondRank, 10) || 0)
      );

      this.draft.h2h.scoreByRank = (this.draft.h2h.scoreByRank || []).map(
        (p, idx) => ({
          ranking: idx + 1,
          score: Math.max(0, Math.min(1000, parseInt(p.score, 10) || 0)),
        })
      );
      this.draft.h2h.defaultScoreBeyondRank = Math.max(
        0,
        Math.min(1000, parseInt(this.draft.h2h.defaultScoreBeyondRank, 10) || 0)
      );

      const cleanScoreByRank = (list) =>
        (list || []).map((p, idx) => ({
          ranking: idx + 1,
          score: Math.max(0, Math.min(1000, parseInt(p.score, 10) || 0)),
        }));
      const cleanBeyondRank = (v) =>
        Math.max(0, Math.min(1000, parseInt(v, 10) || 0));

      this.draft.slalom.scoreByRank = cleanScoreByRank(
        this.draft.slalom.scoreByRank
      );
      this.draft.slalom.defaultScoreBeyondRank = cleanBeyondRank(
        this.draft.slalom.defaultScoreBeyondRank
      );
      this.draft.drr.scoreByRank = cleanScoreByRank(this.draft.drr.scoreByRank);
      this.draft.drr.defaultScoreBeyondRank = cleanBeyondRank(
        this.draft.drr.defaultScoreBeyondRank
      );
      this.draft.rx.scoreByRank = cleanScoreByRank(this.draft.rx.scoreByRank);
      this.draft.rx.defaultScoreBeyondRank = cleanBeyondRank(
        this.draft.rx.defaultScoreBeyondRank
      );

      const gRaw =
        this.draft && this.draft.slalom && this.draft.slalom.totalGate;
      const sRaw = this.draft && this.draft.drr && this.draft.drr.totalSection;
      const g = Number.isFinite(parseInt(gRaw, 10)) ? parseInt(gRaw, 10) : 14;
      const s = Number.isFinite(parseInt(sRaw, 10)) ? parseInt(sRaw, 10) : 5;

      // Clamp dengan minGate & maxGate
      this.draft.slalom.totalGate = Math.max(
        this.minGate,
        Math.min(this.maxGate, g)
      );

      this.draft.drr.totalSection = Math.max(
        this.minSection,
        Math.min(this.maxSection, s)
      );

      const tRaw = this.draft && this.draft.rx && this.draft.rx.teamsPerHeat;
      const t = Number.isFinite(parseInt(tRaw, 10)) ? parseInt(tRaw, 10) : 4;
      this.draft.rx.teamsPerHeat = Math.max(
        this.minTeamsPerHeat,
        Math.min(this.maxTeamsPerHeat, t)
      );

      const qRaw =
        this.draft && this.draft.rx && this.draft.rx.qualifiersPerHeat;
      const q = Number.isFinite(parseInt(qRaw, 10)) ? parseInt(qRaw, 10) : 2;
      this.draft.rx.qualifiersPerHeat = Math.max(
        1,
        Math.min(this.draft.rx.teamsPerHeat - 1, q)
      );

      const payload = {
        eventId: String(this.eventId),
        eventName: String(this.eventName || ""),
        settings: this._clone(this.draft),
      };

      // 2) IPC upsert
      try {
        if (typeof ipcRenderer === "undefined") {
          return;
        }

        this.saving = true;

        ipcRenderer.send("race-settings:upsert", {
          eventId: payload.eventId,
          settings: payload.settings,
        });

        ipcRenderer.once("race-settings:upsert-reply", (_e, res) => {
          this.saving = false;

          if (res && res.ok) {
            // Sinkronkan draft dengan apa yg tersimpan di DB
            const saved = res.settings || payload.settings;
            this.draft = this.mergeWithDefaults(saved);

            // 3) Emit ke parent supaya state induk ikut ter-update
            this.$emit("update-settings", {
              eventId: payload.eventId,
              eventName: payload.eventName,
              settings: saved,
            });

            // (opsional) toast sukses
            this.$bvToast &&
              this.$bvToast.toast("Race settings updated", {
                title: "Success",
                variant: "success",
                solid: true,
              });

            // 4) Tutup modal
            this.localShow = false;
          } else {
            const errMsg = res && res.error ? res.error : "Unknown error";
            this.$bvToast &&
              this.$bvToast.toast(errMsg, {
                title: "Update Failed",
                variant: "danger",
                solid: true,
              });
          }
        });
      } catch (err) {
        this.saving = false;
      }
    },
  },
};
</script>

<style>
/* Konten modal (kena karena global) */
.rounded-20 {
  border-radius: 20px;
}

.rs-divider {
  border: none;
  border-top: 1px dashed #d9dee6;
  margin: 4px 0 16px;
}


/* Batasi tinggi modal & jadikan layout fleksibel supaya bisa discroll saat
   konten (mis. banyak list penalty) melebihi tinggi layar.
   PENTING: pakai !important — BootstrapVue's `centered` + `scrollable`
   sekaligus menghasilkan class `.modal-dialog-centered.modal-dialog-
   scrollable .modal-content { max-height: none }` yang spesifisitasnya
   (3 class) lebih tinggi dari .rs-modal (1 class), jadi tanpa !important
   batas tinggi ini akan selalu kalah/tidak berpengaruh. */
.rs-modal {
  display: flex;
  flex-direction: column;
  max-height: 65vh !important;
  overflow: hidden;
}

.rs-modal .modal-header {
  position: sticky;
  top: 0;
  z-index: 3;
  background: #fff;
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.06);
}

.rs-modal .modal-body {
  overflow: auto;
}

/* Header tiap card kategori — klik utk expand/collapse config-nya. Teks di
   kiri (rs-header-text), gambar dekoratif khas kategori di kanan
   (rs-section-banner) supaya lebih immersive.
   BUG FIX: dulu pakai nama class .rs-section-title/.rs-section-toggle yg
   SAMA PERSIS dgn class GLOBAL (unscoped) yg sudah didefinisikan di
   JudgesSettings.vue (<style> tanpa `scoped`, jadi bocor ke seluruh app) —
   .rs-section-title global itu utk heading terpisah (font-size:20px,
   margin-bottom:12px), beda tujuan sama sekali dgn flex-wrapper icon+teks
   yg dimaksud di sini, jadi tabrakan gaya. .rs-header-row (bukan menimpa
   .rs-section-toggle) dipakai khusus utk layout kiri-kanan baru ini supaya
   tidak ikut collision itu. Gambarnya juga dulu pakai background-image +
   background-size:cover di kotak pendek-lebar (220x44, rasio 5:1) — PNG-nya
   sendiri hampir persegi (111x110 dst), jadi cover men-crop habis sebagian
   besar ilustrasinya (nyaris tak kelihatan). Sekarang pakai <img> +
   object-fit:contain supaya proporsi asli gambar tetap utuh, tidak
   ke-crop, tinggal discale ke tinggi header. */
.rs-header-row {
  justify-content: space-between;
  gap: 12px;
  overflow: hidden;
  border-radius: 10px;
}
.rs-header-row:hover .rs-header-text {
  color: #1c4c7a;
}
.rs-header-text {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  margin-bottom: 0;
}
.rs-section-banner {
  flex: 0 0 auto;
  height: 48px;
  width: auto;
  max-width: 140px;
  object-fit: contain;
  object-position: right center;
}

/* Tombol close bulat merah */
.btn-close-red {
  background: #ffe5e5;
  border: none;
  color: #c62828;
  font-weight: bold;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.btn-close-red:hover {
  background: #f8d7da;
  color: #b71c1c;
}

.rs-switch {
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  margin-right: 12px;
}

.rs-switch .custom-control-label {
  cursor: pointer;
}

/* base */
.btn.btn-confirm {
  background: #f0f8ff;
  color: #325a8f;
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 14px;
  transition: all 0.25s ease;
  border: 1px solid #cfd8e6;
}

/* hover */
.btn.btn-confirm:hover {
  background: #325a8f;
  color: #ffffff;
  border-color: #325a8f;
  box-shadow: 0 0 12px rgba(0, 180, 255, 0.5);
  cursor: pointer;
}

/* active (klik/tahan) */
.btn.btn-confirm:active,
.btn.btn-confirm:focus {
  background: #0d789d;
  color: #ffffff;
  border-color: #0d789d;
}
</style>
