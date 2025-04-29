// club-evenement-service/backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { getNotificationsByUser } = require('../controllers/notificationETDcontroller');

// Route pour récupérer les notifications d'un utilisateur
router.get('/user/:matricule', getNotificationsByUser);

module.exports = router;