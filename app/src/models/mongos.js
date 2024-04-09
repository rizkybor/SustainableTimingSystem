const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// connectToDatabase();
async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to database');
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}

// get All Events
async function getAllEvents() {
  try {
    await connectToDatabase();
    const database = client.db('sustainabledb'); 
    const collection = database.collection('eventsCollection');
    const data = await collection.find({}).toArray();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
}


module.exports = {
    getAllEvents
  };  