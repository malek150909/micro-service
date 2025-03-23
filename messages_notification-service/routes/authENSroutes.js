// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authENScontroller');

router.post('/login', authController.loginTeacher);

module.exports = router;