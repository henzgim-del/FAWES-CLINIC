// server/routes/documentRoutes.js
const express = require('express');
const router = express.Router();
const {
  getVisitDocuments,
  createClinicalDocument,
  markInvoicePaid,
  printVisitDocuments,
  getDocumentById, // <-- Add this here
} = require('../controllers/documentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.route('/:id')
  .get(getDocumentById); // Make sure getDocumentById is imported from your controller

// Notice these paths now start with /:visitId/documents since server.js mounts at /api/v1/visits
router.route('/visits/:visitId/documents')
  .get(getVisitDocuments)
  .post(authorize('DOCTOR', 'ADMIN'), createClinicalDocument);

router.patch('/items/:id/pay', authorize('RECEPTION', 'ADMIN', 'CASHIER'), markInvoicePaid);

router.patch('/visits/:visitId/print-queue', authorize('RECEPTION', 'ADMIN'), printVisitDocuments);

module.exports = router;