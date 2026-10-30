const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/dashboardController');

router.get('/', auth, controller.summary);

module.exports = router;
