const { getDb } = require("../index");
const { ObjectId } = require("mongodb");

var VALID_CATEGORIES = ["sprint", "h2h", "slalom", "drr", "rx"];
var VALID_ATTACHMENT_TYPES = ["image", "audio"];

function normalizeAttachment(a) {
  if (!a || typeof a !== "object") return null;
  var type = a.type ? String(a.type) : "";
  var url = a.url ? String(a.url) : "";
  if (VALID_ATTACHMENT_TYPES.indexOf(type) === -1 || !url) return null;

  var duration = Number(a.duration);
  return {
    type: type,
    url: url,
    publicId: a.publicId ? String(a.publicId) : "",
    format: a.format ? String(a.format) : "",
    bytes: Number.isFinite(Number(a.bytes)) ? Number(a.bytes) : 0,
    duration: Number.isFinite(duration) ? duration : null,
  };
}

// INSERT: satu pesan chat untuk sebuah event + kategori (Race Category)
async function insertChatMessage(payload) {
  var p = payload || {};
  var eventId = p.eventId ? String(p.eventId) : "";
  var category = p.category ? String(p.category).toLowerCase() : "";
  var senderEmail = p.senderEmail ? String(p.senderEmail) : "";
  var senderName = p.senderName ? String(p.senderName) : senderEmail;
  var text = p.text ? String(p.text).trim() : "";
  var attachment = normalizeAttachment(p.attachment);

  if (!eventId) throw new Error("eventId is required");
  if (VALID_CATEGORIES.indexOf(category) === -1) {
    throw new Error("category is required and must be one of: " + VALID_CATEGORIES.join(", "));
  }
  if (!senderEmail) throw new Error("senderEmail is required");
  if (!text && !attachment) throw new Error("text or attachment is required");

  var db = await getDb();
  var col = db.collection("chatMessages");

  var doc = {
    eventId: eventId,
    category: category,
    senderEmail: senderEmail,
    senderName: senderName,
    text: text,
    attachment: attachment,
    deleted: false,
    createdAt: new Date(),
  };

  var res = await col.insertOne(doc);
  return {
    ...doc,
    _id: String(res.insertedId),
  };
}

// LIST: riwayat chat untuk satu event + kategori, urut lama -> baru
async function listChatMessagesByEvent(eventId, category, opts) {
  var options = opts || {};
  var limit = Number.isFinite(options.limit) ? options.limit : 200;

  var db = await getDb();
  var col = db.collection("chatMessages");

  var query = { eventId: String(eventId || "") };
  if (category) query.category = String(category).toLowerCase();

  var items = await col
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  items.reverse(); // jadi urut lama -> baru
  items.forEach(function (it) {
    it._id = String(it._id);
  });
  return items;
}

// DELETE (soft): hapus/tarik pesan milik sendiri ala WhatsApp — dokumen
// tetap ada (utk urutan/histori) tapi text/attachment dikosongkan.
async function deleteChatMessage(id, senderEmail) {
  if (!id) return { ok: false, error: "id is required" };
  var email = senderEmail ? String(senderEmail) : "";
  if (!email) return { ok: false, error: "senderEmail is required" };

  var _id;
  try {
    _id = new ObjectId(String(id));
  } catch (e) {
    return { ok: false, error: "invalid id" };
  }

  var db = await getDb();
  var col = db.collection("chatMessages");

  var doc = await col.findOne({ _id: _id });
  if (!doc) return { ok: false, error: "not-found" };
  if (doc.senderEmail !== email) return { ok: false, error: "forbidden" };

  if (!doc.deleted) {
    await col.updateOne(
      { _id: _id },
      { $set: { deleted: true, text: "", attachment: null } }
    );
  }

  return { ok: true, id: String(_id) };
}

module.exports = {
  insertChatMessage,
  listChatMessagesByEvent,
  deleteChatMessage,
  VALID_CATEGORIES,
};
