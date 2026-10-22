const express = require('express');
const router = express.Router();
const {
  registerPatient,
  getPatients,
  getPatientById,
  getPatientEMRHistory
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, authorize('ADMIN', 'RECEPTION'), registerPatient)
  .get(protect, authorize('ADMIN', 'RECEPTION', 'DOCTOR', 'NURSE'), getPatients);

// 2. Add the EMR history route before or after /:id
router.route('/:id/emr-history')
  .get(protect, authorize('DOCTOR', 'NURSE', 'ADMIN'), getPatientEMRHistory);

router.route('/:id')
  .get(protect, authorize('ADMIN', 'RECEPTION', 'DOCTOR', 'NURSE', 'LAB'), getPatientById);

module.exports = router;