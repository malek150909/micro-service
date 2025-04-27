// backend/routes/clubRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // Middleware d'authentification (si nécessaire)
const upload = require('../config/multerADM');
const {
  createClub,
  getAllClubs,
  getClubById,
  updateClub,
  deleteClub,
  getEtudiantsWithFilters,
} = require('../controllers/clubADMController');

router.post('/', authMiddleware ,upload.single('image'), createClub);
router.get('/',authMiddleware , getAllClubs);
router.get('/:id',authMiddleware , getClubById);
router.put('/:id', authMiddleware , upload.single('image'), updateClub);
router.delete('/:id',authMiddleware ,deleteClub);
router.get('/etudiants/filters',authMiddleware, getEtudiantsWithFilters);

module.exports = router;
