const { ipcMain, dialog, app, shell } = require("electron");
const { EJSON } = require("bson");
const path = require("path");
const fs = require("fs");

// === Cloudinary config (hanya di file ini) ===
require("dotenv").config();
const cloudinary = require("cloudinary").v2;

const {
  upsertBracket,
  getBracket,
  upsertRoundRows,
  upsertAllRounds,
  upsertOverall,
  getOverall,
  getAllResults,
} = require("../controllers/INSERT/upsertHeadToHead.js");

const {
  upsertBracket: rxUpsertBracket,
  getBracket: rxGetBracket,
  upsertHeatRows: rxUpsertHeatRows,
  upsertAllRounds: rxUpsertAllRounds,
  upsertOverall: rxUpsertOverall,
  getOverall: rxGetOverall,
  getBracketsByEventId: rxGetBracketsByEventId,
  getOverallsByEventId: rxGetOverallsByEventId,
} = require("../controllers/INSERT/upsertRaftingCross.js");

const {
  getAllEvents,
  getEventById,
} = require("../controllers/GET/getEvent.js");

const {
  getRegistered,
  getRegisteredH2H,
  getRegisteredSprint,
  getRegisteredSlalom,
  getRegisteredRX,
} = require("../controllers/GET/getRegistered.js");

const {
  getOptionLevel,
  getOptionCategoriesEvent,
  getOptionCategoriesDivision,
  getOptionCategoriesInitial,
  getOptionCategoriesRace,
  getOptionPenalties,
  getOptionRanked,
} = require("../controllers/GET/getOptionEvent.js");

const {
  insertNewEvent,
  updateEventPoster,
  updateBasic,
  updateAssets,
  setResultsStatus,
  setEventStatus,
} = require("../controllers/INSERT/insertNewEvent.js");

const {
  insertSprintResult,
  insertSlalomResult,
  insertDrrResult,
} = require("../controllers/INSERT/insertResultEventByCategories.js");

const {
  upsertEventResultsDoc,
  getEventResultsAggregate,
  getEventResultsByEventId,
} = require("../controllers/INSERT/insertResultOverall.js");

const {
  getTeamsRegistered,
  deleteTeamInBucket,
  upsertTeamsRegistered,
  findRegisteredEntriesByTeamName,
  findRegisteredBucketsByEventId,
  findRegisteredTeamsDetailByEvent,
} = require("../controllers/INSERT/insertTeamsRegistered.js");

const {
  insertNewTeam,
  insertManyTeams,
  getAllTeams,
  deleteTeamById,
  updateTeamById,
  getOptionTeamTypes,
} = require("../controllers/INSERT/insertTeams");

const {
  upsertManyUserJudgeAssignments,
  listUserJudgeAssignmentsByEvent,
  getUserJudgeAssignmentByEmail,
} = require("../controllers/INSERT/insertJudgeAssignments");

const {
  getSprintResult,
  getDrrResult,
  getSlalomResult,
  getRaceCategoryResultForTeam,
} = require("../controllers/GET/getResult.js");

const {
  getRaceSettingsByEventId,
} = require("../controllers/GET/getRaceSettings");

const {
  upsertRaceSettingsByEventId,
} = require("../controllers/UPDATE/editRaceSettings");

const {
  notifyTeamStarted,
  notifyH2HRoundActive,
  notifySlalomTeamStarted,
  notifyOfficialStatusChanged,
  notifySprintTeamFinished,
} = require("../controllers/socketBroadcast");
const {
  insertH2HFoulsReport,
  listH2HFoulsReports,
} = require("../controllers/INSERT/insertH2HFoulsReport");
const {
  insertFieldNotesReport,
  listFieldNotesReports,
} = require("../controllers/INSERT/insertFieldNotesReport");
const {
  upsertSprintTeamStatus,
} = require("../controllers/INSERT/upsertSprintTeamStatus");
const {
  upsertSlalomTeamStatus,
} = require("../controllers/INSERT/upsertSlalomTeamStatus");
const {
  upsertDRRTeamStatus,
} = require("../controllers/INSERT/upsertDRRTeamStatus");
const {
  upsertH2HActiveRound,
} = require("../controllers/INSERT/upsertH2HActiveRound");
const { getAllUsers } = require("../controllers/GET/getAllUsers");
const { updateUser } = require("../controllers/UPDATE/editUser");
const { deleteUser } = require("../controllers/DELETE/deleteUser");
const { deleteEventById } = require("../controllers/DELETE/deleteByIdEvent");
const {
  resetEventData,
  deleteOneCollectionForEvent,
  RESET_COLLECTIONS,
} = require("../controllers/DELETE/resetEventData");
const { resetH2HDataForEvent } = require("../controllers/DELETE/resetH2HData");
const { resetSlalomDataForEvent } = require("../controllers/DELETE/resetSlalomData");
const { resetDrrDataForEvent } = require("../controllers/DELETE/resetDrrData");
const {
  insertChatMessage,
  listChatMessagesByEvent,
  deleteChatMessage,
} = require("../controllers/INSERT/insertChatMessage");
const {
  insertJudgeActionLog,
  listJudgeActionLogsByEvent,
} = require("../controllers/INSERT/insertJudgeActionLog");
const {
  deleteJudgeActionHistory,
} = require("../controllers/DELETE/deleteJudgeActionHistory");
const {
  deleteJudgeReportsForRow,
} = require("../controllers/DELETE/deleteJudgeReportsForRow");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function assertCloudinaryConfig() {
  const cfg = cloudinary.config();
  if (!cfg.cloud_name) throw new Error("Cloudinary cloud_name missing");
  if (!cfg.api_key) throw new Error("Cloudinary api_key missing");
  if (!cfg.api_secret) throw new Error("Cloudinary api_secret missing");
}

