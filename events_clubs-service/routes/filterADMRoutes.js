// backend/routes/filterRoutes.js
const express = require('express');
const router = express.Router();
const {
  getFacultes,
  getDepartements,
  getSpecialites,
  getSections,
} = require('../controllers/filterADMController');

router.get('/facultes', getFacultes);
router.get('/departements', getDepartements);
router.get('/specialites', getSpecialites);
router.get('/sections', getSections);

module.exports = router;