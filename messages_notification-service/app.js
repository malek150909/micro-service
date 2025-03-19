// backend/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const annonceRoutes = require('./routes/annonceRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

require("dotenv").config();

// Middleware
app.use(cors());

app.use(express.json());

// Routes
app.use('/api', annonceRoutes); // Ensure this line exists
app.use("/api/users", userRoutes);
app.use("/api/", messageRoutes);

const JWT_SECRET = process.env.JWT_SECRET ;


// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

module.exports = app;