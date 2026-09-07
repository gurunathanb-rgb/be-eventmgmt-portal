const SupportTicket = require('../models/SupportTicket');

// CREATE SUPPORT TICKET
exports.createSupportTicket = async (req, res) => {
  try {
    const { subject, category, priority, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        message: 'Subject and message are required'
      });
    }

    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject: subject.trim(),
      category: category || 'Other',
      priority: priority || 'Medium',
      message: message.trim()
    });

    const createdTicket = await SupportTicket.findById(ticket._id)
      .populate('user', 'name email');

    res.status(201).json({
      message: 'Support ticket submitted successfully',
      ticket: createdTicket
    });
  } catch (error) {
    console.error('Create Support Ticket Error:', error);
    res.status(500).json({
      message: error.message
    });
  }
};

// GET LOGGED-IN USER'S SUPPORT TICKETS
exports.getMySupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({
      user: req.user._id
    })
      .populate('respondedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error('Get My Support Tickets Error:', error);
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = exports;