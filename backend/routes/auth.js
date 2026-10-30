const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login', controller.login);
router.post('/register', controller.register);
router.get('/me', auth, controller.me);

module.exports = router;
