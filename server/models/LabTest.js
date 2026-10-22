const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient reference is required']
  },
  receptionist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: [
      'REGISTERED',
      'WAITING_DOCTOR',
      'IN_CONSULTATION',
      'WAITING_LAB',
      'COMPLETED',
      'CANCELLED'
    ],
    default: 'REGISTERED'
  },
  vitals: {
    temperature: String,
    bloodPressure: String,
    pulseRate: String,
    respiratoryRate: String,
    weight: String,
    recordedAt: Date
  },
  clinicalNotes: {
    diagnosis: String,
    notes: String,
    prescription: [
      {
        medicationName: String,
        dosage: String,
        quantity: String,
        frequency: String,
        duration: String
      }
    ]
  },
  labRequests: [
    {
      labTest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LabTest',
        required: false
      },
      testName: {
        type: String,
        required: true,
        trim: true
      },
      priority: {
        type: String,
        enum: ['ROUTINE', 'URGENT', 'STAT'],
        default: 'ROUTINE'
      },
      // Specimen Management (Section 3)
      specimenType: {
        type: String,
        trim: true
      },
      specimenIdentifier: {
        type: String,
        trim: true
      },
      collectionDate: {
        type: Date
      },
      collector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      specimenStatus: {
        type: String,
        enum: ['PENDING_COLLECTION', 'COLLECTED', 'ACCEPTED', 'REJECTED'],
        default: 'PENDING_COLLECTION'
      },
      rejectionReason: {
        type: String,
        trim: true
      },
      // Order & Result Lifecycle (Sections 1, 2, 5 & 6)
      status: {
        type: String,
        enum: [
          'ORDERED',
          'SAMPLE_COLLECTED',
          'IN_PROGRESS',
          'PENDING_VERIFICATION',
          'VERIFIED',
          'CORRECTED',
          'COMPLETED',
          'CANCELLED',
          'REJECTED'
        ],
        default: 'ORDERED'
      },
      notes: {
        type: String,
        trim: true
      },
      result: {
        type: String,
        trim: true
      },
      unit: {
        type: String,
        trim: true
      },
      referenceRange: {
        type: String,
        trim: true
      },
      isAbnormal: {
        type: Boolean,
        default: false
      },
      isCritical: {
        type: Boolean,
        default: false
      },
      isDraft: {
        type: Boolean,
        default: true
      },
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      requestedAt: {
        type: Date,
        default: Date.now
      },
      verifiedAt: {
        type: Date
      },
      completedAt: {
        type: Date
      }
    }
  ],
  paymentStatus: {
    type: String,
    enum: ['UNPAID', 'PAID', 'AUTHORIZED_EXCEPTION'],
    default: 'UNPAID'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LabTest', labTestSchema);