// communication with database
function setupIPCMainHandlers() {
  // Get all users
  ipcMain.on("users:getAll", async (event) => {
    try {
      const users = await getAllUsers();
      const normalized = users.map((u) => ({
        ...u,
        _id: String(u._id),
      }));
      event.reply("users:getAll:reply", { ok: true, users: normalized });
    } catch (err) {
      event.reply("users:getAll:reply", { ok: false, error: err.message });
    }
  });

  // Update user
  ipcMain.on("users:update", async (event, { userId, payload }) => {
    try {
      const updated = await updateUser(userId, payload);
      event.reply("users:update:reply", { ok: true, user: updated });
    } catch (err) {
      event.reply("users:update:reply", { ok: false, error: err.message });
    }
  });

  // Delete user
  ipcMain.on("users:delete", async (event, payload) => {
    try {
      const email = payload && payload.email;
      if (!email || typeof email !== "string") {
        throw new Error("Invalid email");
      }
      const result = await deleteUser(email.trim());
      event.reply("users:delete:reply", { ok: true, result });
    } catch (err) {
      event.reply("users:delete:reply", {
        ok: false,
        error: err.message,
      });
    }
  });

  // Chat: hapus (soft-delete) pesan milik sendiri
  ipcMain.on("chat:delete", async (event, payload) => {
    try {
      const id = payload && payload.id;
      const senderEmail = payload && payload.senderEmail;
      const result = await deleteChatMessage(id, senderEmail);
      event.reply("chat:delete:reply", result);
    } catch (err) {
      event.reply("chat:delete:reply", { ok: false, error: err.message });
    }
  });

  // Chat: send a message (event-scoped group chat)
  ipcMain.on("chat:send", async (event, payload) => {
    try {
      const message = await insertChatMessage(payload);
      event.reply("chat:send:reply", { ok: true, message });
    } catch (err) {
      event.reply("chat:send:reply", { ok: false, error: err.message });
    }
  });

  // Chat: list history for an event + category (Race Category room) —
  // dipakai untuk initial load & poll ringan (selalu ambil batch TERBARU).
  ipcMain.on("chat:listByEvent", async (event, payload) => {
    try {
      const eventId = payload && payload.eventId ? payload.eventId : payload;
      const category = payload && payload.category ? payload.category : "";
      const limit = payload && payload.limit;
      const { items, hasMore } = await listChatMessagesByEvent(eventId, category, { limit });
      event.reply("chat:listByEvent:reply", { ok: true, messages: items, hasMore });
    } catch (err) {
      event.reply("chat:listByEvent:reply", { ok: false, error: err.message });
    }
  });

  // Chat: load pesan LEBIH LAMA (infinite-scroll ke atas) — channel balasan
  // sengaja terpisah dari "chat:listByEvent:reply" supaya tidak rebutan
  // listener dengan initial-load/poll yang bisa jalan bersamaan.
  ipcMain.on("chat:listOlder", async (event, payload) => {
    try {
      const eventId = payload && payload.eventId;
      const category = payload && payload.category;
      const before = payload && payload.before;
      const limit = payload && payload.limit;
      const { items, hasMore } = await listChatMessagesByEvent(eventId, category, {
        before,
        limit,
      });
      event.reply("chat:listOlder:reply", { ok: true, messages: items, hasMore });
    } catch (err) {
      event.reply("chat:listOlder:reply", { ok: false, error: err.message });
    }
  });

  // Chat: dedicated event-info fetch (own reply channel — the widget is
  // mounted persistently across every event page, so it must NOT share a
  // reply channel with page components like Details/index.vue that also
  // call get-events-byid, or removeAllListeners on either side can wipe out
  // the other's pending listener)
  ipcMain.on("chat:get-event", async (event, eventId) => {
    try {
      const data = await getEventById(eventId);
      event.reply("chat:get-event-reply", data);
    } catch (err) {
      event.reply("chat:get-event-reply", null);
    }
  });

  // Judge action log: audit trail dari penalty/tindakan judge yang diterima
  // via socket "custom:event" dari sts-jurysystem dan berhasil diterapkan
  // di masing-masing Race Category view (Sprint/Slalom/DRR/H2H/RX).
  ipcMain.on("judgeLog:send", async (event, payload) => {
    try {
      const log = await insertJudgeActionLog(payload);
      event.reply("judgeLog:send:reply", { ok: true, log });
    } catch (err) {
      event.reply("judgeLog:send:reply", { ok: false, error: err.message });
    }
  });

  ipcMain.on("judgeLog:listByEvent", async (event, payload) => {
    try {
      const { eventId, raceCategory, limit } = payload || {};
      const items = await listJudgeActionLogsByEvent(eventId, raceCategory, {
        limit,
      });
      event.reply("judgeLog:listByEvent:reply", { ok: true, items });
    } catch (err) {
      event.reply("judgeLog:listByEvent:reply", {
        ok: false,
        items: [],
        error: err.message,
      });
    }
  });

  // Hapus SELURUH "Riwayat Judge" (log lokal + riwayat penalty milik
  // sts-jurysystem, SEMUA juri) utk satu event + satu kategori race saja
  // — lihat catatan lengkap di deleteJudgeActionHistory.js.
  ipcMain.on("judgeLog:deleteHistory", async (event, payload) => {
    try {
      const { eventId, raceCategory } = payload || {};
      const result = await deleteJudgeActionHistory(eventId, raceCategory);
      event.reply("judgeLog:deleteHistory:reply", result);
    } catch (err) {
      event.reply("judgeLog:deleteHistory:reply", {
        ok: false,
        error: err.message,
      });
    }
  });

  // Hapus riwayat penalty juri + audit log lokal utk SATU baris/tim saja
  // (dipanggil dari tombol "Reset" per-row/heat/run) — lihat catatan
  // lengkap di deleteJudgeReportsForRow.js.
  ipcMain.on("judgeReports:deleteForRow", async (event, payload) => {
    try {
      const result = await deleteJudgeReportsForRow(payload);
      event.reply("judgeReports:deleteForRow:reply", result);
    } catch (err) {
      event.reply("judgeReports:deleteForRow:reply", {
        ok: false,
        error: err.message,
      });
    }
  });

  // GET DB
  ipcMain.on("get-alert", async (event, options) => {
    try {
      const defaultOptions = {
        type: "info",
        detail: "Default detail",
        message: "Default message",
        buttons: ["OK"],
      };

      const mergedOptions = { ...defaultOptions, ...options };
      dialog.showMessageBox(null, mergedOptions, (response) => {
        console.log("You clicked:", mergedOptions.buttons[response]);
      });
    } catch (error) {
      event.reply("get-events-reply", []);
    }
  });

  ipcMain.on("get-alert-saved", async (event, options) => {
    try {
      const defaultOptions = {
        type: "info",
        detail: "Default detail",
        message: "Default message",
      };

      // Menggabungkan default options dengan options yang diterima dari renderer
      const mergedOptions = { ...defaultOptions, ...options };
      dialog.showMessageBox(null, mergedOptions, (response) => {
        console.log("You clicked:", mergedOptions.buttons[response]);
      });
    } catch (error) {
      event.reply("get-question-reply", []);
    }
  });

  ipcMain.on("get-events", async (event) => {
    try {
      const data = await getAllEvents();
      const safe = (Array.isArray(data) ? data : []).map((d) => ({
        ...d,
        _id: d && d._id ? String(d._id) : "", // <-- stringify
      }));
      event.reply("get-events-reply", safe);
    } catch (error) {
      event.reply("get-events-reply", []);
    }
  });

  ipcMain.on("get-events-byid", async (event, datas) => {
    try {
      const data = await getEventById(datas);
      event.reply("get-events-byid-reply", data);
    } catch (error) {
      event.reply("get-events-byid-reply", []);
    }
  });

  ipcMain.on("delete-event", async (event, id) => {
    try {
      const ok = await deleteEventById(id);
      event.reply("delete-event-reply", { ok });
    } catch (error) {
      event.reply("delete-event-reply", {
        ok: false,
        error: error && error.message ? error.message : String(error),
      });
    }
  });

  // Toggle Active/Inactive event di All Events (lihat setEventStatus() di
  // insertNewEvent.js) — sebelumnya tidak ada jalur IPC utk ini sama sekali.
  ipcMain.on("event:set-status", async (event, payload) => {
    try {
      const eventId = payload && payload.eventId;
      const status = payload && payload.status;
      const resp = await setEventStatus(eventId, status);
      event.reply("event:set-status-reply", resp);
    } catch (error) {
      event.reply("event:set-status-reply", {
        ok: false,
        error: error && error.message ? error.message : String(error),
      });
    }
  });

  // "Reset Data": hapus semua hasil/kompetisi (Sprint/H2H/Slalom/DRR/RX)
  // milik satu event, tanpa menyentuh data tim terdaftar & pengaturan event.
  ipcMain.on("event:reset-data", async (event, eventId) => {
    try {
      const result = await resetEventData(eventId);
      event.reply("event:reset-data-reply", result);
    } catch (error) {
      event.reply("event:reset-data-reply", {
        ok: false,
        error: error && error.message ? error.message : String(error),
      });
    }
  });

  // daftar koleksi yang dihapus Reset Data — dipakai renderer utk
  // menampilkan progress bar bertahap (1 request per koleksi)
  ipcMain.on("event:reset-data:collections", (event) => {
    event.reply(
      "event:reset-data:collections-reply",
      RESET_COLLECTIONS.map((c) => ({ name: c.name, label: c.label }))
    );
  });

  // hapus SATU koleksi saja — dipanggil berkali-kali oleh renderer (satu per
  // koleksi) supaya progress reset bisa ditampilkan bertahap
  ipcMain.on("event:reset-data:step", async (event, { eventId, collection, __reqId } = {}) => {
    try {
      const result = await deleteOneCollectionForEvent(eventId, collection);
      event.reply("event:reset-data:step-reply", { ...result, __reqId });
    } catch (error) {
      event.reply("event:reset-data:step-reply", {
        ok: false,
        collection,
        __reqId,
        error: error && error.message ? error.message : String(error),
      });
    }
  });

  // "Reset All" di halaman Head to Head — hapus semua data kompetisi H2H
  // (seluruh kategori/bucket) utk satu event, tanpa menyentuh Sprint/
  // Slalom/DRR/RX di event yang sama.
  ipcMain.on("h2h:reset-all", async (event, eventId) => {
    try {
      const result = await resetH2HDataForEvent(eventId);
      event.reply("h2h:reset-all-reply", result);
    } catch (error) {
      event.reply("h2h:reset-all-reply", {
        ok: false,
        error: error && error.message ? error.message : String(error),
      });
    }
  });

  // "Reset All" di halaman Slalom Details — hapus semua waktu yang sudah
  // bertanding di Slalom (seluruh kategori/bucket) utk satu event, tanpa
  // menyentuh Sprint/H2H/DRR/RX di event yang sama.
  ipcMain.on("slalom:reset-all", async (event, eventId) => {
    try {
      const result = await resetSlalomDataForEvent(eventId);
      event.reply("slalom:reset-all-reply", result);
    } catch (error) {
      event.reply("slalom:reset-all-reply", {
        ok: false,
        error: error && error.message ? error.message : String(error),
      });
    }
  });

  // "Reset All" di halaman DRR Details — hapus semua waktu yang sudah
  // bertanding di DRR (seluruh kategori/bucket) utk satu event, tanpa
  // menyentuh Sprint/H2H/Slalom/RX di event yang sama.
  ipcMain.on("drr:reset-all", async (event, eventId) => {
    try {
      const result = await resetDrrDataForEvent(eventId);
      event.reply("drr:reset-all-reply", result);
    } catch (error) {
      event.reply("drr:reset-all-reply", {
        ok: false,
        error: error && error.message ? error.message : String(error),
      });
    }
  });

  // OPTION DB
  ipcMain.on("option-level", async (event) => {
    try {
      const data = await getOptionLevel();
      event.reply("option-level-reply", data);
    } catch (error) {
      event.reply("option-level-reply", []);
    }
  });

  ipcMain.on("option-categories-event", async (event) => {
    try {
      const data = await getOptionCategoriesEvent();
      event.reply("option-categories-event-reply", data);
    } catch (error) {
      event.reply("option-categories-event-reply", []);
    }
  });

  ipcMain.on("option-categories-division", async (event) => {
    try {
      const data = await getOptionCategoriesDivision();
      event.reply("option-categories-division-reply", data);
    } catch (error) {
      event.reply("option-categories-division-reply", []);
    }
  });

  ipcMain.on("option-categories-initial", async (event) => {
    try {
      const data = await getOptionCategoriesInitial();
      event.reply("option-categories-initial-reply", data);
    } catch (error) {
      event.reply("option-categories-initial-reply", []);
    }
  });

  ipcMain.on("option-categories-race", async (event) => {
    try {
      const data = await getOptionCategoriesRace();
      event.reply("option-categories-race-reply", data);
    } catch (error) {
      event.reply("option-categories-race-reply", []);
    }
  });

  ipcMain.on("option-penalties", async (event, type) => {
    try {
      const data = await getOptionPenalties(type);
      event.reply("option-penalties-reply", data);
    } catch (error) {
      event.reply("option-penalties-reply", []);
    }
  });

  ipcMain.on("option-ranked", async (event, type) => {
    try {
      const data = await getOptionRanked(type);
      event.reply("option-ranked-reply", data);
    } catch (error) {
      event.reply("option-ranked-reply", []);
    }
  });

  // INSERT DB
  ipcMain.on("insert-new-event", async (event, datas) => {
    try {
      const result = await insertNewEvent(datas);
      const serialized = EJSON.serialize(result);
      event.reply("insert-new-event-reply", serialized);
    } catch (error) {
      event.reply("insert-new-event-reply", []);
    }
  });

  ipcMain.on("update-event-poster", async function (evt, payload) {
    try {
      const r = await updateEventPoster(payload);

      var idToLog = "";
      if (payload !== null && payload !== undefined) {
        if (payload._id !== null && payload._id !== undefined) {
          idToLog = String(payload._id);
        }
      }

      evt.reply("update-event-poster-reply", r);
    } catch (err) {
      var msg = "Unknown error";
      if (err !== null && err !== undefined) {
        if (typeof err.message === "string") msg = err.message;
      }
      evt.reply("update-event-poster-reply", { ok: false, error: msg });
    }
  });

  ipcMain.on("services:update:event-basic", async (evt, payload) => {
    try {
      const resp = await updateBasic(payload);
      evt.reply("services:update:event-basic:reply", resp);
    } catch (e) {
      evt.reply("services:update:event-basic:reply", {
        ok: false,
        error: e && e.message ? e.message : String(e),
      });
    }
  });

  ipcMain.on("services:update:event-assets", async (evt, payload) => {
    try {
      const resp = await updateAssets(payload);
      evt.reply("services:update:event-assets:reply", resp);
    } catch (e) {
      evt.reply("services:update:event-assets:reply", {
        ok: false,
        error: e && e.message ? e.message : String(e),
      });
    }
  });

  ipcMain.on("event:set-official", async (evt, payload) => {
    try {
      const eventId = payload && payload.eventId;
      const category = payload && payload.category;
      // Status: "provisional" | "unofficial" | "official". Payload lama
      // hanya mengirim `value` (boolean) — dipetakan ke "official"/
      // "unofficial" demi kompatibilitas kalau ada caller lama yg belum
      // sempat di-update.
      let status = payload && payload.status;
      if (!status) {
        status = payload && payload.value ? "official" : "unofficial";
      }
      // Opsional — ISO string (sudah dikonversi dari WIB ke UTC di
      // renderer) kalau operator set waktu manual; kosong = otomatis
      // pakai waktu server saat ini (lihat setResultsStatus()).
      const timestamp = payload && payload.timestamp;
      const resp = await setResultsStatus(eventId, category, status, timestamp);
      // BUG FIX: sebelumnya toggle Official/Unofficial TIDAK PERNAH
      // broadcast apa pun ke sts-jurysystem — Live Result cuma bisa
      // "kebetulan" ikut update kalau ada aksi lain (mis. Save Result)
      // yang trigger fetchResults() bersamaan, atau menunggu poll 20
      // detik. Broadcast di sini supaya badge Provisional/Official/
      // Unofficial di Live Result berubah SEKETIKA, bukan menunggu.
      if (resp && resp.ok) {
        notifyOfficialStatusChanged({
          eventId,
          category,
          status,
          value: status === "official",
          setAt: resp.setAt || null,
        });
      }
      evt.reply("event:set-official-reply", resp);
    } catch (e) {
      evt.reply("event:set-official-reply", {
        ok: false,
        error: e && e.message ? e.message : String(e),
      });
    }
  });

  // SAVE SPRINT RESULT
  ipcMain.on("insert-sprint-result", async (event, datas) => {
    try {
      const result = await insertSprintResult(datas);
      event.reply("insert-sprint-result-reply", result);
    } catch (err) {
      event.reply("insert-sprint-result-reply", {
        ok: false,
        error: err.message || String(err),
      });
    }
  });

  // Broadcast LIVE (bukan tunggu "Save Result") begitu operator mengisi
  // Start Time satu baris Sprint — dipakai sts-jurysystem utk validasi
  // "team belum Start" sebelum juri boleh submit penalty. Fire-and-forget,
  // tidak ada reply karena kegagalan broadcast tidak boleh mengganggu
  // input operator yang sedang berjalan.
  ipcMain.on("sprint:team-started", (_event, payload) => {
    notifyTeamStarted(payload || {});
    // BUG FIX (2026-09-23): tulis LANGSUNG ke sprintteamstatuses (bukan
    // cuma broadcast socket) supaya flag "sudah Start" tetap tersimpan
    // walau tidak ada tab juri Sprint yang online saat ini. Lihat
    // upsertSprintTeamStatus.js.
    upsertSprintTeamStatus(payload || {}).catch((err) => {
      console.error("⚠️ [sprint:team-started] gagal upsert langsung:", err);
    });
  });

  // Broadcast LIVE PREVIEW begitu satu team Sprint genuinely selesai
  // (Start & Finish Time terisi) — dipakai sts-jurysystem utk
  // menampilkan Live Result yang benar-benar reaktif per-tim, tidak
  // menunggu "Save Result". Fire-and-forget, sama pola dgn
  // sprint:team-started.
  ipcMain.on("sprint:team-finished", (_event, payload) => {
    notifySprintTeamFinished(payload || {});
  });

  // Broadcast LIVE begitu operator H2H pindah/buka babak (round) lain —
  // dipakai sts-jurysystem utk label "babak aktif" + filter dropdown
  // Team. Fire-and-forget, sama pola dgn sprint:team-started di atas.
  ipcMain.on("h2h:round-active", (_event, payload) => {
    notifyH2HRoundActive(payload || {});
    // BUG FIX (2026-09-23): tulis LANGSUNG ke h2hactiverounds (bukan cuma
    // broadcast socket) supaya babak aktif/Heat tetap tersimpan walau
    // tidak ada tab juri H2H yang online saat ini. Lihat
    // upsertH2HActiveRound.js.
    upsertH2HActiveRound(payload || {}).catch((err) => {
      console.error("⚠️ [h2h:round-active] gagal upsert langsung:", err);
    });
  });

  // Broadcast LIVE begitu operator mengisi Start Time satu baris Slalom
  // (utk run tertentu) — dipakai sts-jurysystem utk validasi "team belum
  // Start di run ini" sebelum juri boleh submit penalty. Fire-and-forget,
  // sama pola dgn sprint:team-started.
  ipcMain.on("slalom:team-started", (_event, payload) => {
    notifySlalomTeamStarted(payload || {});
    // BUG FIX (2026-09-23): tulis LANGSUNG ke slalomteamstatuses (bukan
    // cuma broadcast socket) supaya flag "sudah Start" tetap tersimpan
    // walau tidak ada tab juri Slalom yang online saat ini. Lihat
    // upsertSlalomTeamStatus.js.
    upsertSlalomTeamStatus(payload || {}).catch((err) => {
      console.error("⚠️ [slalom:team-started] gagal upsert langsung:", err);
    });
  });

  // Flag "team sudah Start" DRR — dibangun LANGSUNG dgn direct-write ke
  // drrteamstatuses (bukan relay browser juri), lihat upsertDRRTeamStatus.js.
  ipcMain.on("drr:team-started", (_event, payload) => {
    upsertDRRTeamStatus(payload || {}).catch((err) => {
      console.error("⚠️ [drr:team-started] gagal upsert langsung:", err);
    });
  });

  // Simpan Fouls Report (murni informasi, TIDAK mengubah penalty resmi)
  // yang diterima HeadToHead.vue::receiveFoulsReport() dari juri.
  ipcMain.on("h2hFouls:send", async (event, payload) => {
    try {
      const log = await insertH2HFoulsReport(payload);
      event.reply("h2hFouls:send:reply", { ok: true, log });
    } catch (err) {
      event.reply("h2hFouls:send:reply", { ok: false, error: err.message });
    }
  });

  // List Fouls Report utk modal "Fouls Report" di toolbar H2H.
  ipcMain.on("h2hFouls:list", async (event, payload) => {
    try {
      const { eventId, divisionId, raceId, roundId, limit } = payload || {};
      const items = await listH2HFoulsReports(eventId, {
        divisionId,
        raceId,
        roundId,
        limit,
      });
      event.reply("h2hFouls:list:reply", { ok: true, items });
    } catch (err) {
      event.reply("h2hFouls:list:reply", {
        ok: false,
        items: [],
        error: err.message,
      });
    }
  });

  // Simpan Field Notes (versi ringan Fouls Report, tanpa Pen
  // Position/Detail) dari juri Sprint/Slalom/DRR/RX — MURNI informasi,
  // TIDAK mengubah penalty resmi. Lihat insertFieldNotesReport.js.
  ipcMain.on("fieldNotes:send", async (event, payload) => {
    try {
      const log = await insertFieldNotesReport(payload);
      event.reply("fieldNotes:send:reply", { ok: true, log });
    } catch (err) {
      event.reply("fieldNotes:send:reply", { ok: false, error: err.message });
    }
  });

  // List Field Notes utk modal "Field Notes" di toolbar masing-masing
  // race category (Sprint/Slalom/DRR/RX).
  ipcMain.on("fieldNotes:list", async (event, payload) => {
    try {
      const { eventId, category, divisionId, raceId, limit } = payload || {};
      const items = await listFieldNotesReports(eventId, category, {
        divisionId,
        raceId,
        limit,
      });
      event.reply("fieldNotes:list:reply", { ok: true, items });
    } catch (err) {
      event.reply("fieldNotes:list:reply", {
        ok: false,
        items: [],
        error: err.message,
      });
    }
  });

  // LOAD SPRINT RESULT
  ipcMain.on("get-sprint-result", async (event, query = {}) => {
    try {
      const data = await getSprintResult(query);
      event.reply("get-sprint-result-reply", { ok: true, items: data });
    } catch (error) {
      event.reply("get-sprint-result-reply", {
        ok: false,
        items: [],
        error: error.message,
      });
    }
  });

  // SAVE SLALOM RESULT
  ipcMain.on("insert-slalom-result", async (event, datas) => {
    try {
      const data = await insertSlalomResult(datas);
      event.reply("insert-slalom-result-reply", data);
    } catch (error) {
      event.reply("insert-slalom-result-reply", null);
    }
  });

  // LOAD SLALOM RESULT
  ipcMain.on("get-slalom-result", async (event, query = {}) => {
    // __reqId (kalau dikirim) digemakan balik supaya pemanggil yang butuh
    // mencocokkan balasan ke request-nya sendiri (mis. loadSlalomStatusForPanel()
    // di Details/index.vue) bisa pakai ipcRenderer.on()+cek __reqId — pemanggil
    // lama yang tidak mengirim __reqId tidak terpengaruh (field cuma echo).
    const reqId = query && query.__reqId;
    try {
      const data = await getSlalomResult(query);
      event.reply("get-slalom-result-reply", {
        ok: true,
        items: data,
        __reqId: reqId,
      });
    } catch (error) {
      event.reply("get-slalom-result-reply", {
        ok: false,
        items: [],
        error: error.message,
        __reqId: reqId,
      });
    }
  });

  // SAVE DRR RESULT
  ipcMain.on("insert-drr-result", async (event, datas) => {
    try {
      const data = await insertDrrResult(datas);
      event.reply("insert-drr-result-reply", data);
    } catch (error) {
      event.reply("insert-drr-result-reply", null);
    }
  });

  // LOAD DRR RESULT
  ipcMain.on("get-drr-result", async (event, query = {}) => {
    try {
      const data = await getDrrResult(query);
      event.reply("get-drr-result-reply", { ok: true, items: data });
    } catch (error) {
      event.reply("get-drr-result-reply", {
        ok: false,
        items: [],
        error: error.message,
      });
    }
  });

  // Timing detail mentah per-tim (Sprint/Slalom/DRR saja — H2H/RX belum ada
  // endpoint baca per-tim dari koleksi hasilnya)
  ipcMain.on("team-result-detail:get", async (event, identity) => {
    try {
      const team = await getRaceCategoryResultForTeam(identity || {});
      event.reply("team-result-detail:get-reply", { ok: true, team });
    } catch (error) {
      event.reply("team-result-detail:get-reply", {
        ok: false,
        team: null,
        error: error && error.message ? error.message : String(error),
      });
    }
  });

  // App version (buat modal "About") — app.getVersion() Electron otomatis
  // baca dari package.json "version", jadi tinggal bump versi di situ tiap
  // rilis, tidak perlu di-hardcode ulang di renderer.
  ipcMain.handle("app:get-version", async function () {
    return { ok: true, version: app.getVersion() };
  });

  // Buka link (website/email) dari modal "About" di browser/mail-client
  // default OS — dibatasi ke http(s)/mailto supaya tidak disalahgunakan
  // buka skema lain (file://, dll.) dari renderer.
  ipcMain.handle("app:open-external", async function (_e, url) {
    const safe = String(url || "");
    if (!/^(https?:|mailto:)/i.test(safe)) {
      return { ok: false, error: "URL tidak diizinkan" };
    }
    await shell.openExternal(safe);
    return { ok: true };
  });

  // ========================================================================
  // File picker & Cloudinary (TIDAK ADA optional chaining)
  // ========================================================================
  // (opsional) file picker untuk preload → window.fileAPI.pickImage()
  // Ambil isi PDF panduan pengisian bagan Head to Head sbg data URL, utk
  // ditampilkan inline (modal) di renderer — bukan dibuka di app eksternal
  ipcMain.handle("file:get-h2h-guide-pdf", async function () {
    const file = "BAGAN HEAD TO HEAD CLEAR.pdf";
    // Dev (electron:serve): electron dijalankan dgn cwd "dist_electron",
    // jadi app.getAppPath() = <project root>/dist_electron — PDF-nya ada
    // satu level di atas, di root project (tempat file sumber ini disimpan).
    const filePath = app.isPackaged
      ? path.join(process.resourcesPath, "docs", file)
      : path.join(app.getAppPath(), "..", file);

    if (!fs.existsSync(filePath)) {
      return { ok: false, error: "File panduan tidak ditemukan: " + filePath };
    }
    try {
      const buf = await fs.promises.readFile(filePath);
      return {
        ok: true,
        dataUrl: "data:application/pdf;base64," + buf.toString("base64"),
      };
    } catch (err) {
      return { ok: false, error: String((err && err.message) || err) };
    }
  });

  ipcMain.handle("file:pick-image", async function () {
    const r = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }],
    });
    if (r.canceled || !r.filePaths || r.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    return { ok: true, path: r.filePaths[0] };
  });

  // Upload ke Cloudinary
  ipcMain.handle("cloud:upload-image", async function (_e, absPath, options) {
    try {
      assertCloudinaryConfig();

      if (!absPath) throw new Error("Missing file path");
      if (!fs.existsSync(absPath)) throw new Error("File not found");

      var opts = options || {};
      const folder = opts.folder ? String(opts.folder) : "sustainable-js/event";
      const publicId = opts.publicId
        ? String(opts.publicId)
        : path.parse(absPath).name;

      const res = await cloudinary.uploader.upload(absPath, {
        folder: folder,
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
      });

      return {
        ok: true,
        result: {
          public_id: res.public_id,
          secure_url: res.secure_url,
          url: res.url,
          folder: res.folder,
          width: res.width,
          height: res.height,
          bytes: res.bytes,
          format: res.format,
          version: res.version,
          created_at: res.created_at,
        },
      };
    } catch (err) {
      return {
        ok: false,
        error: err && err.message ? err.message : String(err),
      };
    }
  });

  // Hapus di Cloudinary
  ipcMain.handle("cloud:delete-image", async function (_e, publicId) {
    try {
      if (!publicId) throw new Error("Missing public_id");
      const r = await cloudinary.uploader.destroy(String(publicId), {
        resource_type: "image",
      });
      return { ok: true, result: r };
    } catch (err) {
      return {
        ok: false,
        error: err && err.message ? err.message : String(err),
      };
    }
  });

  // ========================================================================
  // Teams Collection Function
  // ========================================================================
  // Opsi team types
  ipcMain.on("option-team-types", async (event) => {
    try {
      const items = await getOptionTeamTypes(); // optional; atau return hardcoded
      event.reply("option-team-types-reply", items);
    } catch (e) {
      event.reply("option-team-types-reply", [
        { value: "club", name: "Club" },
        { value: "pengcab", name: "Pengcab" },
        { value: "pengprov", name: "Pengprov" },
        { value: "wilayah", name: "Wilayah" },
        { value: "negara", name: "Negara" },
      ]);
    }
  });

  // Insert
  ipcMain.on("insert-new-team", async (event, doc) => {
    try {
      const result = await insertNewTeam(doc);
      event.reply("insert-new-team-reply", { ok: true, ...result });
    } catch (e) {
      event.reply("insert-new-team-reply", {
        ok: false,
        error: String((e && e.message) || e),
      });
    }
  });

  // Bulk Insert (fitur "Import from Excel" di Create New Team)
  ipcMain.on("teams:bulk-insert", async (event, docs) => {
    try {
      const result = await insertManyTeams(docs);
      event.reply("teams:bulk-insert-reply", { ok: true, ...result });
    } catch (e) {
      event.reply("teams:bulk-insert-reply", {
        ok: false,
        error: String((e && e.message) || e),
      });
    }
  });

  // List
  ipcMain.on("teams:get-all", async (event) => {
    try {
      const items = await getAllTeams();
      // kirim _id sebagai string agar aman di renderer
      const mapped = (items || []).map((it) => ({
        ...it,
        _id: String(it._id),
      }));
      event.reply("teams:get-all-reply", { ok: true, items: mapped });
    } catch (e) {
      event.reply("teams:get-all-reply", {
        ok: false,
        items: [],
        error: String((e && e.message) || e),
      });
    }
  });

  // Update
  ipcMain.on("teams:update", async (event, payload) => {
    try {
      const ok = await updateTeamById(payload);
      event.reply("teams:update-reply", { ok });
    } catch (e) {
      event.reply("teams:update-reply", {
        ok: false,
        error: String((e && e.message) || e),
      });
    }
  });

  // Delete
  ipcMain.on("teams:delete", async (event, { _id }) => {
    try {
      const ok = await deleteTeamById(_id);
      event.reply("teams:delete-reply", { ok });
    } catch (e) {
      event.reply("teams:delete-reply", {
        ok: false,
        error: String((e && e.message) || e),
      });
    }
  });

  // ========================================================================
  // Teams Registered Function
  // ========================================================================

  ipcMain.on("get-teams-registered", async (event, identity) => {
    // __reqId dipakai renderer utk mencocokkan balasan ke request pengirimnya
    // sendiri saat beberapa request ditembak bersamaan (mis. 4 panel divisi/
    // race sekaligus) — tanpa ini, ipcRenderer.once() di renderer bisa
    // menangkap balasan milik request lain karena semuanya berbagi channel
    // yang sama.
    const reqId = identity && identity.__reqId;
    try {
      const res = await getTeamsRegistered(identity);
      event.reply("get-teams-registered-reply", { ...(res || {}), __reqId: reqId });
    } catch (error) {
      event.reply("get-teams-registered-reply", { __reqId: reqId });
    }
  });

  ipcMain.on("delete-team-in-bucket", async (event, payload) => {
    try {
      const data = await deleteTeamInBucket(payload);
      event.reply("delete-team-in-bucket-reply", data);
    } catch (error) {
      event.reply("delete-team-in-bucket-reply", {
        ok: false,
        error: String(error),
      });
    }
  });

  ipcMain.on("upsert-teams-registered", async (event, bucket) => {
    const reqId = bucket && bucket.__reqId;
    try {
      const ok = await upsertTeamsRegistered(bucket);
      event.reply("upsert-teams-registered-reply", { ok, __reqId: reqId });
    } catch (error) {
      event.reply("upsert-teams-registered-reply", {
        ok: false,
        error: String(error),
        __reqId: reqId,
      });
    }
  });

  // Cari semua event/race dimana sebuah tim (by nameTeam) terdaftar
  ipcMain.on("teams-registered:find-by-name", async (event, nameTeam) => {
    try {
      const items = await findRegisteredEntriesByTeamName(nameTeam);
      event.reply("teams-registered:find-by-name-reply", { ok: true, items });
    } catch (error) {
      event.reply("teams-registered:find-by-name-reply", {
        ok: false,
        items: [],
        error: String((error && error.message) || error),
      });
    }
  });

  // Semua bucket registrasi (lintas race category) utk satu event — dipakai
  // Event Overall Result utk cross-check skor lama vs registrasi terkini
  ipcMain.on("teams-registered:find-by-event", async (event, eventId) => {
    try {
      const items = await findRegisteredBucketsByEventId(eventId);
      event.reply("teams-registered:find-by-event-reply", { ok: true, items });
    } catch (error) {
      event.reply("teams-registered:find-by-event-reply", {
        ok: false,
        items: [],
        error: String((error && error.message) || error),
      });
    }
  });

  // Detail lengkap tim ter-registered (dedupe fisik + assignment per
  // kategori/kelas) utk fitur "Team Roster" di Event Details.
  ipcMain.on("teams-registered:detail-by-event", async (event, eventId) => {
    try {
      const resp = await findRegisteredTeamsDetailByEvent(eventId);
      event.reply("teams-registered:detail-by-event-reply", resp);
    } catch (error) {
      event.reply("teams-registered:detail-by-event-reply", {
        ok: false,
        teams: [],
        totalTeams: 0,
        error: String((error && error.message) || error),
      });
    }
  });

  // GET: satu user by email (jika perlu prefill individual)
  ipcMain.on("teams-registered:find", async (event, filters) => {
    // __reqId (kalau dikirim) digemakan balik supaya pemanggil yang butuh
    // mencocokkan balasan ke request-nya sendiri (mis. fetchBucketTeamsByKey()
    // di DownRiverRace.vue) bisa pakai ipcRenderer.on()+cek __reqId alih2
    // .once() polos — pemanggil lama yang tidak kirim __reqId tidak
    // terpengaruh (field cuma echo, diabaikan getRegistered()).
    const reqId = filters && filters.__reqId;
    const res = await getRegistered(filters || {});
    event.sender.send("teams-registered:find-reply", { ...res, __reqId: reqId });
  });

  ipcMain.on("teams-h2h-registered:find", async (event, filters) => {
    const res = await getRegisteredH2H(filters || {});
    event.sender.send("teams-h2h-registered:find-reply", res);
  });

  ipcMain.on("teams-sprint-registered:find", async (event, filters) => {
    const res = await getRegisteredSprint(filters || {});
    event.sender.send("teams-sprint-registered:find-reply", res);
  });

  ipcMain.on("teams-slalom-registered:find", async (event, filters) => {
    // __reqId (kalau dikirim) digemakan balik supaya pemanggil bisa
    // mencocokkan balasan ke request-nya sendiri lewat ipcRenderer.on()+cek
    // __reqId, bukan .once() polos — dulu .once() menyalakan SEMUA listener
    // yg masih menunggu di channel ini begitu balasan PERTAMA datang, jadi
    // 2 klik pindah bucket (mis. R4 MEN lalu cepat ke R4 WOMEN) yang
    // permintaannya tumpang-tindih bisa sama2 ke-resolve dgn payload yang
    // SAMA, membuat tabel kedua kategori terlihat identik. Pemanggil lama
    // yang tidak kirim __reqId tidak terpengaruh (field cuma echo).
    const reqId = filters && filters.__reqId;
    const res = await getRegisteredSlalom(filters || {});
    event.sender.send("teams-slalom-registered:find-reply", {
      ...res,
      __reqId: reqId,
    });
  });

  ipcMain.on("teams-rx-registered:find", async (event, filters) => {
    const res = await getRegisteredRX(filters || {});
    event.sender.send("teams-rx-registered:find-reply", res);
  });

  // =========================
  // Race Settings (GET/UPSERT)
  // =========================
  // GET
  // BUG FIX: sama persis kelas bug yg sudah diperbaiki di
  // "teams-slalom-registered:find" (lihat komentar di situ) — dulu
  // eventId dikirim polos (string), balasannya lewat .once() di SEMUA
  // pemanggil (13 komponen: 5 race category + 5 result page + RaceSettings
  // modal + JudgesSettings). Kalau 2 komponen sama2 minta race-settings
  // hampir bersamaan (mis. RaceSettingsModal ikut ke-mount di halaman yg
  // sama), balasan PERTAMA yg datang menyalakan SEMUA .once() listener yg
  // masih menunggu — bukan cuma punya pemanggil yg sebenarnya request itu.
  // Kalau requestnya utk eventId BEDA, komponen yg "salah dapat" balasan
  // ini berakhir pakai Race Settings event lain. __reqId (kalau dikirim)
  // digemakan balik supaya pemanggil bisa cocokkan balasan ke request-nya
  // sendiri via ipcRenderer.on()+cek __reqId — pemanggil lama yg kirim
  // eventId polos (bukan object) tidak terpengaruh (__reqId cuma undefined).
  ipcMain.on("race-settings:get", async (event, payload) => {
    const isObj = payload && typeof payload === "object";
    const id = (isObj ? payload.eventId : payload || "").toString();
    const reqId = isObj ? payload.__reqId : undefined;
    try {
      const doc = await getRaceSettingsByEventId(id);
      const settings = doc && doc.settings ? doc.settings : null;

      event.reply("race-settings:get-reply", {
        ok: true,
        settings: settings,
        __reqId: reqId,
      });
    } catch (err) {
      event.reply("race-settings:get-reply", {
        ok: false,
        error: err && err.message ? err.message : String(err),
        __reqId: reqId,
      });
    }
  });

  // UPSERT
  ipcMain.on("race-settings:upsert", async (event, payload) => {
    try {
      const p = payload || {};
      const id = (p.eventId || "").toString();
      const incoming = p.settings || {};

      const updated = await upsertRaceSettingsByEventId(id, incoming);
      const out = updated && updated.settings ? updated.settings : incoming;

      event.reply("race-settings:upsert-reply", {
        ok: true,
        settings: out,
      });
    } catch (err) {
      event.reply("race-settings:upsert-reply", {
        ok: false,
        error: err && err.message ? err.message : String(err),
      });
    }
  });
}

