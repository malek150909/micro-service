// app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const annonceRoutes = require('./routes/annonceRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const annonceENSroutes = require('./routes/annonceENSroutes');
const authENSroutes = require('./routes/authENSroutes');
const annonceETDRoutes = require('./routes/annonceEtudiantRoutes');

const app = express();

require("dotenv").config();

// Middleware globaux (avant les routes)
app.use(cors());
app.use(express.json()); // Parsing JSON avant les routes
app.use(bodyParser.json()); // Parsing JSON avant les routes (optionnel si vous utilisez express.json())
app.use(express.urlencoded({ extended: true }));

// Routes (après les middlewares qui consomment le flux)
app.use('/annonces', annonceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/", messageRoutes);
app.use('/ressources', resourceRoutes);
app.use('/annoncesENS', annonceENSroutes); // Routes maintenant après le parsing
app.use('/authENSannonce', authENSroutes);
app.use('/annoncesETD', annonceETDRoutes);

// Serve static files
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// Gestion des erreurs globale
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err.stack);
    res.status(500).json({ error: 'Erreur interne du serveur', details: err.message });
});

module.exports = app;