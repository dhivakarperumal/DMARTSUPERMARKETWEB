const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');
const upload = multer();

router.post('/register', upload.none(), authController.register);
router.post('/login', upload.none(), authController.login);
router.get('/users', authController.getAllUsers);

module.exports = router;
