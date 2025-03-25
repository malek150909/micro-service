// backend/routes/demande.js
const express = require('express');
const router = express.Router();
const demandeController = require('../controllers/demandeADMController');

// Définir les routes
router.get('/', demandeController.getAllDemandes); // Récupérer toutes les demandes
router.post('/', demandeController.createDemande); // Créer une demande
router.put('/accepter/:id', demandeController.accepterDemande); // Accepter une demande
router.put('/refuser/:id', demandeController.refuserDemande); // Refuser une demande

module.exports = router;