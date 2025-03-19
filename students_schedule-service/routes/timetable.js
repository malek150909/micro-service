// routes/timetable.js
import express from 'express';
import { generateSchedule } from '../controllers/timetable.js';

const router = express.Router();

router.post('/generate-schedule', generateSchedule);

export default router;