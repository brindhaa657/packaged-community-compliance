const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  seedDemoUsers,
  getDemoCredentials,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/seed', seedDemoUsers);
router.get('/demo-credentials', getDemoCredentials);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