// =========================
// Judges Settings (GET/UPSERT)
// =========================
// CREATE/UPDATE (bulk)
ipcMain.on("users-judges-assignment:upsertMany", async (event, payload) => {
  try {
    var arr = [];
    if (payload && Array.isArray(payload.docs)) arr = payload.docs;

    var result = await upsertManyUserJudgeAssignments(arr);
    event.sender.send("users-judges-assignment:upsertMany:reply", {
      ok: true,
      result: result,
    });
  } catch (err) {
    var msg = err && err.message ? String(err.message) : String(err);
    event.sender.send("users-judges-assignment:upsertMany:reply", {
      ok: false,
      error: msg,
    });
  }
});

// GET: list semua assignment untuk 1 event (hanya entry judges pada event tsb)
ipcMain.on("users-judges-assignment:listByEvent", async (event, payload) => {
  try {
    var eventId = payload && payload.eventId ? String(payload.eventId) : "";
    if (eventId === "") throw new Error("eventId is required");

    var items = await listUserJudgeAssignmentsByEvent(eventId);
    event.sender.send("users-judges-assignment:listByEvent:reply", {
      ok: true,
      items: items,
    });
  } catch (err) {
    var msg = err && err.message ? String(err.message) : String(err);
    event.sender.send("users-judges-assignment:listByEvent:reply", {
      ok: false,
      error: msg,
      items: [],
    });
  }
});

