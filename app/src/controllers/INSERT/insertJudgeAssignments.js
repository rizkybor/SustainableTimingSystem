const { getDb } = require("../index");
const { ObjectId } = require('mongodb');

// CREATE/UPDATE bulk: per user (email), replace judges untuk eventId yg sama
async function upsertManyUserJudgeAssignments(docs) {
  if (!Array.isArray(docs) || docs.length === 0) {
    return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
  }

  var db = await getDb();
  var col = db.collection("userJudgeAssignments");

  var ops = [];
  for (var i = 0; i < docs.length; i++) {
    var d = docs[i] || {};
    var email = d && d.email ? String(d.email) : "";
    if (email === "") continue;

    var username = d && d.username ? String(d.username) : email;
    var judgeObj = null;
    var eventId = "";

    if (d && d.judges && Array.isArray(d.judges) && d.judges.length > 0) {
      judgeObj = d.judges[0];
      if (judgeObj && judgeObj.eventId) eventId = String(judgeObj.eventId);
    }
    if (eventId === "" || !judgeObj) continue;

    var now = new Date();

    // 1. Upsert dokumen user (create jika belum ada)
    ops.push({
      updateOne: {
        filter: { email: email },
        update: {
          $setOnInsert: { createdAt: now, __v: 0 },
          $set: {
            id: d && d.id ? String(d.id) : "",
            username: username,
            email: email,
            updatedAt: now
          }
        },
        upsert: true
      }
    });

    // 2. Hapus entry judges lama utk eventId tsb
    ops.push({
      updateOne: {
        filter: { email: email },
        update: { $pull: { judges: { eventId: eventId } } }
      }
    });

    // 3. Tambahkan entry judges baru
    ops.push({
      updateOne: {
        filter: { email: email },
        update: {
          $push: { judges: judgeObj },
          $set: { updatedAt: now }
        }
      }
    });
  }

  if (ops.length === 0) {
    return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
  }

  var res = await col.bulkWrite(ops, { ordered: false });
  return {
    matchedCount: res.matchedCount || 0,
    modifiedCount: res.modifiedCount || 0,
    upsertedCount: res.upsertedCount || 0
  };
}

// LIST by event: hanya mengembalikan judges yg cocok dg eventId
async function listUserJudgeAssignmentsByEvent(eventId) {
  var db = await getDb();
  var col = db.collection("userJudgeAssignments");

  var pipeline = [
    { $match: { "judges.eventId": String(eventId) } },
    {
      $project: {
        _id: 1,
        id: 1,
        username: 1,
        email: 1,
        createdAt: 1,
        updatedAt: 1,
        __v: 1,
        judges: {
          $filter: {
            input: "$judges",
            as: "j",
            cond: { $eq: ["$$j.eventId", String(eventId)] }
          }
        }
      }
    }
  ];

  var cursor = col.aggregate(pipeline);
  var items = await cursor.toArray();
  return items;
}

// GET satu user by email
async function getUserJudgeAssignmentByEmail(email) {
  var db = await getDb();
  var col = db.collection("userJudgeAssignments");
  var doc = await col.findOne({ email: String(email) });
  return doc;
}

module.exports = {
  upsertManyUserJudgeAssignments,
  listUserJudgeAssignmentsByEvent,
  getUserJudgeAssignmentByEmail
};