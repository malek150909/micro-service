const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middleware/auth");
const upload = require("../config/multer"); // Importer multer

// Routes existantes
router.get("/messages", authMiddleware, messageController.getMessages);
router.get("/messages/received", authMiddleware, messageController.getReceivedMessages);

// Route pour créer un message (avec fichier)
router.post("/messages", authMiddleware, upload.single("file"), messageController.createMessage);

// Nouvelle route pour marquer les messages comme lus
router.put("/messages/mark-as-read", authMiddleware, messageController.markMessagesAsRead);

module.exports = router;