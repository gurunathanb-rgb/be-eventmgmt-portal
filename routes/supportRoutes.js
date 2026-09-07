const express = require('express');

const router = express.Router();

const supportController = require('../controllers/supportController');

const { protect } = require('../middleware/authMiddleware');

// User creates support ticket
router.post(
  '/',
  protect,
  supportController.createSupportTicket
);

// User views own support tickets
router.get(
  '/my',
  protect,
  supportController.getMySupportTickets
);

module.exports = router;