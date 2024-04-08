class Events {
    constructor(db) {
      this.db = db;
      this.collection = db.collection('events');
    }
  
    async getEvents() {
      const events = await this.collection.find({}).toArray();
      return events;
    }
  }
  
  module.exports = Events;