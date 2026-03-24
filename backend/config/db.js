import { MongoClient, ServerApiVersion } from 'mongodb';

// הסרתי את tlsInsecure והשארתי רק את tlsAllowInvalidCertificates ב-URI
const uri = "mongodb+srv://barakc121_db_user:TZ3In5ONnclVExTx@cluster0.o6zuj2t.mongodb.net/scanalytics_db?retryWrites=true&w=majority&appName=Cluster0&tlsAllowInvalidCertificates=true";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // הגדרות חיבור יציבות
  connectTimeoutMS: 10000,
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