const express = require("express")
const router = express.Router()
const messageController = require("../controllers/messageController")
const authMiddleware = require("../middleware/auth")
const upload = require("../config/multer")

// Routes pour les messages
router.get("/messages", authMiddleware, messageController.getMessages)
router.get("/messages/received", authMiddleware, messageController.getReceivedMessages)
router.get("/messages/contacts", authMiddleware, messageController.getLastMessagesByContact)
router.post("/messages", authMiddleware, upload.single("file"), messageController.createMessage)
router.put("/messages/mark-as-read", authMiddleware, messageController.markMessagesAsRead)

module.exports = router
