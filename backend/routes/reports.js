const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/reportsController');

router.get('/inventory-by-crop', auth, ctrl.inventoryByCrop);
router.get('/distribution-trends', auth, ctrl.distributionTrends);
router.get('/top-recipients', auth, ctrl.topRecipients);

module.exports = router;
