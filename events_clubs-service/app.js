// backend/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const evenementRoutes = require('./routes/evenementRoutes'); 
const clubRoutes = require('./routes/clubRoutes');
const membreRoutes = require('./routes/membreRoutes');
const publicationRoutes = require('./routes/publicationRoutes');
const demandeRoutes = require('./routes/demandeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const evenementCLUBRoutes = require('./routes/evenementCLUBRoutes');
const messageRoutes = require('./routes/messageRoutes');
const clubADMRoutes = require('./routes/clubADMRoutes');
const filterADMRoutes = require('./routes/filterADMRoutes');
const demandeADMRoutes = require('./routes/demandeADMRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/evenement', evenementRoutes); // Utilisez evenementRoutes ici
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Assurer que le chemin est correct
app.use('/clubsCLUB', clubRoutes);
app.use('/membresCLUB', membreRoutes);
app.use('/publicationsCLUB', publicationRoutes);
app.use('/demandesCLUB', demandeRoutes);
app.use('/notificationsCLUB', notificationRoutes);
app.use('/evenementsCLUB', evenementCLUBRoutes); // Ajout des routes des événements
app.use('/messagesCLUB', messageRoutes); // Ajout de la route pour les messages
app.use('/clubsADM', clubADMRoutes); // Route pour les clubs
app.use('/Clubs', filterADMRoutes); // Ajout des routes de filtrage sous /api
app.use('/demandesADM', demandeADMRoutes); // Route pour les demandes

// Export the app
module.exports = app;