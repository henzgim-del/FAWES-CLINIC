// server/controllers/documentController.js
const Document = require('../models/Document');
const Visit = require('../models/Visit');

// @desc    Get all documents for a specific visit (used by doctor & reception)
// @route   GET /api/visits/:visitId/documents
// @access  Private
const getVisitDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ visit: req.params.visitId })
      .populate('doctor', 'name email role')
      .populate('printedBy', 'name email role');
    
    res.status(200).json({ success: true, count: documents.length, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Doctor issues a clinical document (Sick Leave, Referral, Outsourced Test, Prescription)
// @route   POST /api/visits/:visitId/documents
// @access  Private (Doctor)
const createClinicalDocument = async (req, res) => {
  try {
    const { docType, organizationName, sickLeaveDetails, fullReferralDetails, outsourcedTestDetails, outsourcedPrescriptionDetails } = req.body;

    const visit = await Visit.findById(req.params.visitId);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    // Prepare document base data
    let docData = {
      visit: visit._id,
      patient: visit.patient,
      doctor: req.user._id,
      docType,
      organizationName
    };

    // Specific handling for SICK_LEAVE: Automatically inject first check-in date from the visit
    if (docType === 'SICK_LEAVE') {
      docData.sickLeaveDetails = {
        ...sickLeaveDetails,
        firstCheckInDate: visit.createdAt // Automatically grabbed from visit creation/check-in time
      };
    } else if (docType === 'FULL_REFERRAL') {
      docData.fullReferralDetails = fullReferralDetails;
    } else if (docType === 'OUTSOURCED_TEST') {
      docData.outsourcedTestDetails = outsourcedTestDetails;
    } else if (docType === 'OUTSOURCED_PRESCRIPTION') {
      docData.outsourcedPrescriptionDetails = outsourcedPrescriptionDetails;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid clinical document type' });
    }

    const document = await Document.create(docData);
    res.status(201).json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark invoice as PAID (Reception / Cashier action)
// @route   PATCH /api/documents/:id/pay
// @access  Private (Reception / Admin)
const markInvoicePaid = async (req, res) => {
  try {
    const invoiceDoc = await Document.findById(req.params.id);
    if (!invoiceDoc || invoiceDoc.docType !== 'INVOICE') {
      return res.status(404).json({ success: false, message: 'Invoice document not found' });
    }

    invoiceDoc.invoiceDetails.paymentStatus = 'PAID';
    invoiceDoc.invoiceDetails.paidAt = Date.now();
    await invoiceDoc.save();

    res.status(200).json({ success: true, message: 'Invoice marked as PAID successfully', data: invoiceDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Print documents (Reception action - requires invoice to be PAID)
// @route   PATCH /api/visits/:visitId/print-queue
// @access  Private (Reception)
const printVisitDocuments = async (req, res) => {
  try {
    const visitId = req.params.visitId;

    // 1. Check if visit invoice is PAID
    const invoiceDoc = await Document.findOne({ visit: visitId, docType: 'INVOICE' });
    
    // If an invoice exists and is still PENDING, block printing
    if (invoiceDoc && invoiceDoc.invoiceDetails.paymentStatus !== 'PAID') {
      return res.status(400).json({ 
        success: false, 
        message: 'Printing blocked: Patient invoice payment is still PENDING.' 
      });
    }

    // 2. Mark all unprinted documents for this visit as printed
    const updateResult = await Document.updateMany(
      { visit: visitId, isPrinted: false },
      { 
        $set: { 
          isPrinted: true, 
          printedAt: Date.now(), 
          printedBy: req.user._id 
        } 
      }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Documents printed successfully and audit trail updated.',
      modifiedCount: updateResult.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getVisitDocuments,
  createClinicalDocument,
  markInvoicePaid,
  printVisitDocuments
};