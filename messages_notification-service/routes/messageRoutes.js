const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middleware/auth");

router.get("/messages", authMiddleware, messageController.getMessages);
router.get("/messages/received", authMiddleware, messageController.getReceivedMessages); // Nouvel endpoint
router.post("/messages", authMiddleware, messageController.createMessage);

module.exports = router;