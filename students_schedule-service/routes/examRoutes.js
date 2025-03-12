// routes/examRoutes.js
const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

router.get('/', examController.getExams);
router.post('/', examController.addExam);
router.put('/:id', examController.updateExam);
router.delete('/:id', examController.deleteExam);
router.get('/modules/:sectionId', examController.getModulesBySection);
router.get('/salles', examController.getSalles);
router.get('/semestres', examController.getSemestres);
router.get('/facultes', examController.getFacultes);
router.get('/departements', examController.getDepartements);
router.get('/niveaux', examController.getNiveaux);
router.get('/specialites', examController.getSpecialites);
router.get('/sections', examController.getSections);

module.exports = router;