import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

router.get('/me', verifyToken, async (req, res) => {
    try {
        const db = getDB();
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(req.userId) },
            { projection: { password: 0 } }
        );
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "שגיאה בשליפת נתונים" });
    }
});

export default router;