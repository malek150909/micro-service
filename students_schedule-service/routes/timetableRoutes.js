// routes/timetableRoutes.js
import express from 'express';
import { getTimetable, getFilterOptions, deleteSession, updateSession, getSessionOptions , createSession , getSectionDetails } from '../controllers/timetableController.js';

const router = express.Router();

router.get('/timetable', getTimetable);
router.get('/filter-options', getFilterOptions);
router.delete('/session/:id', deleteSession);
router.put('/session/:id', updateSession);
router.get('/session-options', getSessionOptions);
router.post('/session', createSession);
router.get('/section-details', getSectionDetails);

export default router;