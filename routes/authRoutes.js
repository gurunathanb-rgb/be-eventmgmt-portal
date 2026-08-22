const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public access onboarding entry lanes
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/logout', authController.logoutUser);

// Secure protected identity state lanes
router.put('/profile', protect, authController.updateProfile);

module.exports = router;
