const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verifies JWT token
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user || !req.user.isActive) {
        return res.status(401).json({ status: 'fail', message: 'User not found or account is deactivated' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ status: 'fail', message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ status: 'fail', message: 'Not authorized, no token provided' });
  }
};

// Grant access to specific roles (e.g., 'ADMIN', 'DOCTOR', 'RECEPTION', etc.)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};