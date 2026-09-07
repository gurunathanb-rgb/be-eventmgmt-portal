const Feedback = require('../models/Feedback');
const Booking = require('../models/Booking');

// CREATE FEEDBACK
exports.createFeedback = async (req, res) => {
  try {
    const { booking, rating, comment } = req.body;

    // Validate booking
    if (!booking) {
      return res.status(400).json({
        message: 'Booking is required for feedback'
      });
    }

    // Validate rating
    if (
      !rating ||
      Number(rating) < 1 ||
      Number(rating) > 5
    ) {
      return res.status(400).json({
        message: 'Rating must be between 1 and 5'
      });
    }

    // Validate comment
    if (!comment || !comment.trim()) {
      return res.status(400).json({
        message: 'Feedback comment is required'
      });
    }

    // Find booking belonging to logged-in user
    const userBooking = await Booking.findOne({
      _id: booking,
      user: req.user._id
    });

    if (!userBooking) {
      return res.status(404).json({
        message: 'Booking not found for this user'
      });
    }

    // Feedback only for paid bookings
    if (userBooking.paymentStatus !== 'paid') {
      return res.status(400).json({
        message: 'Feedback can only be submitted for paid bookings'
      });
    }

    // Prevent duplicate feedback
    const existingFeedback = await Feedback.findOne({
      user: req.user._id,
      booking: userBooking._id
    });

    if (existingFeedback) {
      return res.status(409).json({
        message: 'Feedback has already been submitted for this booking'
      });
    }

    // Create feedback using the event from the booking
    const feedback = await Feedback.create({
      user: req.user._id,
      event: userBooking.event,
      booking: userBooking._id,
      rating: Number(rating),
      comment: comment.trim()
    });

    // Return populated feedback
    const createdFeedback = await Feedback.findById(
      feedback._id
    )
      .populate('event', 'title date')
      .populate('booking')
      .populate('user', 'name email');

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: createdFeedback
    });
  } catch (error) {
    console.error(
      'Create Feedback Error:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};

// GET LOGGED-IN USER'S FEEDBACK
exports.getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({
      user: req.user._id
    })
      .populate('event', 'title date')
      .populate('booking')
      .populate('respondedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    console.error('Get My Feedback Error:', error);
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = exports;