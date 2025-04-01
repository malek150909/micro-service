const express = require('express');
const router = express.Router();
const sondageController = require('../controllers/sondageController');

router.post('/', sondageController.createSondage);
router.get('/teacher/:matricule', sondageController.getTeacherSondages);
router.get('/:id/results', sondageController.getSondageResults);
router.put('/:id', sondageController.updateSondage); // Nouvelle route pour modifier
router.delete('/:id', sondageController.deleteSondage); // Nouvelle route pour supprimer

module.exports = router;