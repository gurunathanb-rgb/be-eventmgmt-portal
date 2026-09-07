const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');
const SupportTicket = require('../models/SupportTicket');
const Feedback = require('../models/Feedback');


// ============================================================
// GET PENDING EVENT LISTINGS
// ============================================================

exports.getPendingListings = async (req, res) => {
  try {

    const pendingEvents = await Event.find({
      status: 'pending'
    })
      .populate('organizer', 'name email')
      .sort({
        createdAt: -1
      });

    res.json(pendingEvents);

  } catch (error) {

    console.error(
      'Get Pending Listings Error:',
      error
    );

    res.status(500).json({
      message: error.message
    });

  }
};


// ============================================================
// APPROVE / REJECT EVENT
// ============================================================

exports.reviewPendingListings = async (req, res) => {
  try {

    const {
      status
    } = req.body;


    if (
      !['approved', 'rejected'].includes(status)
    ) {

      return res.status(400).json({
        message:
          'Status must be either approved or rejected'
      });

    }


    const event =
      await Event.findByIdAndUpdate(
        req.params.id,
        {
          status
        },
        {
          new: true,
          runValidators: true
        }
      );


    if (!event) {

      return res.status(404).json({
        message: 'Event not found'
      });

    }


    res.json({

      message:
        `Event ${status} successfully`,

      event

    });

  } catch (error) {

    console.error(
      'Review Event Error:',
      error
    );

    res.status(500).json({
      message: error.message
    });

  }
};


// ============================================================
// PLATFORM ANALYTICS
// ============================================================

exports.getPlatformAnalytics = async (
  req,
  res
) => {

  try {

    // --------------------------------------------------------
    // REVENUE + TICKETS
    // --------------------------------------------------------

    const financialStats =
      await Booking.aggregate([

        {
          $match: {

            paymentStatus: 'paid',

            bookingStatus: 'active'

          }

        },

        {
          $group: {

            _id: null,

            totalRevenue: {
              $sum: '$totalPaid'
            },

            ticketsSoldCount: {
              $sum: '$quantity'
            }

          }

        }

      ]);


    // --------------------------------------------------------
    // EVENT CATEGORY DISTRIBUTION
    // --------------------------------------------------------

    const categoryDistribution =
      await Event.aggregate([

        {
          $match: {
            status: 'approved'
          }

        },

        {
          $group: {

            _id: '$category',

            count: {
              $sum: 1
            }

          }

        },

        {
          $sort: {
            count: -1
          }

        }

      ]);


    // --------------------------------------------------------
    // COUNTS
    // --------------------------------------------------------

    const totalUsers =
      await User.countDocuments();


    const totalEvents =
      await Event.countDocuments({
        status: 'approved'
      });


    const pendingEvents =
      await Event.countDocuments({
        status: 'pending'
      });


    const rejectedEvents =
      await Event.countDocuments({
        status: 'rejected'
      });


    const supportOpen =
      await SupportTicket.countDocuments({
        status: 'Open'
      });


    const feedbackCount =
      await Feedback.countDocuments();


    res.json({

      metrics: {

        totalRevenue:
          financialStats[0]?.totalRevenue || 0,

        ticketsSold:
          financialStats[0]?.ticketsSoldCount || 0,

        registeredUsersCount:
          totalUsers,

        activeEventsCount:
          totalEvents,

        pendingEventsCount:
          pendingEvents,

        rejectedEventsCount:
          rejectedEvents,

        openSupportTickets:
          supportOpen,

        feedbackCount

      },

      categoryDistribution

    });

  } catch (error) {

    console.error(
      'Platform Analytics Error:',
      error
    );

    res.status(500).json({
      message: error.message
    });

  }

};


// ============================================================
// GET APPROVED EVENTS
// ============================================================

exports.getApprovedEvents = async (
  req,
  res
) => {

  try {

    const events =
      await Event.find({
        status: 'approved'
      })
        .populate(
          'organizer',
          'name email'
        )
        .sort({
          createdAt: -1
        })
        .lean();


    // --------------------------------------------------------
    // Add sales information
    // --------------------------------------------------------

    for (const event of events) {

      const sales =
        await Booking.aggregate([

          {
            $match: {

              event:
                event._id,

              paymentStatus:
                'paid',

              bookingStatus:
                'active'

            }

          },

          {
            $group: {

              _id: null,

              ticketsSold: {
                $sum: '$quantity'
              },

              revenue: {
                $sum: '$totalPaid'
              }

            }

          }

        ]);


      event.ticketsSold =
        sales.length
          ? sales[0].ticketsSold
          : 0;


      event.revenue =
        sales.length
          ? sales[0].revenue
          : 0;

    }


    res.json(events);

  } catch (error) {

    console.error(
      'Get Approved Events Error:',
      error
    );

    res.status(500).json({
      message: error.message
    });

  }

};


// ============================================================
// EXPORT EVENT ATTENDEES CSV
// ============================================================

