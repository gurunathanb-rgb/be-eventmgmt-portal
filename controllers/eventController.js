const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { sendScheduleUpdateNotification } = require('../utils/emailService');

exports.createEventListing = async (req, res) => {
  try {
    const { title, description, detailedDescription, date, time, location, category, ticketTiers, images, videos } = req.body;

    const event = await Event.create({
      title, description, detailedDescription, date, time, location, category,
      ticketTiers, images, videos,
      organizer: req.user._id,
      status: 'pending' // Admin approval required explicitly
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllApprovedEvents = async (req, res) => {
  try {
    const { search, location, category, minPrice, maxPrice, date } = req.query;
    let queryBuilder = { status: 'approved' };

    // Text search filter mapping
    if (search) queryBuilder.title = { $regex: search, $options: 'i' };
    if (location) queryBuilder.location = { $regex: location, $options: 'i' };
    if (category) queryBuilder.category = category;
    
    // 🌟 FIX: Soften date boundaries to search safely within the selected day frame
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      queryBuilder.date = { $gte: searchDate };
    }

    // 🌟 FIX: Switched to $elemMatch to evaluate range filters on the SAME ticket tier
    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      
      queryBuilder.ticketTiers = {
        $elemMatch: { price: priceFilter }
      };
    }

    const events = await Event.find(queryBuilder).populate('organizer', 'name email');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEventSchedule = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Target event reference entry not found' });

    // Validate request context ownership
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden updating foreign timeline' });
    }

    // Append new schedule elements or rebuild arrays
    event.schedule = req.body.schedule; // Expecting complete array payload
    await event.save();

    // Fetch registered users to dispatch email updates
    const bookings = await Booking.find({ event: event._id, bookingStatus: 'active' }).populate('user', 'email');
    
    // 🌟 FIX: Protected loop ensuring an isolated email failure won't halt execution
    bookings.forEach(booking => {
      if (booking.user && booking.user.email) {
        try {
          if (typeof sendScheduleUpdateNotification === 'function') {
            sendScheduleUpdateNotification(booking.user.email, event.title, req.body.schedule[0] || {});
          }
        } catch (emailErr) {
          console.error(`Email delivery fault for address ${booking.user.email}:`, emailErr.message);
        }
      }
    });

    res.json({ message: 'Itinerary schedule saved successfully, alerts dispatched', event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📁 Append this to the absolute bottom of your controllers/eventController.js file:

exports.getMonthOverMonthRevenue = async (req, res) => {
  try {
    const reportPipeline = [
      { $match: { bookingStatus: 'active', paymentStatus: 'paid' } }, // Filter active paid bookings
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          monthlyRevenue: { $sum: '$totalPaid' },
          ticketsSold: { $sum: '$quantity' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ];

    const structuralData = await Booking.aggregate(reportPipeline);
    
    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedData = structuralData.map(item => ({
      monthLabel: `${monthNames[item._id.month]} ${item._id.year}`,
      revenue: item.monthlyRevenue,
      tickets: item.ticketsSold
    }));

    res.json(formattedData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

