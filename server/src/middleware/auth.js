const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isDbConnected } = require('../config/db');

// Fallback users for in-memory / testing
const fallbackUsers = {
  '66c8b0010000000000000001': {
    _id: '66c8b0010000000000000001',
    name: 'Rajesh Sharma (Admin)',
    email: 'admin@legalmetrix.gov.in',
    role: 'ADMIN',
    badgeNumber: 'LM-ADM-001',
    jurisdiction: 'National Headquarters - New Delhi',
    department: 'Department of Consumer Affairs, Legal Metrology Division',
    active: true,
  },
  '66c8b0010000000000000002': {
    _id: '66c8b0010000000000000002',
    name: 'Inspector Vikram Singh',
    email: 'officer@legalmetrix.gov.in',
    role: 'OFFICER',
    badgeNumber: 'LM-OFF-742',
    jurisdiction: 'Delhi NCR Enforcement Division',
    department: 'Department of Consumer Affairs, Legal Metrology Division',
    active: true,
  },
  '66c8b0010000000000000003': {
    _id: '66c8b0010000000000000003',
    name: 'Dr. Ananya Iyer (Supervisor)',
    email: 'supervisor@legalmetrix.gov.in',
    role: 'SUPERVISOR',
    badgeNumber: 'LM-SUP-108',
    jurisdiction: 'Northern Regional Zone',
    department: 'Department of Consumer Affairs, Legal Metrology Division',
    active: true,
  },
};

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'legalmetrix_sih_super_secure_jwt_secret_key_2024_packaged_compliance'
      );

      let user = null;

      if (isDbConnected()) {
        user = await User.findById(decoded.id).select('-password');
        if (!user && decoded.email) {
          user = await User.findOne({ email: decoded.email }).select('-password');
        }
        if (!user && fallbackUsers[decoded.id]) {
          user = fallbackUsers[decoded.id];
        }
      } else {
        user = fallbackUsers[decoded.id] || {
          _id: decoded.id,
          name: decoded.name || 'Demo Enforcement Officer',
          email: decoded.email || 'officer@legalmetrix.gov.in',
          role: decoded.role || 'OFFICER',
          active: true,
        };
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User account associated with this token no longer exists.',
        });
      }

      if (!user.active) {
        return res.status(403).json({
          success: false,
          message: 'This user account has been deactivated. Please contact an Administrator.',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('[Auth Middleware] Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token. Please log in again.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided in Authorization header.',
    });
  }
};

module.exports = { protect };
