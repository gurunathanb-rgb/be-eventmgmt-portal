const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({

  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true },

  event: { type: mongoose.Schema.Types.ObjectId, 
           ref: 'Event', 
           required: true },

  attendeeDetails: {
    fullName: { 
      type: String, 
      required: true },
    email: { 
      type: String, 
      required: true }
  },
  ticketTierName: { 
    type: String, 
    required: true }, // e.g., "VIP"
  quantity: { 
    type: Number, 
    required: true, 
    default: 1 },
  totalPaid: { 
    type: Number, 
    required: true },      // e.g., 500
  
  // 🌟 OPTIMIZATION: Switched to sessionId and removed 'required: true' 
  // so pending bookings can be created before payment completes.
  stripeSessionId: { type: String }, 
  
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed'], 
    default: 'pending' 
  },
  bookingStatus: { 
    type: String, 
    enum: ['active', 'cancelled', 'transferred'], 
    default: 'active' 
  },
  transferredTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Tracks target if transferred
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema, 'bookings');
