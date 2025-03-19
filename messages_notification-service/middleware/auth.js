const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    console.log("Received token:", token);
    if (!token) return res.status(401).json({ message: "Non autorisé" });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded token:", decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Token verification error:", error.message);
        res.status(401).json({ message: "Token invalide" });
    }
};

module.exports = authMiddleware;