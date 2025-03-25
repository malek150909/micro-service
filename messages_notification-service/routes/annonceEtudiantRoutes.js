// student-annonces/backend/routes/annonceEtudiantRoutes.js
const express = require('express');
const router = express.Router();
const annonceController = require('../controllers/annonceEtudiantController');

router.get('/admin/:matricule', annonceController.getAdminAnnonces);
router.get('/teacher/:matricule', annonceController.getTeacherAnnonces);

module.exports = router;