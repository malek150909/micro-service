const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const authMiddleware = require("../middleware/auth")

// Route pour rechercher un utilisateur par email
router.get("/search", authMiddleware, userController.searchUser)

module.exports = router
