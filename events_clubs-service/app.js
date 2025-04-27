const express = require('express');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const authMiddleware = require('./middleware/auth'); // Assurez-vous que ce middleware est correctement configuré

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

app.use(cors({
    origin: 'http://plateform.universitaire', // Remplacez par l'URL de votre frontend
    credentials: true,
  }));
app.use(express.json());

app.use('/evenement', evenementRoutes); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 
app.use('/clubsCLUB', clubRoutes);
app.use('/membresCLUB', membreRoutes);
app.use('/publicationsCLUB', publicationRoutes);
app.use('/demandesCLUB', demandeRoutes);
app.use('/notificationsCLUB', notificationRoutes);
app.use('/api/club-events', evenementCLUBRoutes);  
app.use('/messagesCLUB', messageRoutes); 
app.use('/clubsADM',authMiddleware ,clubADMRoutes); 
app.use('/Clubs', filterADMRoutes); 
app.use('/demandesADM', demandeADMRoutes); 

module.exports = app;