// GET: satu user by email (jika perlu prefill individual)
ipcMain.on("users-judges-assignment:getByEmail", async (event, payload) => {
  try {
    var email = payload && payload.email ? String(payload.email) : "";
    if (email === "") throw new Error("email is required");

    var doc = await getUserJudgeAssignmentByEmail(email);
    event.sender.send("users-judges-assignment:getByEmail:reply", {
      ok: true,
      data: doc,
    });
  } catch (err) {
    var msg = err && err.message ? String(err.message) : String(err);
    event.sender.send("users-judges-assignment:getByEmail:reply", {
      ok: false,
      error: msg,
    });
  }
});

ipcMain.on("event-results:upsert", async (event, payload) => {
  try {
    const result = await upsertEventResultsDoc(payload);
    console.log(result, "<<<<");
    const serialized = EJSON.serialize({ ok: true, result });
    event.reply("event-results:upsert-reply", serialized);
  } catch (error) {
    const serialized = EJSON.serialize({
      ok: false,
      error: error && error.message ? error.message : String(error),
    });
    event.reply("event-results:upsert-reply", serialized);
  }
});

// GET: Event Results (overall/aggregate)
ipcMain.on("event-results:get", async function (event, filters) {
  var f = filters || {};
  var reqId = f.__reqId; // lihat catatan __reqId di handler get-teams-registered
  try {
    var doc = await getEventResultsAggregate(f);
    event.reply("event-results:get-reply", { ok: true, doc: doc, __reqId: reqId });
  } catch (error) {
    event.reply("event-results:get-reply", {
      ok: false,
      doc: null,
      error: error && error.message ? error.message : String(error),
      __reqId: reqId,
    });
  }
});

