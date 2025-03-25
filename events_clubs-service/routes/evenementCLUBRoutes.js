const express = require('express');
const router = express.Router();
const {
  getEvenementsByGerant,
  updateEvenement: updateEvenementWithMiddleware, // Renomme pour plus de clarté
  deleteEvenement,
} = require('../Controllers/evenementETDCLUBController');

// Routes pour les événements
router.get('/gerant/:gerant_matricule', getEvenementsByGerant); // Récupérer les événements d'un gérant
router.put('/:evenementId', ...updateEvenementWithMiddleware); // Modifier un événement avec middleware
router.delete('/:evenementId', deleteEvenement); // Supprimer un événement

module.exports = router;