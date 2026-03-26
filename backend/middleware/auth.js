import jwt from 'jsonwebtoken';

const JWT_SECRET = "scanalytics_team_secret_2026";

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(403).json({ error: "Login required" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id; // Store ID for downstream use
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
};