const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/login', authController.login);
router.post('/login-user', authController.loginUser);
router.post('/logout', authController.logout);

module.exports = router;
