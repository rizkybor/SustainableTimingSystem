const { ipcMain, dialog } = require("electron");
const { getAllEvents } = require("../controllers/GET/getAllEvent.js")
const {
  getOptionLevel,
  getOptionCategoriesEvent,
  getOptionCategoriesDivision,
  getOptionCategoriesInitial,
  getOptionCategoriesRace,
} = require("../controllers/GET/getOptionEvent.js")

// communication with database
function setupIPCMainHandlers() {
  ipcMain.on("get-events", async (event) => {
    try {
      const options = {
        type: 'info',
        title: 'Information',
        message: 'Welcome to Sustainable Timing System Apps',
        buttons: ['OK']
      };
      dialog.showMessageBox(null, options, (response) => {
        console.log('You clicked:', options.buttons[response]);
      });
    
      const data = await getAllEvents();
      event.reply("get-events-reply", data);
    } catch (error) {
      event.reply("get-events-reply", []);
    }
  });

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
}

module.exports = {
  setupIPCMainHandlers,
};
