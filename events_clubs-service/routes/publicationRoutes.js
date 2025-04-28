const express = require('express');
const router = express.Router();
const publicationController = require('../controllers/publicationETDController');

// Routes pour les publications
router.post('/', publicationController.createPublication); // Créer une publication
router.get('/club/:clubId', publicationController.getPublicationsByClub); // Récupérer les publications d'un club
router.get('/public-events', publicationController.getPublicEventPublications); // Récupérer les événements publics
router.post('/:id/like', publicationController.addLike); // Ajouter ou retirer un like
router.post('/:id/comment', publicationController.addComment); // Ajouter un commentaire
router.delete('/:publicationId', publicationController.deletePublication); // Supprimer une publication
router.put('/:publicationId', publicationController.updatePublication); // Mettre à jour une publication
router.post('/:eventId/add-to-calendar', publicationController.addEventToCalendar); // Ajouter au calendrier
router.get('/:eventId/is-in-calendar', publicationController.isEventInCalendar); // Vérifier si l'événement est dans le calendrier
router.get('/calendar/:matricule', publicationController.getStudentCalendarEvents); // Récupérer les événements du calendrier

module.exports = router;