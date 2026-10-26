const Visit = require('../models/Visit');
const Patient = require('../models/Patient');
const LabTest = require('../models/LabTest');
const Stock = require('../models/Stock');
const Document = require('../models/Document');

// @desc    Initiate a new visit (Receptionist)
// @route   POST /api/v1/visits
// @access  Private (RECEPTION, ADMIN)
// server/controllers/visitController.js

exports.createVisit = async (req, res) => {
  try {
    const { patientId, assignedDoctor } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ status: 'fail', message: 'Patient not found' });
    }

    // Check patient's most recent visit
    // Check patient's most recent visit
const lastVisit = await Visit.findOne({ patient: patientId }).sort({ createdAt: -1 });

let isReRegistrationFeeRequired = true;
if (lastVisit) {
  const daysSinceLastVisit = (new Date() - new Date(lastVisit.createdAt)) / (1000 * 60 * 60 * 24);
  
  // If the last visit is within 15 days, waive the re-registration/slip cost
  if (daysSinceLastVisit <= 15) {
    isReRegistrationFeeRequired = false;
  }
}

// Auto-generate invoice based on the 15-day rule
// Replace lines 36 to 66 in your server/controllers/visitController.js with this:

  // Auto-generate invoice based on the 15-day rule
  const invoiceItems = [];
  if (isReRegistrationFeeRequired) {
    invoiceItems.push({ serviceName: 'Re-Registration / Slip Fee', amount: 50 });
  }

  // 1. Create the visit record
  const visit = await Visit.create({
    patient: patientId,
    department: req.body.department || 'General',
    chiefComplaint: req.body.chiefComplaint || 'Standard Reception Registration',
    status: req.body.status || 'PENDING_TRIAGE',
    paymentStatus: isReRegistrationFeeRequired ? 'PENDING' : 'PAID'
  });

  // 2. Auto-generate the linked INVOICE document using correct visit._id reference
  await Document.create({
    visit: visit._id,
    patient: patientId,
    docType: 'INVOICE',
    invoiceDetails: {
      paymentStatus: isReRegistrationFeeRequired ? 'PENDING' : 'PAID',
      items: invoiceItems,
      totalAmount: isReRegistrationFeeRequired ? 50 : 0
    }
  });

  const populatedVisit = await Visit.findById(visit._id)
    .populate('patient')
    .populate('receptionist', 'fullName username role')
    .populate('assignedDoctor', 'fullName username role');

  res.status(201).json({
    status: 'success',
    data: populatedVisit
  });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Server error creating visit' });
  }
};

// @desc    Get all clinic visits with filters (status, doctor, patient)
// @route   GET /api/v1/visits
// @access  Private
exports.getVisits = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    const visits = await Visit.find(query)
      .populate('patient')
      .populate('receptionist', 'fullName username role')
      .populate('assignedDoctor', 'fullName username role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: visits.length,
      data: visits
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Server error fetching visits' });
  }
};

