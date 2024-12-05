const { connectToDatabase } = require("../index");

// get Participant
async function getParticipant(payload) {
  try {
    const database = await connectToDatabase();
    console.log(database, "<< THIS DATABASE");

    // Query ke participantsCollection
    const participantsCollection = database.collection("participantsCollection");
    const participants = await participantsCollection
      .find({payload})
      .toArray();

    // Ekstrak semua teamValue dari participants
    const teamValues = participants.map((participant) => participant.teamValue);

    // Query ke teamsCollection menggunakan teamValues
    const teamsCollection = database.collection("teamsCollection");
    const teams = await teamsCollection
      .find({
        value: { $in: teamValues },
      })
      .toArray();

    // Kembalikan data teams
    return teams;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

module.exports = {
  getParticipant,
};