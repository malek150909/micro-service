// routes/resourceRoutes.js
const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const authenticateProfessor = require('../middleware/authenticateProfessor');
const conditionalUpload = require('../config/conditionalUpload');

router.get('/validate', resourceController.validateMatricule);
router.get('/sections', authenticateProfessor, resourceController.getSections);
router.get('/modules/:sectionId', authenticateProfessor, resourceController.getModules);
router.post('/upload', resourceController.uploadResource);
router.get('/resources', authenticateProfessor, resourceController.getResources);
router.delete('/resources/:id', authenticateProfessor, resourceController.deleteResource);
router.put('/resources/:id', resourceController.updateResource);

module.exports = router;