// GET: semua dokumen Overall (semua bucket division/race/initial) dalam satu event
ipcMain.on("event-results:get-all-by-event", async function (event, eventId) {
  try {
    var items = await getEventResultsByEventId(eventId);
    event.reply("event-results:get-all-by-event-reply", {
      ok: true,
      items: items,
    });
  } catch (error) {
    event.reply("event-results:get-all-by-event-reply", {
      ok: false,
      items: [],
      error: error && error.message ? error.message : String(error),
    });
  }
});

// HEAD 2 HEAD
ipcMain.on("h2h:bracket:get", async (e, bucket) => {
  // __reqId (kalau dikirim) digemakan balik supaya pemanggil yang butuh
  // mencocokkan balasan ke request-nya sendiri (mis. loadH2HStatusForPanel()
  // di Details/index.vue, yang bisa fetch beberapa panel bersamaan) bisa
  // pakai ipcRenderer.on()+cek __reqId alih2 once() polos yang rawan salah
  // tangkap balasan panel lain — pemanggil lama yang tidak kirim __reqId
  // tidak terpengaruh (field ini cuma ada kalau diminta).
  const reqId = bucket && bucket.__reqId;
  try {
    const result = await getBracket(bucket);
    e.reply("h2h:bracket:get-reply", { ...result, __reqId: reqId });
  } catch (err) {
    e.reply("h2h:bracket:get-reply", {
      ok: false,
      error: String(err),
      __reqId: reqId,
    });
  }
});

