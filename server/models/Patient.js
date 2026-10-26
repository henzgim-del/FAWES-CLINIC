const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please add patient full name'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, 'Please add patient age']
  },
 gender: {
  type: String,
  enum: ['Male', 'Female', 'MALE', 'FEMALE', 'male', 'female'],
  required: [true, 'Please specify gender']
},
  phone: {
    type: String,
    required: [true, 'Please add a contact phone number'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },
  registeredBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);