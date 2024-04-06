// events.js
const { main } = require('../index.js');

async function getEvents(req, res) {
    try {
        await main(); // Panggil fungsi main untuk melakukan koneksi
        const db = main.client.db(main.dbName); // Ambil koneksi dari main
        const collection = db.collection("events");
        const events = await collection.find({}).toArray();
        res.json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

async function createEvent(req, res) {
    try {
        await main(); // Panggil fungsi main untuk melakukan koneksi
        const db = main.client.db(main.dbName); // Ambil koneksi dari main
        // Logika untuk membuat event baru
        res.json({ message: "Create event method" });
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

async function updateEvent(req, res) {
    try {
        await main(); // Panggil fungsi main untuk melakukan koneksi
        const db = main.client.db(main.dbName); // Ambil koneksi dari main
        // Logika untuk melakukan update event
        res.json({ message: "Update event method" });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = { getEvents, createEvent, updateEvent };
