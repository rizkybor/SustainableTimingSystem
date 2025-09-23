const { ipcMain, dialog } = require("electron");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

const {
  getAllEvents,
  getEventById,
} = require("../controllers/GET/getEvent.js");

const {
  getOptionLevel,
  getOptionCategoriesEvent,
  getOptionCategoriesDivision,
  getOptionCategoriesInitial,
  getOptionCategoriesRace,
} = require("../controllers/GET/getOptionEvent.js");

const {
  insertNewEvent,
  insertSprintResult,
  insertSlalomResult,
} = require("../controllers/INSERT/insertNewEvent.js");

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
  getSprintResult,
  existsSprintResult,
} = require("../controllers/GET/getResult.js");

const {
  getRaceSettingsByEventId,
} = require("../controllers/GET/getRaceSettings");

const {
  upsertRaceSettingsByEventId,
} = require("../controllers/UPDATE/editRaceSettings");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
  secure: true,
});

// communication with database
function setupIPCMainHandlers() {
  // GET DB
  ipcMain.on("get-alert", async (event, options) => {
    try {
      const defaultOptions = {
        type: "info",
        detail: "Default detail",
        message: "Default message",
        buttons: ["OK"],
      };

      // Menggabungkan default options dengan options yang diterima dari renderer
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
      event.reply("get-events-reply", data);
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

  // INSERT DB
  ipcMain.on("insert-new-event", async (event, datas) => {
    try {
      const data = await insertNewEvent(datas);
      event.reply("insert-new-event-reply", data);
    } catch (error) {
      event.reply("insert-new-event-reply", []);
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
  // main process
  ipcMain.on("get-sprint-result", async (event, query = {}) => {
    try {
      const data = await getSprintResult(query); // << kirim objek, bukan eventId doang
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
  ipcMain.handle("file:pick-image", async () => {
    const dlg = await dialog.showOpenDialog({
      title: "Select image",
      properties: ["openFile"],
      filters: [
        { name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "webp"] },
      ],
    });

    const canceled = !!dlg.canceled;
    const filePaths = dlg.filePaths || [];

    if (canceled || !filePaths.length) {
      return { ok: false, canceled: true };
    }
    return { ok: true, path: filePaths[0] };
  });

  ipcMain.handle("cloud:upload-image", async (_e, absPath, options) => {
    const opts = options || {};
    try {
      if (!absPath) throw new Error("Missing file path");
      if (!fs.existsSync(absPath)) throw new Error("File not found");

      const res = await cloudinary.uploader.upload(absPath, {
        folder: opts.folder || "sts-rafter/events",
        resource_type: "image",
        overwrite: true,
        public_id: opts.publicId ? String(opts.publicId) : undefined,
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

  ipcMain.handle("cloud:delete-image", async (_e, publicId) => {
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
      console.error("teams:update error:", e);
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

  // main process
  // ipcMain.on("get-teams-registered", async (event, identity) => {
  //     try {
  //       const bucket = await getTeamsRegistered(identity);
  //       console.log(bucket,'<< BUCKET')
  //       event.reply("get-teams-registered-reply", bucket || null);
  //     } catch (err) {
  //       console.error("get-teams-registered error:", err);
  //       event.reply("get-teams-registered-reply", null);
  //     }
  //   });

  ipcMain.on("get-teams-registered", async (event, identity) => {
    try {
      console.log(identity, "<< identitas");
      const res = await getTeamsRegistered(identity);
      console.log(res, "<<< CEK RES");
      event.reply("get-teams-registered-reply", res);
    } catch (error) {
      console.error("get-teams-registered error:", error);
      event.reply("get-teams-registered-reply", null);
    }
  });

  ipcMain.on("delete-team-in-bucket", async (event, payload) => {
    try {
      const data = await deleteTeamInBucket(payload);
      event.reply("delete-team-in-bucket-reply", data);
    } catch (error) {
      console.error("delete-team-in-bucket error:", error);
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
      console.error("upsert-teams-registered error:", error);
      event.reply("upsert-teams-registered-reply", {
        ok: false,
        error: String(error),
      });
    }
  });

  // =========================
  // Race Settings (GET/UPSERT)
  // =========================
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

module.exports = {
  setupIPCMainHandlers,
};