ipcMain.on("h2h:bracket:save", async (e, payload) => {
  // __reqId digemakan balik supaya renderer bisa mencocokkan balasan ke
  // request pengirimnya sendiri — saveBracketToDB() di HeadToHead.vue bisa
  // terpanggil berkali-kali cepat berurutan (tiap Heat berubah, advance
  // round, dll.) tanpa saling menunggu; tanpa __reqId, ipcRenderer.once()
  // di renderer akan salah menangkap balasan milik request lain karena
  // semuanya berbagi channel "h2h:bracket:save-reply" yang sama.
  const reqId = payload && payload.__reqId;
  try {
    const { bucket, rounds, showBronze, settings } = payload || {};
    const result = await upsertBracket(bucket, rounds, { showBronze, settings });
    e.reply("h2h:bracket:save-reply", { ...result, __reqId: reqId });
  } catch (err) {
    e.reply("h2h:bracket:save-reply", { ok: false, error: String(err), __reqId: reqId });
  }
});

ipcMain.on("h2h:round:save", async (e, payload) => {
  try {
    const { bucket, roundId, roundName, rows } = payload;
    e.reply(
      "h2h:round:save-reply",
      await upsertRoundRows(bucket, roundId, roundName, rows)
    );
  } catch (err) {
    e.reply("h2h:round:save-reply", { ok: false, error: String(err) });
  }
});

