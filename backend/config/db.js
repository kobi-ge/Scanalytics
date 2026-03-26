import { MongoClient, ServerApiVersion } from 'mongodb';

// Use environment variable or fallback to local MongoDB
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
        
        // Verify connection
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