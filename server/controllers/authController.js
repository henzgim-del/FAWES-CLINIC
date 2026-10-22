const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register a new user (Admin use)
// @route   POST /api/v1/auth/register
// @access  Private/Admin (or initial setup)
exports.registerUser = async (req, res) => {
  try {
    const { fullName, username, email, phone, password, role } = req.body;

    // Check if user already exists by username or phone
    const userExists = await User.findOne({ $or: [{ username }, { phone }] });
    if (userExists) {
      return res.status(400).json({ status: 'fail', message: 'User with this username or phone already exists' });
    }

    // Create user
    const user = await User.create({
      fullName,
      username,
      email,
      phone,
      password,
      role
    });

    if (user) {
      res.status(201).json({
        status: 'success',
        data: {
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          role: user.role,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(400).json({ status: 'fail', message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/v1/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide username and password' });
    }

    // Find user and include password field for comparison
    const user = await User.findOne({ username }).select('+password');

    if (user && (await user.matchPassword(password))) {
      if (!user.isActive) {
        return res.status(401).json({ status: 'fail', message: 'Account is deactivated. Contact administrator.' });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.status(200).json({
        status: 'success',
        data: {
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          role: user.role,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({ status: 'fail', message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Server error during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      data: req.user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Server error fetching profile' });
  }
};