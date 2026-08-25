const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { isDbConnected } = require('../config/db');

// In-memory demo store for offline/local evaluation when MongoDB is not active
const inMemoryUsers = [
  {
    _id: '66c8b0010000000000000001',
    name: 'Rajesh Sharma (Admin)',
    email: 'admin@legalmetrix.gov.in',
    password: 'Admin@123',
    role: 'ADMIN',
    badgeNumber: 'LM-ADM-001',
    jurisdiction: 'National Headquarters - New Delhi',
    department: 'Department of Consumer Affairs, Legal Metrology Division',
    active: true,
  },
  {
    _id: '66c8b0010000000000000002',
    name: 'Inspector Vikram Singh',
    email: 'officer@legalmetrix.gov.in',
    password: 'Officer@123',
    role: 'OFFICER',
    badgeNumber: 'LM-OFF-742',
    jurisdiction: 'Delhi NCR Enforcement Division',
    department: 'Department of Consumer Affairs, Legal Metrology Division',
    active: true,
  },
  {
    _id: '66c8b0010000000000000003',
    name: 'Dr. Ananya Iyer (Supervisor)',
    email: 'supervisor@legalmetrix.gov.in',
    password: 'Supervisor@123',
    role: 'SUPERVISOR',
    badgeNumber: 'LM-SUP-108',
    jurisdiction: 'Northern Regional Zone',
    department: 'Department of Consumer Affairs, Legal Metrology Division',
    active: true,
  },
];

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public (or Admin only for elevated roles)
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, badgeNumber, jurisdiction } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password.',
      });
    }

    if (isDbConnected()) {
      // Check if user already exists
      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email address already exists in LegalMetrix.',
        });
      }

      // Create user in DB
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: role || 'OFFICER',
        badgeNumber: badgeNumber || `LM-${Math.floor(1000 + Math.random() * 9000)}`,
        jurisdiction: jurisdiction || 'National / Central Zone',
      });

      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          badgeNumber: user.badgeNumber,
          jurisdiction: user.jurisdiction,
          active: user.active,
          token,
        },
      });
    }

    // In-memory fallback
    const existing = inMemoryUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    const newUser = {
      _id: `66c8b001000000000000000${inMemoryUsers.length + 1}`,
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'OFFICER',
      badgeNumber: badgeNumber || `LM-${Math.floor(1000 + Math.random() * 9000)}`,
      jurisdiction: jurisdiction || 'National / Central Zone',
      active: true,
    };
    inMemoryUsers.push(newUser);
    const token = generateToken(newUser._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully (In-Memory)',
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        badgeNumber: newUser.badgeNumber,
        jurisdiction: newUser.jurisdiction,
        active: newUser.active,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const user = await User.findOne({ email: cleanEmail }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. User not found.',
        });
      }

      if (!user.active) {
        return res.status(403).json({
          success: false,
          message: 'Your account is deactivated. Contact the Legal Metrology Administrator.',
        });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Password incorrect.',
        });
      }

      const token = generateToken(user._id);

      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          badgeNumber: user.badgeNumber,
          jurisdiction: user.jurisdiction,
          active: user.active,
          token,
        },
      });
    }

    // In-memory authentication fallback
    const memUser = inMemoryUsers.find((u) => u.email === cleanEmail);
    if (!memUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    if (memUser.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.',
      });
    }

    const token = generateToken(memUser._id);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      data: {
        _id: memUser._id,
        name: memUser.name,
        email: memUser.email,
        role: memUser.role,
        badgeNumber: memUser.badgeNumber,
        jurisdiction: memUser.jurisdiction,
        active: memUser.active,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user details
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    if (req.user) {
      return res.status(200).json({
        success: true,
        data: req.user,
      });
    }

    return res.status(404).json({
      success: false,
      message: 'User profile not found',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Seed or reset default demo accounts (Admin, Officer, Supervisor)
 * @route   POST /api/auth/seed
 * @access  Public (Dev/Demo convenience)
 */
const seedDemoUsers = async (req, res, next) => {
  try {
    const demoUsers = [
      {
        name: 'Rajesh Sharma (Admin)',
        email: 'admin@legalmetrix.gov.in',
        password: 'Admin@123',
        role: 'ADMIN',
        badgeNumber: 'LM-ADM-001',
        jurisdiction: 'National Headquarters - New Delhi',
      },
      {
        name: 'Inspector Vikram Singh',
        email: 'officer@legalmetrix.gov.in',
        password: 'Officer@123',
        role: 'OFFICER',
        badgeNumber: 'LM-OFF-742',
        jurisdiction: 'Delhi NCR Enforcement Division',
      },
      {
        name: 'Dr. Ananya Iyer (Supervisor)',
        email: 'supervisor@legalmetrix.gov.in',
        password: 'Supervisor@123',
        role: 'SUPERVISOR',
        badgeNumber: 'LM-SUP-108',
        jurisdiction: 'Northern Regional Zone',
      },
    ];

    const results = [];

    for (const u of demoUsers) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = await User.create(u);
        results.push({ email: u.email, status: 'Created', role: u.role });
      } else {
        // Reset password to guarantee testing works
        user.password = u.password;
        user.active = true;
        user.name = u.name;
        user.badgeNumber = u.badgeNumber;
        user.jurisdiction = u.jurisdiction;
        await user.save();
        results.push({ email: u.email, status: 'Updated/Synced', role: u.role });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Demo users seeded successfully for SIH evaluation',
      results,
      credentials: [
        { role: 'ADMIN', email: 'admin@legalmetrix.gov.in', password: 'Admin@123' },
        { role: 'OFFICER', email: 'officer@legalmetrix.gov.in', password: 'Officer@123' },
        { role: 'SUPERVISOR', email: 'supervisor@legalmetrix.gov.in', password: 'Supervisor@123' },
      ],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get demo credentials list
 * @route   GET /api/auth/demo-credentials
 * @access  Public
 */
const getDemoCredentials = (req, res) => {
  res.status(200).json({
    success: true,
    data: [
      { role: 'OFFICER', name: 'Inspector Vikram Singh', email: 'officer@legalmetrix.gov.in', password: 'Officer@123', description: 'Conducts inspections, scans packaging, reviews AI findings.' },
      { role: 'SUPERVISOR', name: 'Dr. Ananya Iyer', email: 'supervisor@legalmetrix.gov.in', password: 'Supervisor@123', description: 'Monitors regional non-compliances, reviews officer findings and analytics.' },
      { role: 'ADMIN', name: 'Rajesh Sharma', email: 'admin@legalmetrix.gov.in', password: 'Admin@123', description: 'Manages officers, compliance rules, and system configuration.' },
    ],
  });
};

module.exports = {
  register,
  login,
  getMe,
  seedDemoUsers,
  getDemoCredentials,
};
