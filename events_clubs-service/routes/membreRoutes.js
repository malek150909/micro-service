// club-evenement-service/backend/routes/membreRoutes.js
const express = require('express');
const router = express.Router();
const { getMembresClub, supprimerMembre } = require('../Controllers/membreETDController');

router.get('/club/:clubId', getMembresClub);
router.delete('/club/:clubId/membre/:matricule', supprimerMembre);

module.exports = router;