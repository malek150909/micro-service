const express = require('express');
const evenementController = require('../controllers/evenementController');
const multer = require('multer');
const path = require('path');

const router = express.Router();

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

router.get('/evenements', evenementController.getAllEvenements);

router.post('/evenements', upload.single('image'), (req, res, next) => {
  console.log('Requête POST /evenements reçue');
  console.log('Body:', req.body);
  console.log('File:', req.file);
  next();
}, evenementController.createEvenement);

router.put('/evenements/:id', upload.single('image'), evenementController.updateEvenement);
router.delete('/evenements/:id', evenementController.deleteEvenement);

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    console.error('Aucun fichier reçu dans /upload');
    return res.status(400).json({ message: 'No file uploaded' });
  }
  console.log('Fichier reçu avec succès :', req.file.filename, 'Chemin :', path.join('uploads', req.file.filename));
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

module.exports = router;