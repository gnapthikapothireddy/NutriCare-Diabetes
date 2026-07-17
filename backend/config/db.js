const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const DB_FILE = path.join(__dirname, '..', 'data', 'local_db.json');
let isMongo = false;

// Ensure directories and initial JSON file exist
if (!fs.existsSync(path.dirname(DB_FILE))) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    users: [],
    bloodsugar: [],
    meals: [],
    medications: [],
    water: [],
    exercise: [],
    food: [],
    chatbot_logs: [],
    streaks: [],
    achievements: []
  }, null, 2));
}

// Connect to Database
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      console.log('Attempting to connect to MongoDB...');
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      isMongo = true;
      console.log('MongoDB Connected Successfully.');
    } catch (err) {
      console.error('MongoDB connection failed. Falling back to local JSON database.', err.message);
      isMongo = false;
    }
  } else {
    console.log('No MONGODB_URI found. Running on local JSON file database.');
    isMongo = false;
  }
};

// Helper read/write functions for local JSON
const readLocalDB = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading local JSON db:', err);
    return {};
  }
};

const writeLocalDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to local JSON db:', err);
  }
};

// Unified DB helper methods
const db = {
  isMongo: () => isMongo,

  // Find all items matching query
  find: async (collection, query = {}) => {
    if (isMongo) {
      try {
        const Model = mongoose.model(collection);
        return await Model.find(query).lean();
      } catch (err) {
        console.error(`MongoDB find error for ${collection}:`, err);
      }
    }
    // JSON Fallback
    const local = readLocalDB();
    const items = local[collection] || [];
    return items.filter(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },

  // Find single item
  findOne: async (collection, query = {}) => {
    if (isMongo) {
      try {
        const Model = mongoose.model(collection);
        return await Model.findOne(query).lean();
      } catch (err) {
        console.error(`MongoDB findOne error for ${collection}:`, err);
      }
    }
    // JSON Fallback
    const local = readLocalDB();
    const items = local[collection] || [];
    return items.find(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },

  // Insert single item
  insert: async (collection, document) => {
    const docWithId = { 
      _id: document._id || new mongoose.Types.ObjectId().toString(), 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...document 
    };

    if (isMongo) {
      try {
        const Model = mongoose.model(collection);
        const newDoc = new Model(docWithId);
        await newDoc.save();
        return newDoc.toObject();
      } catch (err) {
        console.error(`MongoDB insert error for ${collection}:`, err);
      }
    }
    // JSON Fallback
    const local = readLocalDB();
    if (!local[collection]) local[collection] = [];
    local[collection].push(docWithId);
    writeLocalDB(local);
    return docWithId;
  },

  // Update items matching query
  update: async (collection, query, updateData) => {
    if (isMongo) {
      try {
        const Model = mongoose.model(collection);
        const result = await Model.updateMany(query, { $set: updateData });
        return { modifiedCount: result.modifiedCount };
      } catch (err) {
        console.error(`MongoDB update error for ${collection}:`, err);
      }
    }
    // JSON Fallback
    const local = readLocalDB();
    const items = local[collection] || [];
    let modifiedCount = 0;
    
    local[collection] = items.map(item => {
      let matches = true;
      for (let key in query) {
        if (item[key] !== query[key]) matches = false;
      }
      if (matches) {
        modifiedCount++;
        return { ...item, ...updateData, updatedAt: new Date().toISOString() };
      }
      return item;
    });

    if (modifiedCount > 0) {
      writeLocalDB(local);
    }
    return { modifiedCount };
  },

  // Delete items matching query
  delete: async (collection, query) => {
    if (isMongo) {
      try {
        const Model = mongoose.model(collection);
        const result = await Model.deleteMany(query);
        return { deletedCount: result.deletedCount };
      } catch (err) {
        console.error(`MongoDB delete error for ${collection}:`, err);
      }
    }
    // JSON Fallback
    const local = readLocalDB();
    const items = local[collection] || [];
    const beforeCount = items.length;
    
    local[collection] = items.filter(item => {
      let matches = true;
      for (let key in query) {
        if (item[key] !== query[key]) matches = false;
      }
      return !matches;
    });

    const deletedCount = beforeCount - local[collection].length;
    if (deletedCount > 0) {
      writeLocalDB(local);
    }
    return { deletedCount };
  }
};

module.exports = { connectDB, db };
