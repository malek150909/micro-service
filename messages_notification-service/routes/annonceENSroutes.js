// backend/routes/annonceRoutes.js
const express = require('express');
const router = express.Router();
const annonceController = require('../controllers/annonceENScontroller');

router.get('/admin/:matricule', annonceController.getAdminAnnonces);
router.get('/teacher/:matricule', annonceController.getTeacherAnnonces);
router.get('/sections/:matricule', annonceController.getTeacherSections);
router.post('/', annonceController.createAnnonce);
router.put('/:id', annonceController.updateAnnonce);
router.delete('/:id', annonceController.deleteAnnonce);

module.exports = router;