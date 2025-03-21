const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./config/db');
const annonceRoutes = require('./routes/annonceRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const resourceRoutes = require('./routes/resourceRoutes');

const app = express();

require("dotenv").config();

// Middleware
app.use(cors());

// Routes (avant les middlewares qui consomment le flux)
app.use('/annonces', annonceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/", messageRoutes);
app.use('/ressources', resourceRoutes);

// Middlewares globaux (après les routes)
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// Gestion des erreurs globale
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err.stack);
    res.status(500).json({ error: 'Erreur interne du serveur', details: err.message });
});

module.exports = app;