import { MongoClient, ServerApiVersion } from 'mongodb';

// מתשמש ב-ENV משתנה, או פולבק לחיבור מקומי/קומפוז
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

export const connectDB = async () => {
    try {
        await client.connect();
        db = client.db('scanalytics_db');
        
        // בדיקה שהחיבור עובד
        await db.command({ ping: 1 });
        
        console.log("Connected to MongoDB Atlas! 🍃");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:");
        console.error(error.message);
        process.exit(1);
    }
};

export const getDB = () => {
    if (!db) throw new Error("Database not initialized");
    return db;
};