const express = require('express');
const router = express.Router();
const annonceController = require('../controllers/annonceEtudiantController');

router.get('/admin/:matricule', annonceController.getAdminAnnonces);
router.get('/teacher/:matricule', annonceController.getTeacherAnnonces);
router.get('/sondages/:matricule', annonceController.getTeacherSondages);
router.post('/sondages/reponse', annonceController.submitSondageResponse);
router.get('/sondages/reponse/:sondageId/:matricule', annonceController.checkSondageResponse);

// Routes pour les commentaires
router.post('/comment', annonceController.addCommentToAnnonce);
router.post('/comment/reply', annonceController.replyToComment);
router.get('/comments/:annonceId', annonceController.getCommentsForAnnonce);

// Routes pour le calendrier
router.post('/calendar/add', annonceController.addAdminEventToCalendar);
router.get('/calendar/check/:annonceId/:matricule', annonceController.checkCalendarEvent);

module.exports = router;