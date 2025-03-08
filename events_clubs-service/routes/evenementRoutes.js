// backend/routes/evenementRoutes.js
const express = require('express');
const evenementController = require('../controllers/evenementController');
const multer = require('multer');
const path = require('path');

// Initialize the router
const router = express.Router();

// Configure storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext); // Ajoute un suffixe unique pour éviter les conflits de noms
    }
});

const upload = multer({ storage });

// Routes for events
router.get('/evenements', evenementController.getAllEvenements);
router.post('/evenements', upload.single('image'), evenementController.createEvenement);// Gestion de l'upload d'image
router.put('/evenements/:id', upload.single('image'), evenementController.updateEvenement); // Gestion de l'upload d'image
router.delete('/evenements/:id', evenementController.deleteEvenement);


// Route for image upload (optional, if needed separately)
router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ imageUrl: `/uploads/${req.file.filename}` }); // Retourne l'URL de l'image uploadée
});

// Export the router
module.exports = router;