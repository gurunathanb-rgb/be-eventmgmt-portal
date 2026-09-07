
const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    subject: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      enum: [
        'Booking',
        'Payment',
        'Ticket',
        'Event',
        'Account',
        'Technical',
        'Other'
      ],
      default: 'Other'
    },

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: [
        'Open',
        'In Progress',
        'Resolved',
        'Closed'
      ],
      default: 'Open'
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
  'SupportTicket',
  supportTicketSchema,
  'supportTickets'
);

