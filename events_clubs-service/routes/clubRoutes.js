const express = require('express');
const router = express.Router();
const { getEtudiantClubs, updateClubPhoto } = require('../Controllers/clubETDController');

router.get('/etudiant/:matricule', getEtudiantClubs);
router.put('/:clubId/photo', updateClubPhoto);

module.exports = router;