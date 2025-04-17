const express = require('express');
const router = express.Router();
const annonceController = require('../controllers/annonceENScontroller');

router.get('/admin/:matricule', annonceController.getAdminAnnonces);
router.get('/teacher/:matricule', annonceController.getTeacherAnnonces);
router.get('/sections/:matricule', annonceController.getTeacherSections);
router.post('/', annonceController.createAnnonce);
router.put('/:id', annonceController.updateAnnonce);
router.delete('/:id', annonceController.deleteAnnonce);

// Routes pour les commentaires
router.get('/comments/:annonceId', annonceController.getCommentsForAnnonce);
router.post('/comment/reply', annonceController.replyToComment);

// Routes pour le calendrier
router.post('/calendar/add', annonceController.addAdminEventToCalendar);
router.get('/calendar/check/:annonceId/:matricule', annonceController.checkCalendarEvent);

module.exports = router;