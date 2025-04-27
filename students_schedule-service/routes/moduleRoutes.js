// routes/moduleRoutes.js
import express from 'express';
import * as moduleController from '../controllers/moduleController.js';

const router = express.Router();

router.get('/', moduleController.getModules);
router.post('/', moduleController.addModule);
router.delete('/:id', moduleController.deleteModule);
router.put('/:id', moduleController.updateModule); // Nouvelle route pour la mise Ã  jour

router.get('/facultes', moduleController.getFacultes);
router.get('/departements', moduleController.getDepartements);
router.get('/niveaux', moduleController.getNiveaux);
router.get('/specialites', moduleController.getSpecialites);
router.get('/sections', moduleController.getSections);
router.get('/semestres', moduleController.getSemestres);

export default router;
