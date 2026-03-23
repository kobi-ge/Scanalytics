import express from 'express';
import multer from 'multer';
import { verifyToken } from '../middleware/auth.js';
import { getDB } from '../config/db.js';

const router = express.Router();

// הגדרת מקום השמירה של התמונות (זמנית בתיקיית uploads)
const upload = multer({ dest: 'uploads/' });

// נתיב: POST /api/scans/upload
// הוא מוגן ב-verifyToken כדי שנדע מי המשתמש שמעלה
router.post('/upload', verifyToken, upload.single('receipt'), async (req, res) => {
    try {
        const { storeName, amount, date } = req.body;
        const db = getDB();

        const newScan = {
            userId: req.userId, // ה-ID שהגיע מהטוקן
            storeName,
            amount: parseFloat(amount),
            date: date || new Date(),
            imageUrl: req.file ? req.file.path : null, // הנתיב לתמונה
            createdAt: new Date()
        };

        const result = await db.collection('scans').insertOne(newScan);
        
        res.status(201).json({ 
            message: "הקבלה נשמרה בהצלחה! 🧾", 
            scanId: result.insertedId 
        });
    } catch (error) {
        res.status(500).json({ error: "שגיאה בשמירת הקבלה" });
    }
});

export default router;