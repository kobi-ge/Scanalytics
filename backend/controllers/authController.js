import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '../config/db.js';

const JWT_SECRET = "scanalytics_team_secret_2026";

export const register = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const db = getDB();
        const users = db.collection('users');

        const existingUser = await users.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "אימייל כבר קיים" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { fullName, email, password: hashedPassword, createdAt: new Date() };
        
        const result = await users.insertOne(newUser);
        const token = jwt.sign({ id: result.insertedId }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ message: "נרשמת בהצלחה", token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = getDB();
        const user = await db.collection('users').findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: "פרטים שגויים" });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { fullName: user.fullName, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};