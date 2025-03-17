import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import moduleRoutes from './routes/moduleRoutes.js';
import examRoutes from './routes/examRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';

dotenv.config();
process.env.TZ = 'UTC';

const app = express();
app.use(express.json());
app.use(cors());

app.use('/modules', moduleRoutes);
app.use('/exams', examRoutes);
app.use('/api', timetableRoutes);

const PORT = 8083;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});