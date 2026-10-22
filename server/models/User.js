const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please add a full name'],
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Please add a username'],
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    sparse: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number or contact identifier'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false // Do not return password by default in queries
  },
  role: {
    type: String,
    enum: ['RECEPTION', 'DOCTOR', 'NURSE', 'LAB', 'ADMIN'],
    required: [true, 'Please specify a user role']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});
// Encrypt password using bcrypt before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);