exports.exportEventAttendees = async (
  req,
  res
) => {

  try {

    const {
      eventId
    } = req.params;


    const event =
      await Event.findById(
        eventId
      );


    if (!event) {

      return res.status(404).json({
        message: 'Event not found'
      });

    }


    const bookings =
      await Booking.find({

        event: eventId,

        paymentStatus:
          'paid',

        bookingStatus:
          'active'

      })
        .populate(
          'user',
          'name email'
        )
        .sort({
          createdAt: -1
        });


    const rows = [];


    rows.push([

      'Booking ID',

      'Attendee Name',

      'Attendee Email',

      'User Name',

      'User Email',

      'Ticket Type',

      'Quantity',

      'Total Paid',

      'Payment Status',

      'Booking Status',

      'Booking Date'

    ]);


    bookings.forEach(
      booking => {

        rows.push([

          booking._id,

          booking.attendeeDetails?.fullName ||
            '',

          booking.attendeeDetails?.email ||
            '',

          booking.user?.name ||
            '',

          booking.user?.email ||
            '',

          booking.ticketTierName ||
            '',

          booking.quantity ||
            0,

          booking.totalPaid ||
            0,

          booking.paymentStatus ||
            '',

          booking.bookingStatus ||
            '',

          booking.createdAt
            ? new Date(
                booking.createdAt
              ).toLocaleString(
                'en-IN'
              )
            : ''

        ]);

      }
    );


    const csv =
      rows
        .map(row =>

          row
            .map(value => {

              const text =
                String(
                  value ?? ''
                );

              return `"${text.replace(
                /"/g,
                '""'
              )}"`;

            })
            .join(',')

        )
        .join('\n');


    const safeEventName =
      event.title
        ? event.title
            .replace(
              /[^a-z0-9]/gi,
              '_'
            )
            .toLowerCase()
        : 'event';


    res.setHeader(
      'Content-Type',
      'text/csv; charset=utf-8'
    );


    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeEventName}_attendees.csv"`
    );


    return res
      .status(200)
      .send(csv);

  } catch (error) {

    console.error(
      'Attendee Export Error:',
      error
    );

    return res.status(500).json({

      message:
        'Unable to export attendee list',

      error:
        error.message

    });

  }

};


// ============================================================
// GET ALL SUPPORT TICKETS
// ============================================================

exports.getSupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({})
      .populate('user', 'name email')
      .populate('respondedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tickets);

  } catch (error) {
    console.error(
      'Get Support Tickets Error:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};


// ============================================================
// ADMIN - UPDATE / RESPOND TO SUPPORT TICKET
// ============================================================

exports.updateSupportTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;

    const {
      status,
      adminResponse
    } = req.body;

    const ticket =
      await SupportTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        message: 'Support ticket not found'
      });
    }

    // Validate status if provided
    if (status !== undefined) {

      const validStatuses = [
        'Open',
        'In Progress',
        'Resolved',
        'Closed'
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: 'Invalid support ticket status'
        });
      }

      ticket.status = status;
    }

    // Update admin response
    if (adminResponse !== undefined) {

      ticket.adminResponse =
        adminResponse;

      ticket.respondedBy =
        req.user._id;

      ticket.respondedAt =
        new Date();
    }

    await ticket.save();

    const updatedTicket =
      await SupportTicket.findById(ticket._id)
        .populate('user', 'name email')
        .populate('respondedBy', 'name email');

    res.json({
      message:
        'Support ticket updated successfully',

      ticket: updatedTicket
    });

  } catch (error) {
    console.error(
      'Update Support Ticket Error:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};


// ============================================================
// GET ALL FEEDBACK
// ============================================================

exports.getFeedback = async (req, res) => {
  try {
    const feedback =
      await Feedback.find({})
        .populate('user', 'name email')
        .populate('event', 'title date')
        .populate('booking')
        .populate('respondedBy', 'name email')
        .sort({ createdAt: -1 });

    res.json(feedback);

  } catch (error) {
    console.error(
      'Get Feedback Error:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};


// ============================================================
// UPDATE FEEDBACK
// ============================================================

exports.updateFeedback = async (
  req,
  res
) => {

  try {

    const {
      status,
      adminResponse
    } = req.body;


    const allowedStatuses = [

      'Visible',

      'Hidden',

      'Flagged'

    ];


    if (
      status !== undefined &&
      !allowedStatuses.includes(status)
    ) {

      return res.status(400).json({

        message:
          'Invalid feedback status'

      });

    }


    const feedback =
      await Feedback.findById(
        req.params.id
      );


    if (!feedback) {

      return res.status(404).json({

        message:
          'Feedback not found'

      });

    }


    if (
      status !== undefined
    ) {

      feedback.status =
        status;

    }


    if (
      adminResponse !== undefined
    ) {

      feedback.adminResponse =
        adminResponse;

      feedback.respondedBy =
        req.user._id;

      feedback.respondedAt =
        new Date();

    }


    await feedback.save();


    const updatedFeedback =
      await Feedback.findById(
        feedback._id
      )

        .populate(
          'user',
          'name email'
        )

        .populate(
          'event',
          'title date'
        )

        .populate(
          'respondedBy',
          'name email'
        );


    res.json({

      message:
        'Feedback updated successfully',

      feedback:
        updatedFeedback

    });

  } catch (error) {

    console.error(
      'Update Feedback Error:',
      error
    );

    res.status(500).json({
      message: error.message
    });

  }

};