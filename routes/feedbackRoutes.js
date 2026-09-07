const express = require('express');

const router = express.Router();

const feedbackController = require('../controllers/feedbackController');

const { protect } = require('../middleware/authMiddleware');

// User submits feedback
router.post(
  '/',
  protect,
  feedbackController.createFeedback
);

// User views own feedback
router.get(
  '/my',
  protect,
  feedbackController.getMyFeedback
);

module.exports = router;