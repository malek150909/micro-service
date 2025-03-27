import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import moduleRoutes from './routes/moduleRoutes.js';
import examRoutes from './routes/examRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import gradeRoutes from './routes/gradeRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import teacherRoutes from './routes/ENSemploi.js';
import timetableENSRoutes from './routes/timetableENSRoutes.js';
import timetableETDRoutes from './routes/timetableETDRoutes.js';

dotenv.config();
process.env.TZ = 'UTC';

const app = express();
app.use(express.json());
app.use(cors());

app.use('/modules', moduleRoutes);
app.use('/exams', examRoutes);
app.use('/timetable', timetableRoutes);
app.use('/grades', gradeRoutes);
app.use('/uploads', express.static('uploads')); // Serve uploaded files
app.use('/documents', documentRoutes);
app.use('/teacher', teacherRoutes);
app.use('/timetableENS', timetableENSRoutes);
app.use('/timetableETD', timetableETDRoutes);

const PORT = 8083;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});