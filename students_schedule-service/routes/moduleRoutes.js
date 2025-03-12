const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');

router.get('/', moduleController.getModules);
router.post('/', moduleController.addModule);
router.delete('/:id', moduleController.deleteModule);
router.put('/:id', moduleController.updateModule); // New route for updating

router.get('/facultes', moduleController.getFacultes);
router.get('/departements', moduleController.getDepartements);
router.get('/niveaux', moduleController.getNiveaux);
router.get('/specialites', moduleController.getSpecialites);
router.get('/sections', moduleController.getSections);
router.get('/semestres', moduleController.getSemestres);

module.exports = router;