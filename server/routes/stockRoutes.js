const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { protect, authorize } = require('../middleware/auth');

// Get all stock (Accessible by Doctor, Nurse, Admin) & Add new stock (Admin only)
router.route('/')
  .get(protect, authorize('DOCTOR', 'NURSE', 'ADMIN'), stockController.getStock)
  .post(protect, authorize('ADMIN'), stockController.addStock);

// Dispense stock item (Nurse, Admin)
router.route('/:id/dispense')
  .patch(protect, authorize('NURSE', 'ADMIN'), stockController.dispenseStock);

module.exports = router;