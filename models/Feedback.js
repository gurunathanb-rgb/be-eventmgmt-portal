
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    comment: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: [
        'Visible',
        'Hidden',
        'Flagged'
      ],
      default: 'Visible'
    },

    adminResponse: {
      type: String,
      default: ''
    },

    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    respondedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'Feedback',
  feedbackSchema,
  'feedback'
);
