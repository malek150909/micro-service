const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageETDController');
const upload = require('../config/multer');

router.get('/club/:clubId/user/:userMatricule', messageController.getMessagesForClub);
router.post('/club/:clubId', upload.single('file'), messageController.sendMessage);

module.exports = router;