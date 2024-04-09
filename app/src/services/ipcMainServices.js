const { ipcMain } = require("electron");
const { getAllEvents } = require("../models/mongos");

// communication with database
function setupIPCMainHandlers() {
  ipcMain.on("get-events", async (event) => {
    try {
      const data = await getAllEvents();
      event.reply("get-events-reply", data);
    } catch (error) {
      event.reply("get-events-reply", []);
    }
  });
}

module.exports = {
  setupIPCMainHandlers,
};
