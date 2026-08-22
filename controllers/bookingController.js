const { STRIPE_SECRET_KEY } = require('../utils/config');
const stripe = require('stripe')(STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const { sendTicketConfirmation } = require('../utils/emailService');

exports.checkoutTicketSession = async (req, res) => {
  try {
    const { eventId, tierName, quantity, attendeeDetails } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const tier = event.ticketTiers.find(t => t.tierName === tierName);
    if (!tier) return res.status(400).json({ message: 'Invalid ticket tier level selected' });

    if (tier.capacity - tier.sold < quantity) {
      return res.status(400).json({ message: 'Requested quantity exceeds remaining ticket capacity count' });
    }

    const calculatedTotal = tier.price * quantity;

    // Create a payment intent on Stripe using the total cost
    const paymentIntent = await stripe.paymentIntents.create({
      amount: calculatedTotal * 100, // Stripe expects amounts in smallest currency unit (paise/cents)
      currency: 'inr',
      metadata: { userId: req.user._id.toString(), eventId, tierName, quantity: quantity.toString() }
    });

    // Create a pending booking inside MongoDB
    const booking = await Booking.create({
      user: req.user._id,
      event: eventId,
      attendeeDetails,
      ticketTierName: tierName,
      quantity,
      totalPaid: calculatedTotal,
      stripeSessionId: paymentIntent.id,
      paymentStatus: 'pending'
    });

    res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      bookingId: booking._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.confirmPaymentWebhook = async (req, res) => {
  let stripeEvent;
  try {
    // 🌟 FIX: Safe verification checking parsing states preventing internal runtime crashes
    if (typeof req.body === 'string') {
      stripeEvent = JSON.parse(req.body);
    } else if (req.body && req.body.type) {
      stripeEvent = req.body;
    } else {
      throw new Error("Invalid or empty request body payload");
    }
  } catch (err) {
    return res.status(400).send(`Simulation parsing error: ${err.message}`);
  }

  // Handle the test checkout event
  if (stripeEvent.type === 'payment_intent.succeeded') {
    const intent = stripeEvent.data.object;

    // Find and update the booking status to 'paid'
    const booking = await Booking.findOne({ stripeSessionId: intent.id }).populate('event');
    
    if (booking) {
      // 🌟 OPTIMIZATION: Prevent duplicated webhook execution loops re-adding seats
      if (booking.paymentStatus === 'paid') {
        return res.json({ received: true, message: 'Booking already verified as paid.' });
      }

      booking.paymentStatus = 'paid';
      await booking.save();

      // Deduct the seat/ticket from the event's availability limits
      const event = await Event.findById(booking.event._id);
      if (event) {
        const tier = event.ticketTiers.find(t => t.tierName === booking.ticketTierName);
        if (tier) {
          tier.sold += booking.quantity;
          await event.save();
        }
      }

      // Send the automated confirmation email
      try {
        if (typeof sendTicketConfirmation === 'function') {
          await sendTicketConfirmation(booking.attendeeDetails.email, {
            name: booking.attendeeDetails.fullName,
            eventTitle: event ? event.title : 'Event Pass',
            tier: booking.ticketTierName,
            quantity: booking.quantity,
            totalPaid: booking.totalPaid,
            paymentId: intent.id
          });
        }
      } catch (emailError) {
        console.log("Email dispatch skipped (Verify your SMTP settings in .env):", emailError.message);
      }
    }
  }

  res.json({ received: true, simulationMode: true });
};

exports.cancelOrTransferBooking = async (req, res) => {
  try {
    const { action, targetEmail } = req.body; // action: 'cancel' or 'transfer'
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Booking reference not found' });
    
    // 🌟 FIX: Lock down mutations if the ticket status is already modified
    if (booking.bookingStatus !== 'active') {
      return res.status(400).json({ message: `Cannot modify this ticket. Status is already ${booking.bookingStatus}` });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized permission over booking record' });
    }

    if (action === 'cancel') {
      booking.bookingStatus = 'cancelled';
      
      // Credit capacity back to the event tier availability pools
      const event = await Event.findById(booking.event);
      if (event) {
        const tier = event.ticketTiers.find(t => t.tierName === booking.ticketTierName);
        if (tier) {
          tier.sold = Math.max(0, tier.sold - booking.quantity);
          await event.save();
        }
      }
      await booking.save();
      return res.json({ message: 'Ticket cancelled successfully', booking });
    } 
    
    if (action === 'transfer') {
      if (!targetEmail) return res.status(400).json({ message: 'Recipient email address parameter required' });

      const recipient = await User.findOne({ email: targetEmail.toLowerCase().trim() });
      if (!recipient) return res.status(404).json({ message: 'Recipient email profile matching user instance not found' });

      if (recipient._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'Cannot transfer a ticket to yourself' });
      }

      booking.transferredTo = recipient._id;
      booking.bookingStatus = 'transferred';
      await booking.save();

      // Instantiates equivalent cloned ticket tracking under recipient identity block
      await Booking.create({
        user: recipient._id,
        event: booking.event,
        attendeeDetails: { fullName: recipient.name, email: recipient.email },
        ticketTierName: booking.ticketTierName,
        quantity: booking.quantity,
        totalPaid: 0, // Transferred target values evaluation tracking standardizes balances to 0
        stripeSessionId: `TRANSFER-${booking.stripeSessionId}-${Date.now()}`,
        paymentStatus: 'paid',
        bookingStatus: 'active'
      });

      return res.json({ message: 'Ticket ownership record transferred successfully', booking });
    }

    res.status(400).json({ message: 'Invalid action parameters payload mapping criteria' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserDashboard = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate('event');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