ipcMain.on("h2h:rounds:saveMany", async (e, payload) => {
  try {
    const { bucket, roundsSheets } = payload;
    e.reply(
      "h2h:rounds:saveMany-reply",
      await upsertAllRounds(bucket, roundsSheets)
    );
  } catch (err) {
    e.reply("h2h:rounds:saveMany-reply", { ok: false, error: String(err) });
  }
});

ipcMain.on("h2h:overall:save", async (e, payload) => {
  try {
    const { bucket, overallPkg } = payload;
    e.reply("h2h:overall:save-reply", await upsertOverall(bucket, overallPkg));
  } catch (err) {
    e.reply("h2h:overall:save-reply", { ok: false, error: String(err) });
  }
});

ipcMain.on("h2h:overall:get", async (e, bucket) => {
  try {
    e.reply("h2h:overall:get-reply", await getOverall(bucket));
  } catch (err) {
    e.reply("h2h:overall:get-reply", { ok: false, error: String(err) });
  }
});

ipcMain.on("h2h:results:getAll", async (e, bucket) => {
  const reqId = bucket && bucket.__reqId;
  try {
    const result = await getAllResults(bucket);
    e.reply("h2h:results:getAll-reply", { ...result, __reqId: reqId });
  } catch (err) {
    e.reply("h2h:results:getAll-reply", {
      ok: false,
      error: String(err),
      __reqId: reqId,
    });
  }
});

