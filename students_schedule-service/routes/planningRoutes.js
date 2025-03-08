import express from 'express';
import {
  getFaculties,
  getDepartments,
  getSpecialities,
  getSections,
  getNiveaux,
  getExams,
  createExam,
  getRooms,
  getModulesBySpeciality,
  createBulkExams,
  updateExam,
  deleteExam,
  testRoute
} from '../controllers/planningController.js';

const router = express.Router();

// Routes
router.get('/faculties', getFaculties);
router.get('/departments/:facultyId', getDepartments);
router.get('/specialities/:departmentId', getSpecialities);
router.get('/sections', getSections);
router.get('/niveaux/:specialityId', getNiveaux);
router.get('/exams/:sectionId', getExams);
router.post('/exams', createExam);
router.get('/rooms', getRooms);
router.get('/modules/:specialityId', getModulesBySpeciality);
router.post('/exams/bulk', createBulkExams);
router.put('/exams/:id', updateExam);  // ✅ Corrected
router.delete('/exams/:id', deleteExam);
router.get('/test', testRoute);

export default router;
