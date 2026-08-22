const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public catalog search lookup path
router.get('/', eventController.getAllApprovedEvents);

// Organizer or Administrator locked data mutations
router.post('/create', protect, authorize('organizer', 'admin'), eventController.createEventListing);
router.put('/:id/schedule', protect, authorize('organizer', 'admin'), eventController.updateEventSchedule);

// Month-over-month performance aggregation graph pathway
router.get('/monthly-analytics', protect, authorize('organizer', 'admin'), eventController.getMonthOverMonthRevenue);

module.exports = router;

