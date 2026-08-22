const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// Core payment session triggers and user information collection dashboards
router.post('/checkout', protect, bookingController.checkoutTicketSession);
router.get('/dashboard', protect, bookingController.getUserDashboard);

// Cancellation and secure peer-to-peer recipient ticket reallocations
router.put('/:id/action', protect, bookingController.cancelOrTransferBooking);

// Postman simulation & Stripe event handler verification webhook path
router.post('/webhook', bookingController.confirmPaymentWebhook);

module.exports = router;
