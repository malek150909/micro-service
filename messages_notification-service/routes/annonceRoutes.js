// backend/routes/annonceRoutes.js
const express = require('express');
const annonceController = require('../controllers/annonceController');
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
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage });

// Routes for announcements
router.get('/annonces', annonceController.getAllAnnonces);
router.post('/annonces', upload.single('image'), annonceController.createAnnonce);
router.put('/annonces/:id', annonceController.updateAnnonce);
router.delete('/annonces/:id', annonceController.deleteAnnonce);

// Route for image upload
router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// Export the router
module.exports = router;