// RAFTING CROSS
ipcMain.on("rx:bracket:get", async (e, bucket) => {
  try {
    e.reply("rx:bracket:get-reply", await rxGetBracket(bucket));
  } catch (err) {
    e.reply("rx:bracket:get-reply", { ok: false, error: String(err) });
  }
});

ipcMain.on("rx:bracket:save", async (e, payload) => {
  try {
    const { bucket, rounds, settings } = payload;
    e.reply(
      "rx:bracket:save-reply",
      await rxUpsertBracket(bucket, rounds, { settings })
    );
  } catch (err) {
    e.reply("rx:bracket:save-reply", { ok: false, error: String(err) });
  }
});

ipcMain.on("rx:heat:save", async (e, payload) => {
  try {
    const { bucket, roundId, roundName, heatId, rows } = payload;
    e.reply(
      "rx:heat:save-reply",
      await rxUpsertHeatRows(bucket, roundId, roundName, heatId, rows)
    );
  } catch (err) {
    e.reply("rx:heat:save-reply", { ok: false, error: String(err) });
  }
});

ipcMain.on("rx:rounds:saveMany", async (e, payload) => {
  try {
    const { bucket, roundsSheets } = payload;
    e.reply(
      "rx:rounds:saveMany-reply",
      await rxUpsertAllRounds(bucket, roundsSheets)
    );
  } catch (err) {
    e.reply("rx:rounds:saveMany-reply", { ok: false, error: String(err) });
  }
});

ipcMain.on("rx:overall:save", async (e, payload) => {
  try {
    const { bucket, overallPkg } = payload;
    e.reply("rx:overall:save-reply", await rxUpsertOverall(bucket, overallPkg));
  } catch (err) {
    e.reply("rx:overall:save-reply", { ok: false, error: String(err) });
  }
});

ipcMain.on("rx:overall:get", async (e, bucket) => {
  try {
    e.reply("rx:overall:get-reply", await rxGetOverall(bucket));
  } catch (err) {
    e.reply("rx:overall:get-reply", { ok: false, error: String(err) });
  }
});

ipcMain.on("rx:brackets:byEvent", async (e, eventId) => {
  try {
    e.reply("rx:brackets:byEvent-reply", await rxGetBracketsByEventId(eventId));
  } catch (err) {
    e.reply("rx:brackets:byEvent-reply", { ok: false, error: String(err) });
  }
});

ipcMain.on("rx:overalls:byEvent", async (e, eventId) => {
  try {
    e.reply("rx:overalls:byEvent-reply", await rxGetOverallsByEventId(eventId));
  } catch (err) {
    e.reply("rx:overalls:byEvent-reply", { ok: false, error: String(err) });
  }
});

module.exports = {
  setupIPCMainHandlers,
};
