const Patient = require('../models/Patient');
const Visit = require('../models/Visit');

// @desc    Register a new patient
// @route   POST /api/v1/patients
// @access  Private (RECEPTION, ADMIN)
exports.registerPatient = async (req, res) => {
  try {
    const { fullName, age, gender, phone, address, bloodGroup } = req.body;

    const patient = await Patient.create({
      fullName,
      age,
      gender,
      phone,
      address,
      bloodGroup: bloodGroup || 'Unknown',
      registeredBy: req.user._id // Attached from JWT authentication middleware
    });

    res.status(201).json({
      status: 'success',
      data: patient
    });
  } catch (error) {
    console.error('Patient Registration Error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Server error registering patient' });
  }
};

// @desc    Get all patients
// @route   GET /api/v1/patients
// @access  Private (RECEPTION, DOCTOR, NURSE, ADMIN)
exports.getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: patients.length,
      data: patients
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Server error fetching patients' });
  }
};

// @desc    Get single patient by ID
// @route   GET /api/v1/patients/:id
// @access  Private
exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ status: 'fail', message: 'Patient not found' });
    }

    res.status(200).json({
      status: 'success',
      data: patient
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Server error fetching patient' });
  }
};
// @desc    Get complete longitudinal EMR history for a patient
// @route   GET /api/v1/patients/:id/emr-history
// @access  Private (Doctor, Nurse, Admin)
exports.getPatientEMRHistory = async (req, res) => {
  try {
    const patientId = req.params.id.replace(/['"\\]/g, '').trim();

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ status: 'fail', message: 'Patient not found' });
    }

    const visitHistory = await Visit.find({ patient: patientId })
      .populate('assignedDoctor', 'fullName username specialty')
      .populate('labRequests.labTest', 'testName category referenceRange')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: visitHistory.length,
      patient: {
        id: patient._id,
        MRN: patient.MRN,
        fullName: patient.fullName,
        age: patient.age,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies || []
      },
      visitHistory
    });
  } catch (error) {
    console.error('Error fetching patient EMR history:', error);
    res.status(500).json({ status: 'error', message: 'Server error fetching EMR history' });
  }
};