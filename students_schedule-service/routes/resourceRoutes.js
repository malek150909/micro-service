import express from 'express';
import * as resourceController from '../controllers/resourceController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/validate', resourceController.validateMatricule);
router.get('/sections', resourceController.getSections);
router.get('/modules/:sectionId', resourceController.getModules);
router.post('/upload', resourceController.uploadResource);
router.get('/resources', authMiddleware, resourceController.getResources);
router.delete('/resources/:id', resourceController.deleteResource);
router.put('/resources/:id', resourceController.updateResource);

export default router;
