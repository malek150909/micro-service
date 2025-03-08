import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import planningRoutes from './routes/planningRoutes.js';

dotenv.config();
const app = express();


// ✅ Autoriser toutes les origines (pas recommandé en prod)
app.use(cors());
app.use('/api', planningRoutes);


// ✅ Autoriser une origine spécifique
app.use(cors({
  origin: ['http://localhost:9000', 'http://plateform.universitaire'],
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));
app.use(express.json());

// Routes
app.use('/api', planningRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});
console.log("App is rendering");

export default app;