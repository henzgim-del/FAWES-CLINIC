const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');
const { protect, authorize } = require('../middleware/auth');

// Get all visits and create a new visit
router.route('/')
  .get(protect, visitController.getVisits)
  .post(protect, authorize('RECEPTION', 'ADMIN'), visitController.createVisit);

// Record vitals and move visit to WAITING_DOCTOR
router.route('/:id/vitals')
  .patch(protect, authorize('NURSE', 'ADMIN'), visitController.recordVitals);
  // Record doctor consultation and clinical notes
router.route('/:id/consultation')
  .patch(protect, authorize('DOCTOR', 'ADMIN'), visitController.recordConsultation);
  // Dedicated route to add/update prescription
router.route('/:id/prescription')
  .post(protect, authorize('DOCTOR', 'ADMIN'), visitController.addPrescription);

  // Add lab request to a visit (Doctor / Admin)
router.route('/:id/lab-requests')
  .post(protect, authorize('DOCTOR', 'ADMIN'), visitController.addLabRequest);
  // Specimen collection / rejection route (Lab Tech / Admin)
// Specimen collection / rejection route (Lab / Admin)
router.route('/:id/lab-requests/:labId/specimen')
  .patch(protect, authorize('LAB', 'ADMIN'), visitController.collectSpecimen);

// Enter / verify lab test result (Lab / Admin)
router.route('/:id/lab-requests/:labId')
  .patch(protect, authorize('LAB', 'ADMIN'), visitController.updateLabResult);
  
  // Update visit payment status (Reception / Admin)
router.route('/:id/pay')
  .patch(protect, authorize('RECEPTION', 'ADMIN'), visitController.updatePaymentStatus);
  // Administer in-house treatment and deduct inventory (Nurse / Admin)
router.route('/:id/administer')
  .patch(protect, authorize('NURSE', 'ADMIN'), visitController.administerTreatment);
// Nurse Worklist
router.route('/nurse/worklist')
  .get(protect, authorize('NURSE', 'ADMIN'), visitController.getNurseWorklist);

// Treatment Task Status (Refusal, Omission, Adverse Event, Escalation)
router.route('/:id/treatment-status')
  .patch(protect, authorize('NURSE', 'ADMIN'), visitController.updateTreatmentTaskStatus);
// Billing & Checkout Routes
router.route('/:id/bill-summary')
  .get(protect, authorize('RECEPTION', 'ADMIN'), visitController.getVisitBillSummary);

router.route('/:id/checkout')
  .patch(protect, authorize('RECEPTION', 'ADMIN'), visitController.processVisitCheckout);
// Follow-up Care
router.route('/:id/follow-up')
  .patch(protect, authorize('NURSE', 'ADMIN'), visitController.recordFollowUpCare);
module.exports = router;