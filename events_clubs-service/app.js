const express = require('express');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const http = require('http');

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
const server = http.createServer(app); // <-- Créer un serveur HTTP autour d'Express

// Ajouter Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://plateform.universitaire", // ton port frontend
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
// 🎯 Ajouter ça pour avoir Socket.IO dans tes controllers
app.set('io', io);
app.use('/evenement', evenementRoutes); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 
app.use('/clubsCLUB', clubRoutes);
app.use('/membresCLUB', membreRoutes);
app.use('/publicationsCLUB', publicationRoutes);
app.use('/demandesCLUB', demandeRoutes);
app.use('/notificationsCLUB', notificationRoutes);
app.use('/api/club-events', evenementCLUBRoutes);  
app.use('/messagesCLUB', messageRoutes); 
// WebSocket : écoute des événements
io.on('connection', (socket) => {
    console.log('✅ Nouveau client connecté :', socket.id);
  
    socket.on('joinClub', (clubId) => {
      socket.join(`club_${clubId}`);
      console.log(`📌 Socket ${socket.id} a rejoint la salle : club_${clubId}`);
    });
  
    socket.on('disconnect', () => {
      console.log('❌ Déconnexion du socket :', socket.id);
    });
  });
app.use('/clubsADM', clubADMRoutes); 
app.use('/Clubs', filterADMRoutes); 
app.use('/demandesADM', demandeADMRoutes); 



module.exports = { app, server };