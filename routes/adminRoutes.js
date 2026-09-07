const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All endpoints in this module are hard-locked exclusively to the 'admin' account role
router.get('/pending', protect, authorize('admin'), adminController.getPendingListings);
router.put('/review/:id', protect, authorize('admin'), adminController.reviewPendingListings);
router.get('/analytics', protect, authorize('admin'), adminController.getPlatformAnalytics);
//Export Attendee list
router.get('/events/:eventId/attendees/export',protect, authorize('admin'), adminController.exportEventAttendees)

// Get all support tickets

router.get('/support',protect,authorize('admin'), adminController.getSupportTickets);

// Update support ticket / respond
router.put('/support/:id',protect,authorize('admin'),adminController.updateSupportTicket);

// Get all feedback

router.get('/feedback',protect,authorize('admin'),adminController.getFeedback);


// Update feedback / respond

router.put('/feedback/:id',protect, authorize('admin'),adminController.updateFeedback);


module.exports = router;