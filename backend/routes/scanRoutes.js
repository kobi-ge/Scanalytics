import express from 'express';
import multer from 'multer';
import { verifyToken } from '../middleware/auth.js';
import { getDB } from '../config/db.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// 1. Upload scan (consistent with data schema)
router.post('/upload', verifyToken, upload.single('receipt'), async (req, res) => {
    try {
        const db = getDB();
        const newScan = {
            userId: req.userId,
            payment_method: "Unknown", // יפוענח בהמשך
            receipt_id: `img_${Date.now()}`,
            store: "Pending extraction...",
            purchase_date: new Date().toISOString().split('T')[0],
            total_price: 0,
            items: [],
            imageUrl: req.file ? req.file.path : null,
            createdAt: new Date()
        };
        const result = await db.collection('scans').insertOne(newScan);
        res.status(201).json({ message: "Receipt uploaded!", scanId: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// 2. Manual entry (Save directly to DB)
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
        res.status(500).json({ error: "Error saving manual receipt" });
    }
});

export default router;