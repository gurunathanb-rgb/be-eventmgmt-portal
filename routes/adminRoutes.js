const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All endpoints in this module are hard-locked exclusively to the 'admin' account role
router.get('/pending', protect, authorize('admin'), adminController.getPendingListings);
router.put('/review/:id', protect, authorize('admin'), adminController.reviewPendingListings);
router.get('/analytics', protect, authorize('admin'), adminController.getPlatformAnalytics);

module.exports = router;