// @desc    Get single visit by ID
// @route   GET /api/v1/visits/:id
// @access  Private
exports.getVisitById = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('patient')
      .populate('assignedDoctor', 'fullName username role')
      .populate('labRequests.labTest'); // <--- This populates your 3-tier lab catalog details!

    if (!visit) {
      return res.status(404).json({
        status: 'fail',
        message: 'Visit not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: visit
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
// @desc    Record patient vitals and move visit to WAITING_DOCTOR
// @route   PATCH /api/v1/visits/:id/vitals
// @access  Private (Nurse, Admin)
// @desc    Record patient vitals and move visit to WAITING_DOCTOR
// @route   PATCH /api/v1/visits/:id/vitals
// @access  Private (Nurse, Admin)
exports.recordVitals = async (req, res, next) => {
  try {
    const { temperature, bloodPressure, heartRate, weight, height } = req.body;

    // Sanitize the ID to remove any accidental quotes, backslashes, or spaces
    const visitId = req.params.id.replace(/["\\]/g, '').trim();
    const visit = await Visit.findById(visitId);

    if (!visit) {
      return res.status(404).json({
        status: 'fail',
        message: 'Visit not found',
      });
    }

    // Update vitals and status
    visit.vitals = {
      temperature,
      bloodPressure,
      heartRate,
      weight,
      height,
    };
    visit.status = 'WAITING_DOCTOR';

    const updatedVisit = await visit.save();

    res.status(200).json({
      status: 'success',
      data: updatedVisit,
    });
  } catch (error) {
    next(error);
  }
};
// @desc    Record doctor consultation, diagnosis, and prescription
// @route   PATCH /api/v1/visits/:id/consultation
// @access  Private (Doctor, Admin)
exports.recordConsultation = async (req, res, next) => {
  try {
    const { diagnosis, notes, prescription, status } = req.body;
    const visit = await Visit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({
        status: 'fail',
        message: 'Visit not found',
      });
    }
    // Update clinical notes and status (default to COMPLETED if not specified)
    visit.clinicalNotes = {
      diagnosis: diagnosis || visit.clinicalNotes?.diagnosis,
      notes: notes || visit.clinicalNotes?.notes,
      prescription: prescription || visit.clinicalNotes?.prescription || [],
    };
    if (status) {
      visit.status = status; // e.g., 'COMPLETED' or 'WAITING_LAB'
    } else {
      visit.status = 'COMPLETED';
    }
    const updatedVisit = await visit.save();
    res.status(200).json({
      status: 'success',
      data: updatedVisit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};
// @desc    Add or update visit prescription
// @route   POST /api/v1/visits/:id/prescription
// @access  Private (DOCTOR, ADMIN)
exports.addPrescription = async (req, res, next) => {
  try {
    const visitId = req.params.id.replace(/['"\\]/g, '').trim();
    const { prescription } = req.body; // Can be an array or single object
    const visit = await Visit.findById(visitId);

    if (!visit) {
      return res.status(404).json({ status: 'fail', message: 'Visit not found' });
    }

    if (!visit.clinicalNotes) {
      visit.clinicalNotes = {};
    }

    // Assign prescriptions and ensure type is captured
    const formattedPrescriptions = (Array.isArray(prescription) ? prescription : [prescription]).map(p => ({
      ...p,
      prescriptionType: p.prescriptionType || 'EXTERNAL', // Defaults to external prescription
      dispensationStatus: 'PENDING_PAYMENT'
    }));

    visit.clinicalNotes.prescription = formattedPrescriptions;
    visit.markModified('clinicalNotes');
    await visit.save();

    res.status(200).json({
      status: 'success',
      data: visit
    });
  } catch (error) {
    console.error('Error adding prescription:', error);
    res.status(500).json({ status: 'error', message: 'Server error updating prescription' });
  }
};
// @desc    Administer in-house treatment & deduct inventory
// @route   PATCH /api/v1/visits/:id/administer
// @access  Private (Nurse, Admin)
exports.administerTreatment = async (req, res, next) => {
  try {
    const visitId = req.params.id.replace(/['"\\]/g, '').trim();
    const { prescriptionId, notes } = req.body;

    const visit = await Visit.findById(visitId);
    if (!visit) {
      return res.status(404).json({ status: 'fail', message: 'Visit not found' });
    }

    // 1. Verify payment gate for in-house treatments
    if (!visit.paymentStatus?.treatmentFeePaid) {
      return res.status(400).json({
        status: 'fail',
        message: 'Treatment fee has not been paid at reception.'
      });
    }

    // 2. Locate prescription item
    const prescriptions = visit.clinicalNotes?.prescription || [];
    const item = prescriptions.id ? prescriptions.id(prescriptionId) : prescriptions.find(p => p._id.toString() === prescriptionId);

    if (!item) {
      return res.status(404).json({ status: 'fail', message: 'Prescription item not found' });
    }

    if (item.prescriptionType !== 'IN_HOUSE') {
      return res.status(400).json({ status: 'fail', message: 'Item is not an in-house treatment order' });
    }

    // 3. Prevent duplicate deductions
    if (item.dispensationStatus === 'DISPENSED') {
      return res.status(400).json({ status: 'fail', message: 'Treatment has already been administered/dispensed' });
    }

    // 4. Deduct inventory stock if stock item exists
    const deductionQty = parseInt(item.quantity, 10) || 1;
    const stockItem = await Stock.findOne({
      name: { $regex: new RegExp(`^${item.medicationName}$`, 'i') }
    });

    if (stockItem) {
      if (stockItem.quantity < deductionQty) {
        return res.status(400).json({
          status: 'fail',
          message: `Insufficient stock for ${item.medicationName}. Available: ${stockItem.quantity}, Required: ${deductionQty}`
        });
      }
      stockItem.quantity -= deductionQty;
      await stockItem.save();
    }

    // 5. Update treatment dispensation status and nursing notes
    item.dispensationStatus = 'DISPENSED';
    item.administeredBy = req.user?.id;
    item.administeredAt = new Date();
    if (notes) item.administrationNotes = notes;

    visit.markModified('clinicalNotes');
    await visit.save();

    res.status(200).json({
      status: 'success',
      message: 'Treatment administered and inventory updated successfully',
      data: visit
    });
  } catch (error) {
    console.error('Error administering treatment:', error);
    res.status(500).json({ status: 'error', message: 'Server error administering treatment' });
  }
};
// @desc    Record specimen collection or rejection (Lab Tech / Admin)
// @route   PATCH /api/v1/visits/:id/lab-requests/:labId/specimen
// @access  Private (Lab Tech, Admin)
exports.collectSpecimen = async (req, res, next) => {
  try {
    const { specimenStatus, specimenType, specimenIdentifier, rejectionReason } = req.body;

    const visit = await Visit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ status: 'fail', message: 'Visit not found' });
    }

    const labRequest = visit.labRequests.id(req.params.labId);
    if (!labRequest) {
      return res.status(404).json({ status: 'fail', message: 'Lab request not found' });
    }

    // Specimen tracking update
    labRequest.specimenStatus = specimenStatus || 'COLLECTED';
    if (specimenType) labRequest.specimenType = specimenType;
    if (specimenIdentifier) labRequest.specimenIdentifier = specimenIdentifier;

    if (specimenStatus === 'COLLECTED' || specimenStatus === 'ACCEPTED') {
      labRequest.collectionDate = new Date();
      labRequest.collector = req.user.id;
      labRequest.status = 'SAMPLE_COLLECTED';
    } else if (specimenStatus === 'REJECTED') {
      labRequest.rejectionReason = rejectionReason || 'Specimen rejected';
      labRequest.status = 'REJECTED';
    }

    await visit.save();

    res.status(200).json({
      status: 'success',
      data: visit
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
// @desc    Add lab requests to a visit (Doctor)
// @route   POST /api/v1/visits/:id/lab-requests
// @access  Private (Doctor, Admin)
exports.addLabRequest = async (req, res, next) => {
  try {
    const { labTestId, testName, notes } = req.body;

    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        status: 'fail',
        message: 'Visit not found'
      });
    }

    let finalTestName = testName;
    let catalogTestId = null;

    // If labTestId is provided, pull testName from catalog
    if (labTestId) {
      const catalogTest = await LabTest.findById(labTestId);
      if (catalogTest) {
        finalTestName = catalogTest.name;
        catalogTestId = catalogTest._id;
      }
    }

    if (!finalTestName) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide either a valid labTestId or testName'
      });
    }

    visit.labRequests.push({
      labTest: catalogTestId,
      testName: finalTestName,
      notes,
      requestedBy: req.user.id,
      status: 'PENDING'
    });

    visit.status = 'WAITING_LAB';

    const updatedVisit = await visit.save();

    res.status(200).json({
      status: 'success',
      data: updatedVisit
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update lab test result (Lab Tech / Admin)
// @route   PATCH /api/v1/visits/:id/lab-requests/:labId
// @access  Private (Lab Tech, Admin)
// @desc    Enter lab results / Save draft / Verify (Lab Tech / Admin)
// @route   PATCH /api/v1/visits/:id/lab-requests/:labId
// @access  Private (Lab Tech, Admin)
exports.updateLabResult = async (req, res, next) => {
  try {
    const { result, unit, referenceRange, notes, isDraft, isAbnormal, isCritical, verify } = req.body;

    const visit = await Visit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ status: 'fail', message: 'Visit not found' });
    }

    const labRequest = visit.labRequests.id(req.params.labId);
    if (!labRequest) {
      return res.status(404).json({ status: 'fail', message: 'Lab request not found' });
    }

    // Result entry
    if (result !== undefined) labRequest.result = result;
    if (unit !== undefined) labRequest.unit = unit;
    if (referenceRange !== undefined) labRequest.referenceRange = referenceRange;
    if (notes !== undefined) labRequest.notes = notes;
    if (isAbnormal !== undefined) labRequest.isAbnormal = isAbnormal;
    if (isCritical !== undefined) labRequest.isCritical = isCritical;

    labRequest.performedBy = req.user.id;

    if (isDraft) {
      labRequest.isDraft = true;
      labRequest.status = 'IN_PROGRESS';
    } else if (verify) {
      // Result verification (Section 5 & 6)
      labRequest.isDraft = false;
      labRequest.status = 'COMPLETED';
      labRequest.verifiedBy = req.user.id;
      labRequest.verifiedAt = new Date();
      labRequest.completedAt = new Date();
    } else {
      labRequest.isDraft = false;
      labRequest.status = 'PENDING_VERIFICATION';
    }

    // Check if all lab requests for this visit are completed
    const allCompleted = visit.labRequests.every(
      (req) => req.status === 'COMPLETED' || req.status === 'CANCELLED'
    );

    if (allCompleted) {
      visit.status = 'WAITING_DOCTOR'; // Auto-deliver results back to clinician
    }

    await visit.save();

    res.status(200).json({
      status: 'success',
      data: visit
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
// @desc    Update payment status for a visit
// @route   PATCH /api/v1/visits/:id/pay
// @access  Private (Reception, Cashier, Admin)
// @desc    Update visit payment status and progress visit
// @route   PATCH /api/v1/visits/:id/pay
// @access  Private (RECEPTION, ADMIN)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({ status: 'error', message: 'Visit not found' });
    }

    // Update visit status to proceed to triage/doctor queue after payment
    visit.status = req.body.status || 'PENDING_TRIAGE';
    await visit.save();

    // Also update any linked invoice document payment status to PAID
    await Document.findOneAndUpdate(
      { visit: visit._id, docType: 'INVOICE' },
      { 'invoiceDetails.paymentStatus': 'PAID' },
      { new: true }
    );

    const updatedVisit = await Visit.findById(visit._id).populate('patient');

    res.status(200).json({
      status: 'success',
      data: updatedVisit
    });
  } catch (error) {
    console.error('Update Payment Status Error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Server error updating payment status' });
  }
};
// @desc    Get Nurse Treatment Worklist (Eligible in-house tasks)
// @route   GET /api/v1/visits/nurse/worklist
// @access  Private (Nurse, Admin)
exports.getNurseWorklist = async (req, res) => {
  try {
    const visits = await Visit.find({
      'paymentStatus.treatmentFeePaid': true,
      'clinicalNotes.prescription.prescriptionType': 'IN_HOUSE'
    })
      .populate('patient', 'firstName lastName MRN dateOfBirth gender')
      .populate('assignedDoctor', 'fullName username')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: visits.length,
      data: visits
    });
  } catch (error) {
    console.error('Error fetching nurse worklist:', error);
    res.status(500).json({ status: 'error', message: 'Server error fetching worklist' });
  }
};

// @desc    Update treatment task status (Refusal, Omission, Adverse Event, Escalation, Completed)
// @route   PATCH /api/v1/visits/:id/treatment-status
// @access  Private (Nurse, Admin)
// @desc    Record a daily administration session for multi-day or single treatment tasks
// @route   PATCH /api/v1/visits/:id/treatment-status
// @access  Private (Nurse, Admin)
exports.updateTreatmentTaskStatus = async (req, res) => {
  try {
    const visitId = req.params.id.replace(/['"\\]/g, '').trim();
    const { prescriptionId, status, notes, quantityToDeduct, escalationReason, adverseEventDetails } = req.body;

    const allowedStatuses = ['ADMINISTERED', 'COMPLETED', 'REFUSED', 'OMITTED', 'ADVERSE_EVENT', 'ESCALATED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400);
    }

    const visit = await Visit.findById(visitId);
    if (!visit) {
      return res.status(404).json({ status: 'fail', message: 'Visit not found' });
    }

    const prescriptions = visit.clinicalNotes?.prescription || [];
    const item = prescriptions.id ? prescriptions.id(prescriptionId) : prescriptions.find(p => p._id.toString() === prescriptionId);

    if (!item) {
      return res.status(404).json({ status: 'fail', message: 'Prescription task not found' });
    }

    // Initialize dosesRequired if not set (default to 1 or parse from duration/quantity)
    if (!item.dosesRequired) item.dosesRequired = parseInt(item.quantity, 10) || 1;
    if (!item.administrationLogs) item.administrationLogs = [];

    const sessionNumber = item.administrationLogs.length + 1;
    const deductionQty = parseInt(quantityToDeduct, 10) || 1;

    // Deduct stock ONLY if the session status indicates successful administration/completion
    if (status === 'ADMINISTERED' || status === 'COMPLETED') {
      const stockItem = await Stock.findOne({
        name: { $regex: new RegExp(`^${item.medicationName}$`, 'i') }
      });

      if (stockItem) {
        if (stockItem.quantity < deductionQty) {
          return res.status(400).json({
            status: 'fail',
            message: `Insufficient stock for ${item.medicationName}. Available: ${stockItem.quantity}, Required: ${deductionQty}`
          });
        }
        stockItem.quantity -= deductionQty;
        await stockItem.save();
      }

      item.dosesCompleted = (item.dosesCompleted || 0) + 1;
    }

    // Push this specific day's session into the audit log
    item.administrationLogs.push({
      sessionNumber,
      administeredBy: req.user?.id,
      administeredAt: new Date(),
      status,
      notes: notes || '',
      quantityDeducted: (status === 'ADMINISTERED' || status === 'COMPLETED') ? deductionQty : 0
    });

    // Update overall dispensation status
    if (item.dosesCompleted >= item.dosesRequired || status === 'COMPLETED') {
      item.dispensationStatus = 'COMPLETED';
    } else if (status === 'REFUSED') {
      item.dispensationStatus = 'REFUSED';
    } else if (status === 'ESCALATED') {
      item.dispensationStatus = 'ESCALATED';
    } else {
      item.dispensationStatus = 'PARTIALLY_DISPENSED';
    }

    if (escalationReason) item.escalationReason = escalationReason;
    if (adverseEventDetails) item.adverseEventDetails = adverseEventDetails;

    visit.markModified('clinicalNotes');
    await visit.save();

    res.status(200).json({
      status: 'success',
      message: `Day ${sessionNumber} treatment session recorded successfully (${item.dosesCompleted}/${item.dosesRequired} doses completed)`,
      data: visit
    });
  } catch (error) {
    console.error('Error recording treatment session:', error);
    res.status(500).json({ status: 'error', message: 'Server error recording treatment session' });
  }
};
// @desc    Record follow-up care and schedules
// @route   PATCH /api/v1/visits/:id/follow-up
// @access  Private (Nurse, Admin)
exports.recordFollowUpCare = async (req, res) => {
  try {
    const visitId = req.params.id.replace(/['"\\]/g, '').trim();
    const { attendanceStatus, vitalsRecorded, treatmentProvided, clinicalObservations, nextPlannedAction, scheduledDate } = req.body;

    const visit = await Visit.findById(visitId);
    if (!visit) {
      return res.status(404).json({ status: 'fail', message: 'Visit not found' });
    }

    visit.followUpCare = {
      scheduledDate: scheduledDate || visit.followUpCare?.scheduledDate,
      attendanceStatus: attendanceStatus || 'ATTENDED',
      vitalsRecorded: vitalsRecorded || {},
      treatmentProvided: treatmentProvided || '',
      clinicalObservations: clinicalObservations || '',
      nextPlannedAction: nextPlannedAction || '',
      recordedBy: req.user?.id,
      updatedAt: new Date()
    };

    await visit.save();

    res.status(200).json({
      status: 'success',
      message: 'Follow-up care recorded successfully',
      data: visit
    });
  } catch (error) {
    console.error('Error recording follow-up care:', error);
    res.status(500).json({ status: 'error', message: 'Server error recording follow-up care' });
  }
};
// @desc    Get consolidated unified bill summary for a visit
// @route   GET /api/v1/visits/:id/bill-summary
// @access  Private (Cashier, Reception, Admin)
exports.getVisitBillSummary = async (req, res) => {
  try {
    const visitId = req.params.id.replace(/['"\\]/g, '').trim();
    const visit = await Visit.findById(visitId)
      .populate('patient', 'firstName lastName MRN')
      .populate('assignedDoctor', 'fullName username');

    if (!visit) {
      return res.status(404).json({ status: 'fail', message: 'Visit not found' });
    }

    // Calculate or aggregate charges (you can customize standard fees or fetch from items)
    const regFee = visit.paymentStatus?.registrationFee || 50; // Example standard fee
    const labTotal = visit.paymentStatus?.labFeeTotal || 0;
    const treatmentTotal = visit.paymentStatus?.treatmentFeeTotal || 0;
    const totalDue = (visit.paymentStatus?.registrationPaid ? 0 : regFee) + labTotal + treatmentTotal;

    res.status(200).json({
      status: 'success',
      data: {
        visitId: visit._id,
        patient: visit.patient,
        paymentStatus: visit.paymentStatus,
        breakdown: {
          registrationFee: regFee,
          labFeeTotal: labTotal,
          treatmentFeeTotal: treatmentTotal,
          totalDue
        }
      }
    });
  } catch (error) {
    console.error('Error fetching bill summary:', error);
    res.status(500).json({ status: 'error', message: 'Server error fetching bill summary' });
  }
};
// @desc    Process final checkout, settle bill, and generate receipt
// @route   PATCH /api/v1/visits/:id/checkout
// @access  Private (Cashier, Reception, Admin)
exports.processVisitCheckout = async (req, res) => {
  try {
    const visitId = req.params.id.replace(/['"\\]/g, '').trim();
    const { paymentMethod, amountPaid } = req.body;

    const visit = await Visit.findById(visitId);
    if (!visit) {
      return res.status(404).json({ status: 'fail', message: 'Visit not found' });
    }

    // Update payment gates to fully paid
    visit.paymentStatus.registrationPaid = true;
    visit.paymentStatus.labFeePaid = true;
    visit.paymentStatus.treatmentFeePaid = true;
    visit.paymentStatus.totalAmountPaid = amountPaid || visit.paymentStatus.totalAmountDue || 0;
    visit.paymentStatus.paymentMethod = paymentMethod || 'CASH';
    visit.paymentStatus.settledAt = new Date();
    visit.paymentStatus.settledBy = req.user?.id;
    visit.paymentStatus.isVisitClosed = true;
    visit.status = 'COMPLETED';

    await visit.save();

    res.status(200).json({
      status: 'success',
      message: 'Visit checked out and settlement receipt generated successfully',
      receipt: {
        receiptNumber: `REC-${visit._id.toString().substring(12).toUpperCase()}`,
        date: visit.paymentStatus.settledAt,
        paymentMethod: visit.paymentStatus.paymentMethod,
        amountPaid: visit.paymentStatus.totalAmountPaid,
        status: 'PAID & CLOSED'
      },
      data: visit
    });
  } catch (error) {
    console.error('Error processing checkout:', error);
    res.status(500).json({ status: 'error', message: 'Server error processing checkout' });
  }
};