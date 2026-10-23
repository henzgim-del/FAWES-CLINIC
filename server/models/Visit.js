const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
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
      'PENDING_TRIAGE',
      'WAITING_DOCTOR',
      'IN_CONSULTATION',
      'WAITING_LAB',
      'COMPLETED',
      'CANCELLED'
    ],
    default: 'REGISTERED'
  },
 paymentStatus: {
  registrationPaid: { type: Boolean, default: false },
  registrationFee: { type: Number, default: 0 },
  labFeePaid: { type: Boolean, default: false },
  labFeeTotal: { type: Number, default: 0 },
  treatmentFeePaid: { type: Boolean, default: false },
  treatmentFeeTotal: { type: Number, default: 0 },
  totalAmountDue: { type: Number, default: 0 },
  totalAmountPaid: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['CASH', 'MOBILE_MONEY', 'CARD', 'INSURANCE', 'UNPAID'], default: 'UNPAID' },
  settledAt: { type: Date },
  settledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isVisitClosed: { type: Boolean, default: false }
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
   prescription: [{

  medicationName: String,
  dosage: String,
  quantity: String,
  frequency: String,
  duration: String,
  prescriptionType: {
    type: String,
    enum: ['IN_HOUSE', 'EXTERNAL'],
    default: 'EXTERNAL'
  },
  dispensationStatus: {
  type: String,
  enum: ['PENDING_PAYMENT', 'PENDING', 'DISPENSED', 'COMPLETED', 'REFUSED', 'OMITTED', 'ADVERSE_EVENT', 'ESCALATED', 'PRINTED'],
  default: 'PENDING_PAYMENT'
},
administeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
administeredAt: { type: Date },
administrationNotes: { type: String },
escalationReason: { type: String },
adverseEventDetails: { type: String },

// Add these fields inside your prescription subdocument schema in Visit.js:
dosesRequired: { type: Number, default: 1 },
dosesCompleted: { type: Number, default: 0 },
administrationLogs: [{
  sessionNumber: { type: Number },
  administeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  administeredAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['ADMINISTERED', 'REFUSED', 'OMITTED', 'ADVERSE_EVENT', 'ESCALATED'],
    default: 'ADMINISTERED'
  },
  notes: { type: String },
  quantityDeducted: { type: Number, default: 1 }
}]
}]
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
  

}, {
  timestamps: true
});

// At the bottom of server/models/Visit.js
if (mongoose.models.Visit) {
  delete mongoose.models.Visit;
}

module.exports = mongoose.model('Visit', visitSchema);