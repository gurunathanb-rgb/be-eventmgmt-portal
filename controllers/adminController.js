const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');

// 🌟 ADDITION: Admin route to fetch all pending listings awaiting approval
exports.getPendingListings = async (req, res) => {
  try {
    // Finds events with status 'pending' and populates the creator's user context details
    const pendingEvents = await Event.find({ status: 'pending' })
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 }); // Newest proposals show first

    res.json(pendingEvents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reviewPendingListings = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status validation state' });
    }

    const event = await Event.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!event) return res.status(404).json({ message: 'Target event reference entry not found' });

    res.json({ message: `Event layout changed to state: ${status}`, event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPlatformAnalytics = async (req, res) => {
  try {
    // Aggregation pipeline counting overall revenue metrics
    const financialStats = await Booking.aggregate([
      { $match: { paymentStatus: 'paid', bookingStatus: 'active' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPaid' }, // Verified matching your Booking schema
          ticketsSoldCount: { $sum: '$quantity' }
        }
      }
    ]);

    // Grouping analytics counting registrations by categories dynamically
    const categoryDistribution = await Event.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments({ status: 'approved' });

    res.json({
      metrics: {
        totalRevenue: financialStats[0]?.totalRevenue || 0,
        ticketsSold: financialStats[0]?.ticketsSoldCount || 0,
        registeredUsersCount: totalUsers,
        activeEventsCount: totalEvents
      },
      categoryDistribution
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
