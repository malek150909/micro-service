// app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const http = require("http");
const { setupWebSocketServer } = require("./websocket"); // Adjust path if needed
const authMiddleware = require('./middleware/auth'); // Middleware d'authentification (si nécessaire)
const annonceRoutes = require('./routes/annonceRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const annonceENSroutes = require('./routes/annonceENSroutes');
const authENSroutes = require('./routes/authENSroutes');
const annonceETDRoutes = require('./routes/annonceEtudiantRoutes');
const sondageRoutes = require('./routes/sondageRoutes');
const notificationRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);

// WebSocket setup
setupWebSocketServer(server);

require("dotenv").config();

// Middleware globaux (avant les routes)
app.use(cors({
  origin: ['http://plateform.universitaire', 'http://localhost:8085'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

app.use(express.json()); // Parsing JSON avant les routes
app.use(bodyParser.json()); // Parsing JSON avant les routes (optionnel si vous utilisez express.json())
app.use(express.urlencoded({ extended: true }));

// Routes (après les middlewares qui consomment le flux)
app.use('/annonces',authMiddleware ,annonceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/",authMiddleware ,messageRoutes);
app.use('/ressources', resourceRoutes);
app.use('/annoncesENS', annonceENSroutes); // Routes maintenant après le parsing
app.use('/authENSannonce', authENSroutes);
app.use('/annoncesETD', annonceETDRoutes);
app.use('/sondages', sondageRoutes);
app.use('/notifications', notificationRoutes);

// Serve static files
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// Gestion des erreurs globale
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err.stack);
    res.status(500).json({ error: 'Erreur interne du serveur', details: err.message });
});

module.exports = app;