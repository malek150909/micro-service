import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import authMiddleware from './middleware/auth.js'; // Importez votre middleware
import moduleRoutes from './routes/moduleRoutes.js';
import examRoutes from './routes/examRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import gradeRoutes from './routes/gradeRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import teacherRoutes from './routes/ENSemploi.js';
import timetableENSRoutes from './routes/timetableENSRoutes.js';
import timetableETDRoutes from './routes/timetableETDRoutes.js';
import studentRoutes from './routes/ETDressourcesRoutes.js';
import notesRoutes from './routes/notesRoute.js';
import SUPPprofRoutes from './routes/profRoutes.js';
import studentPlanningRoutes from './routes/studentPlanningRoutes.js';
import calendarRoutes from "./routes/calendarRoutes.js";
import resourceRoutes from './routes/resourceRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
process.env.TZ = 'UTC';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['http://plateform.universitaire', 'http://localhost:8085'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'matricule'] 
}));

app.options('*', cors());

app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));


app.use('/modules', moduleRoutes);
app.use('/exams', examRoutes);
app.use('/timetable', timetableRoutes);
app.use('/grades', gradeRoutes);
app.use('/uploads', express.static('uploads')); 
app.use('/documents', documentRoutes);
app.use('/teacher', teacherRoutes);
app.use('/timetableENS', timetableENSRoutes);
app.use('/timetableETD', timetableETDRoutes);
app.use('/ETDressources', studentRoutes);
app.use("/notes", notesRoutes); 
app.use('/SUPPprof', SUPPprofRoutes);
app.use('/studentPlanning', studentPlanningRoutes);
app.use('/calendar',authMiddleware, calendarRoutes);
app.use('/ressources', resourceRoutes);


const PORT = 8083;
app.listen(PORT, () => {
  console.log(`Server running on http://courses.localhost`);
});
