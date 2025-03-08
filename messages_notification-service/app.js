// backend/app.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./config/db');
const annonceRoutes = require('./routes/annonceRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api', annonceRoutes); // Ensure this line exists

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

module.exports = app;