import express from 'express';
import multer from 'multer';
import { verifyToken } from '../middleware/auth.js';
import { getDB } from '../config/db.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// 1. העלאת סריקה (התאמה לסכימה של הדאטה)
router.post('/upload', verifyToken, upload.single('receipt'), async (req, res) => {
    try {
        const db = getDB();
        const newScan = {
            userId: req.userId,
            payment_method: "Unknown", // יפוענח בהמשך
            receipt_id: `img_${Date.now()}`,
            store: "ממתין לפענוח",
            purchase_date: new Date().toISOString().split('T')[0],
            total_price: 0,
            items: [],
            imageUrl: req.file ? req.file.path : null,
            createdAt: new Date()
        };
        const result = await db.collection('scans').insertOne(newScan);
        res.status(201).json({ message: "הקבלה הועלתה!", scanId: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: "שגיאה בשרת" });
    }
});

// 2. שמירה ידנית (חדש! חובה להוסיף כדי שהזנה ידנית תעבוד)
router.post('/manual', verifyToken, async (req, res) => {
    try {
        const db = getDB();
        const receiptData = {
            ...req.body,
            userId: req.userId,
            createdAt: new Date()
        };
        const result = await db.collection('scans').insertOne(receiptData);
        res.status(201).json({ ...receiptData, _id: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: "שגיאה בשמירת קבלה ידנית" });
    }
});

export default router;