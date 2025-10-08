const { ipcMain, dialog } = require("electron");
const { EJSON } = require("bson");
const path = require("path");
const fs = require("fs");

// === Cloudinary config (hanya di file ini) ===
require("dotenv").config();
const cloudinary = require("cloudinary").v2;

const {
  getAllEvents,
  getEventById,
} = require("../controllers/GET/getEvent.js");

const {
  getRegistered,
  getRegisteredH2H,
  getRegisteredSprint,
  getRegisteredSlalom,
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
} = require("../controllers/INSERT/insertNewEvent.js");

const {
  insertSprintResult,
  insertSlalomResult,
  insertDrrResult,
} = require("../controllers/INSERT/insertResultEventByCategories.js");

const {
  getTeamsRegistered,
  deleteTeamInBucket,
  upsertTeamsRegistered,
} = require("../controllers/INSERT/insertTeamsRegistered.js");

const {
  insertNewTeam,
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
} = require("../controllers/GET/getResult.js");

const {
  getRaceSettingsByEventId,
} = require("../controllers/GET/getRaceSettings");

const {
  upsertRaceSettingsByEventId,
} = require("../controllers/UPDATE/editRaceSettings");

const { getAllUsers } = require("../controllers/GET/getAllUsers");
const { updateUser } = require("../controllers/UPDATE/editUser");
const { deleteUser } = require("../controllers/DELETE/deleteUser");

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
    try {
      const data = await getSlalomResult(query.eventId);
      event.reply("get-slalom-result-reply", { ok: true, items: data });
    } catch (error) {
      event.reply("get-slalom-result-reply", {
        ok: false,
        items: [],
        error: error.message,
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
      const data = await getDrrResult(query.eventId);
      event.reply("get-drr-result-reply", { ok: true, items: data });
    } catch (error) {
      event.reply("get-drr-result-reply", {
        ok: false,
        items: [],
        error: error.message,
      });
    }
  });

  // ========================================================================
  // File picker & Cloudinary (TIDAK ADA optional chaining)
  // ========================================================================
  // (opsional) file picker untuk preload → window.fileAPI.pickImage()
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
        { value: "country", name: "Country" },
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
    try {
      const res = await getTeamsRegistered(identity);
      event.reply("get-teams-registered-reply", res);
    } catch (error) {
      event.reply("get-teams-registered-reply", null);
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
    try {
      const ok = await upsertTeamsRegistered(bucket);
      event.reply("upsert-teams-registered-reply", { ok });
    } catch (error) {
      event.reply("upsert-teams-registered-reply", {
        ok: false,
        error: String(error),
      });
    }
  });

  // GET: satu user by email (jika perlu prefill individual)
  ipcMain.on("teams-registered:find", async (event, filters) => {
    const res = await getRegistered(filters || {});
    event.sender.send("teams-registered:find-reply", res);
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
    const res = await getRegisteredSlalom(filters || {});
    event.sender.send("teams-slalom-registered:find-reply", res);
  });

  // =========================
  // Race Settings (GET/UPSERT)
  // =========================
  // GET
  ipcMain.on("race-settings:get", async (event, eventId) => {
    try {
      const id = (eventId || "").toString();
      const doc = await getRaceSettingsByEventId(id);
      const settings = doc && doc.settings ? doc.settings : null;

      event.reply("race-settings:get-reply", {
        ok: true,
        settings: settings,
      });
    } catch (err) {
      event.reply("race-settings:get-reply", {
        ok: false,
        error: err && err.message ? err.message : String(err),
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

module.exports = {
  setupIPCMainHandlers,
};
