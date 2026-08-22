const mongoose = require('mongoose');

// Sub-schema for detailed session timings and speakers
const scheduleSchema = new mongoose.Schema({
  // 🌟 FIX: Wrapped the session title fields inside a clean, named property
  sessionTitle: {
    type: String,
    required: true
  },
  speakerName: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  }, // e.g., "10:00 AM"
  endTime: {
    type: String,
    required: true
  }    // e.g., "11:30 AM"
});

// Sub-schema for ticket pricing tiers
const ticketTierSchema = new mongoose.Schema({
  tierName: {
    type: String,
    required: true
  }, // e.g., "General Admission", "VIP"
  price: {
    type: Number,
    required: true
  },    // e.g., 200, 500
  capacity: {
    type: Number,
    required: true
  }, // Max tickets available
  sold: {
    type: Number,
    default: 0
  }          // Tracks ticket sales
});

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    }, // Short overview
    detailedDescription: {
      type: String
    },          // Enhanced markdown-ready description
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },    // e.g., "Music", "Tech", "Business"
    images: [{ type: String }],                    // Array of image URLs
    videos: [{ type: String }],                    // Array of video promo URLs
    ticketTiers: [ticketTierSchema],
    schedule: [scheduleSchema],
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema, 'events');