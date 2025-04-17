import express from 'express';
import StudentPlanningController from '../controllers/studentPlanningController.js';

const router = express.Router();

// Student Login
router.post('/login', StudentPlanningController.login);

// Fetch Exams for a Semester
router.get('/exams', StudentPlanningController.getExams);

export default router;