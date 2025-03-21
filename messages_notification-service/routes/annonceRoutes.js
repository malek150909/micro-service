const express = require('express');
const router = express.Router();
const annonceController = require('../controllers/annonceController');
const filtersController = require('../controllers/filtersController');
const upload = require('../config/multer');

router.get('/facultes', filtersController.getFacultes);
router.get('/departements', filtersController.getDepartements);
router.get('/specialites', filtersController.getSpecialites);

router.get('/annonces', annonceController.getAllAnnonces);
router.post('/annonces', upload.single('image'), annonceController.createAnnonce);
router.post('/annonces/:annonceId/notifications', annonceController.sendNotifications); // Nouvelle route
router.put('/annonces/:id', upload.single('image'), annonceController.updateAnnonce);
router.delete('/annonces/:id', annonceController.deleteAnnonce);

module.exports = router;