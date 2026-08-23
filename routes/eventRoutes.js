const express = require('express');

const router = express.Router();

const eventController = require('../controllers/eventController');

const {
  protect,
  authorize
} = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');


// ============================================================
// PUBLIC APPROVED EVENTS
// ============================================================

router.get(
  '/',
  eventController.getAllApprovedEvents
);


// ============================================================
// ORGANIZER / ADMIN EVENTS
// ============================================================

router.get(
  '/my-events',
  protect,
  authorize('organizer', 'admin'),
  eventController.getMyEvents
);


// ============================================================
// CREATE EVENT
// ============================================================

router.post(
  '/create',
  protect,
  authorize('organizer', 'admin'),

  upload.fields([
    {
      name: 'image',
      maxCount: 1
    },
    {
      name: 'video',
      maxCount: 1
    }
  ]),

  eventController.createEventListing
);


// ============================================================
// EDIT EVENT
// ============================================================

router.put(
  '/:id/edit',

  protect,
  authorize('organizer', 'admin'),

  upload.fields([
    {
      name: 'image',
      maxCount: 1
    },
    {
      name: 'video',
      maxCount: 1
    }
  ]),

  eventController.updateEvent
);


// ============================================================
// UPDATE EVENT SCHEDULE
// ============================================================

router.put(
  '/:id/schedule',

  protect,
  authorize('organizer', 'admin'),

  eventController.updateEventSchedule
);


// ============================================================
// MONTHLY REVENUE ANALYTICS
// ============================================================

router.get(
  '/monthly-analytics',

  protect,
  authorize('organizer', 'admin'),

  eventController.getMonthOverMonthRevenue
);


// ============================================================
// EVENT SALES ANALYTICS
// ============================================================

router.get(
  '/sales-analytics',

  protect,
  authorize('organizer', 'admin'),

  eventController.getEventSalesAnalytics
);


module.exports = router;