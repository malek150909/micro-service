const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('../config/db');
const annonceController = require('../controllers/annonceController');
const upload = require('../config/multer');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes pour les annonces (Sans le préfixe `/api`)
app.get('/annonces', annonceController.getAllAnnonces);
app.post('/annonces', upload.single('image'), annonceController.createAnnonce);
app.put('/annonces/:id', annonceController.updateAnnonce);
app.delete('/annonces/:id', annonceController.deleteAnnonce);

// Route pour l'upload d'image
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Lancer le serveur
const PORT = 8082;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
