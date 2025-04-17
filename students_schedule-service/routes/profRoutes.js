import express from 'express';
import ProfController from '../controllers/profController.js';

const router = express.Router();

// Existing routes
router.post('/login', ProfController.login);
router.get('/timetables', ProfController.getTimetables);
router.get('/modules', ProfController.getModules);
router.get('/groups', ProfController.getGroups);
router.get('/rooms', ProfController.getRooms);
router.post('/add-session', ProfController.addSession);
router.post('/modify-session', ProfController.modifySession);
router.delete('/delete-session/:id', ProfController.deleteSession);

// New route to fetch sections for a teacher
router.get('/sections/:matricule', ProfController.getSections);

export default router;