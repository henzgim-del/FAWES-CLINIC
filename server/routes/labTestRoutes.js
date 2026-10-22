const express = require('express');
const router = express.Router();
const labTestController = require('../controllers/labTestController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, authorize('DOCTOR', 'NURSE', 'LAB_TECH', 'ADMIN'), labTestController.getLabTests)
  .post(protect, authorize('ADMIN'), labTestController.addLabTest);

module.exports = router;