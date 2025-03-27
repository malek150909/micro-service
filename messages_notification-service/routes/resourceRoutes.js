// routes/resourceRoutes.js
const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');

router.get('/validate', resourceController.validateMatricule);
router.get('/sections', resourceController.getSections);
router.get('/modules/:sectionId',resourceController.getModules);
router.post('/upload', resourceController.uploadResource);
router.get('/resources', resourceController.getResources);
router.delete('/resources/:id', resourceController.deleteResource);
router.put('/resources/:id', resourceController.updateResource);

module.exports = router;