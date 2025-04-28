const express = require('express');
const router = express.Router();
const {
  getEvenementsByGerant,
  updateEvenement: updateEvenementWithMiddleware,
  deleteEvenement,
  addEventToCalendar,
  getPublicEvenements,
} = require('../controllers/evenementETDCLUBController');

// Routes pour les événements
router.get('/gerant/:gerant_matricule', getEvenementsByGerant); // Récupérer les événements d'un gérant
router.put('/:evenementId', updateEvenementWithMiddleware); // Modifier un événement avec middleware
router.delete('/:evenementId', deleteEvenement); // Supprimer un événement
router.post('/add-to-calendar', addEventToCalendar); // Ajouter un événement au calendrier
router.get('/api/club-events/public', getPublicEvenements); // Récupérer les événements publics

module.exports = router;