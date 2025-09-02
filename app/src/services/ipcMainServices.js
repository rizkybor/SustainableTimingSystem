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
} = require("../controllers/INSERT/insertNewEvent.js");
const { getSprintResult } = require("../controllers/GET/getResult.js");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key:    process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
  secure:     true,
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
      const data = await insertSprintResult(datas);
      event.reply("insert-sprint-result-reply", data);
    } catch (error) {
      event.reply("insert-sprint-result-reply", null);
    }
  });

  // LOAD SPRINT RESULT
  ipcMain.on("get-sprint-result", async (event, query = {}) => {
    try {
      const data = await getSprintResult(query.eventId);
      event.reply("get-sprint-result-reply", { ok: true, items: data });
    } catch (error) {
      event.reply("get-sprint-result-reply", {
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
      filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "webp"] }],
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
      return { ok: false, error: err && err.message ? err.message : String(err) };
    }
  });

  ipcMain.handle("cloud:delete-image", async (_e, publicId) => {
    try {
      if (!publicId) throw new Error("Missing public_id");
      const r = await cloudinary.uploader.destroy(String(publicId), { resource_type: "image" });
      return { ok: true, result: r };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : String(err) };
    }
  });
}

module.exports = {
  setupIPCMainHandlers,
};
