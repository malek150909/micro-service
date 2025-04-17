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

app.use(cors());
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
app.use('/clubsADM', clubADMRoutes); 
app.use('/Clubs', filterADMRoutes); 
app.use('/demandesADM', demandeADMRoutes); 

module.exports = app;