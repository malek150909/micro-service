// club-evenement-service/backend/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const {getMessagesForClub , sendMessage} = require('../controllers/messageETDController')

// Récupérer les messages d’un club (messagerie de groupe)
router.get('/club/:clubId/user/:userMatricule', getMessagesForClub);

// Envoyer un message dans la messagerie de groupe
router.post('/club/:clubId', sendMessage);

module.exports = router;