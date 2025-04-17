// backend/routes/clubRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../config/multerADM');
const {
  createClub,
  getAllClubs,
  getClubById,
  updateClub,
  deleteClub,
  getEtudiantsWithFilters,
} = require('../controllers/clubADMController');

router.post('/', upload.single('image'), createClub);
router.get('/', getAllClubs);
router.get('/:id', getClubById);
router.put('/:id', upload.single('image'), updateClub);
router.delete('/:id', deleteClub);
router.get('/etudiants/filters', getEtudiantsWithFilters);

module.exports = router;