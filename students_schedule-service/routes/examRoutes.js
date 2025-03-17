// routes/examRoutes.js
import express from 'express';
import * as examController from '../controllers/examController.js';

const router = express.Router();

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

export default router;