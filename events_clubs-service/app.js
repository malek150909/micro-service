// backend/app.js
const express = require('express');
const cors = require('cors');

const evenementRoutes = require('./routes/evenementRoutes'); // Importez evenementRoutes ici

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', evenementRoutes); // Utilisez evenementRoutes ici
app.use('/uploads', express.static('uploads'));

// Export the app
module.exports = app;