const Event = require('../models/Event');

const Booking = require('../models/Booking');

const {
  sendScheduleUpdateNotification
} = require('../utils/emailService');

const fs = require('fs');

const path = require('path');


// ============================================================
// HELPER - DELETE UPLOADED FILE
// ============================================================

const deleteUploadedFile = (relativeUrl) => {

  try {

    if (!relativeUrl) {
      return;
    }

    const cleanPath =
      relativeUrl.replace(/^\/+/, '');

    const absolutePath =
      path.join(__dirname, '..', cleanPath);

    if (fs.existsSync(absolutePath)) {

      fs.unlinkSync(absolutePath);

      console.log(
        `Deleted old uploaded file: ${absolutePath}`
      );

    }

  } catch (error) {

    console.error(
      'Unable to delete old uploaded file:',
      error.message
    );

  }

};


// ============================================================
// CREATE EVENT
// ============================================================

exports.createEventListing = async (req, res) => {

  try {

    const {
      title,
      description,
      detailedDescription,
      date,
      time,
      location,
      category,
      ticketTiers
    } = req.body;


    const imageFile =
      req.files?.image?.[0];

    const videoFile =
      req.files?.video?.[0];


    const images = imageFile
      ? [`/uploads/images/${imageFile.filename}`]
      : [];


    const videos = videoFile
      ? [`/uploads/videos/${videoFile.filename}`]
      : [];


    let parsedTicketTiers = [];


    if (ticketTiers) {

      try {

        parsedTicketTiers =
          typeof ticketTiers === 'string'
            ? JSON.parse(ticketTiers)
            : ticketTiers;

      } catch (parseError) {

        return res.status(400).json({
          message: 'Invalid ticket tier JSON format'
        });

      }

    }


    const event =
      await Event.create({

        title,

        description,

        detailedDescription,

        date,

        time,

        location,

        category,

        ticketTiers:
          parsedTicketTiers,

        images,

        videos,

        organizer:
          req.user._id,

        status:
          'pending'

      });


    res.status(201).json(event);


  } catch (error) {

    console.error(
      'Create Event Error:',
      error
    );

    res.status(500).json({
      message: error.message
    });

  }

};


// ============================================================
// GET ALL APPROVED EVENTS
// ============================================================

exports.getAllApprovedEvents = async (req, res) => {

  try {

    const {
      search,
      location,
      category,
      minPrice,
      maxPrice,
      date
    } = req.query;


    let queryBuilder = {
      status: 'approved'
    };


    if (search) {

      queryBuilder.title = {
        $regex: search,
        $options: 'i'
      };

    }


    if (location) {

      queryBuilder.location = {
        $regex: location,
        $options: 'i'
      };

    }


    if (category) {

      queryBuilder.category =
        category;

    }


    if (date) {

      const searchDate =
        new Date(date);

      searchDate.setHours(
        0,
        0,
        0,
        0
      );


      const nextDate =
        new Date(searchDate);

      nextDate.setDate(
        nextDate.getDate() + 1
      );


      queryBuilder.date = {
        $gte: searchDate,
        $lt: nextDate
      };

    }


    if (minPrice || maxPrice) {

      const priceFilter = {};


      if (minPrice) {

        priceFilter.$gte =
          Number(minPrice);

      }


      if (maxPrice) {

        priceFilter.$lte =
          Number(maxPrice);

      }


      queryBuilder.ticketTiers = {

        $elemMatch: {

          price:
            priceFilter

        }

      };

    }


    const events =
      await Event
        .find(queryBuilder)
        .populate(
          'organizer',
          'name email'
        )
        .sort({
          date: 1
        });


    res.json(events);


  } catch (error) {

    console.error(
      'Get Events Error:',
      error
    );

    res.status(500).json({
      message: error.message
    });

  }

};


// ============================================================
// GET ORGANIZER EVENTS
// ALSO RETURNS hasSoldTickets
// ============================================================

exports.getMyEvents = async (req, res) => {

  try {

    let query = {
      organizer:
        req.user._id
    };


    if (req.user.role === 'admin') {
      query = {};
    }


    const events =
      await Event
        .find(query)
        .sort({
          createdAt: -1
        })
        .lean();


    // --------------------------------------------------------
    // Add ticket sales information to every event
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


      event.hasSoldTickets =
        sales.length > 0 &&
        sales[0].ticketsSold > 0;


      event.ticketsSold =
        sales.length > 0
          ? sales[0].ticketsSold
          : 0;


      event.revenue =
        sales.length > 0
          ? sales[0].revenue
          : 0;

    }


    res.json(events);


  } catch (error) {

    console.error(
      'Get My Events Error:',
      error
    );

    res.status(500).json({
      message: error.message
    });

  }

};


// ============================================================
// UPDATE / EDIT EVENT
// ============================================================

exports.updateEvent = async (req, res) => {

  try {

    const eventId =
      req.params.id;


    // --------------------------------------------------------
    // FIRST FIND EVENT
    // --------------------------------------------------------

    const event =
      await Event.findById(
        eventId
      );


    if (!event) {

      return res.status(404).json({
        message: 'Event not found'
      });

    }


    // --------------------------------------------------------
    // SECURITY - OWNERSHIP
    // --------------------------------------------------------

    if (

      event.organizer.toString() !==
        req.user._id.toString()

      &&

      req.user.role !== 'admin'

    ) {

      return res.status(403).json({
        message:
          'You are not authorized to edit this event'
      });

    }


    // --------------------------------------------------------
    // CHECK PAID TICKETS
    // --------------------------------------------------------
    // ANY PAID ACTIVE TICKET = NO EDITING
    // --------------------------------------------------------

    const soldTickets =
      await Booking.exists({

        event:
          event._id,

        paymentStatus:
          'paid',

        bookingStatus:
          'active'

      });


    if (soldTickets) {

      return res.status(400).json({

        message:
          'This event cannot be edited because paid tickets have already been sold.'

      });

    }


    // --------------------------------------------------------
    // BASIC EVENT INFORMATION
    // --------------------------------------------------------

    const {
      title,
      description,
      detailedDescription,
      date,
      time,
      location,
      category,
      ticketTiers
    } = req.body;


    if (title !== undefined) {

      event.title =
        title;

    }


    if (description !== undefined) {

      event.description =
        description;

    }


    if (
      detailedDescription !==
      undefined
    ) {

      event.detailedDescription =
        detailedDescription;

    }


    if (date !== undefined) {

      event.date =
        date;

    }


    if (time !== undefined) {

      event.time =
        time;

    }


    if (location !== undefined) {

      event.location =
        location;

    }


    if (category !== undefined) {

      event.category =
        category;

    }


    // --------------------------------------------------------
    // TICKET TIERS
    // --------------------------------------------------------

    if (
      ticketTiers !== undefined
    ) {

      try {

        const parsedTiers =
          typeof ticketTiers === 'string'
            ? JSON.parse(ticketTiers)
            : ticketTiers;


        if (!Array.isArray(parsedTiers)) {

          return res.status(400).json({

            message:
              'Ticket tiers must be an array'

          });

        }


        event.ticketTiers =
          parsedTiers;

      } catch (parseError) {

        return res.status(400).json({

          message:
            'Invalid ticket tier JSON format'

        });

      }

    }


    // --------------------------------------------------------
    // IMAGE REPLACEMENT
    // --------------------------------------------------------

    const newImage =
      req.files?.image?.[0];


    if (newImage) {

      if (
        event.images &&
        event.images.length > 0
      ) {

        event.images.forEach(
          oldImage => {

            deleteUploadedFile(
              oldImage
            );

          }
        );

      }


      event.images = [
        `/uploads/images/${newImage.filename}`
      ];

    }


    // --------------------------------------------------------
    // VIDEO REPLACEMENT
    // --------------------------------------------------------

    const newVideo =
      req.files?.video?.[0];


    if (newVideo) {

      if (
        event.videos &&
        event.videos.length > 0
      ) {

        event.videos.forEach(
          oldVideo => {

            deleteUploadedFile(
              oldVideo
            );

          }
        );

      }


      event.videos = [
        `/uploads/videos/${newVideo.filename}`
      ];

    }


    // --------------------------------------------------------
    // APPROVAL WORKFLOW
    // --------------------------------------------------------

    if (
      req.user.role === 'organizer'
    ) {

      event.status =
        'pending';

    }


    await event.save();


    res.json({

      message:

        req.user.role === 'organizer'

          ? 'Event updated successfully and sent for Admin approval'

          : 'Event updated successfully',

      event

    });


  } catch (error) {

    console.error(
      'Update Event Error:',
      error
    );

    res.status(500).json({
      message: error.message
    });

  }

};


// ============================================================
// UPDATE EVENT SCHEDULE
// ============================================================

exports.updateEventSchedule = async (
  req,
  res
) => {

  try {

    const event =
      await Event.findById(
        req.params.id
      );


    if (!event) {

      return res.status(404).json({

        message:
          'Target event reference entry not found'

      });

    }


    if (

      event.organizer.toString() !==
        req.user._id.toString()

      &&

      req.user.role !== 'admin'

    ) {

      return res.status(403).json({

        message:
          'Forbidden updating foreign timeline'

      });

    }


    event.schedule =
      req.body.schedule;


    await event.save();


    const bookings =
      await Booking
        .find({

          event:
            event._id,

          bookingStatus:
            'active'

        })
        .populate(
          'user',
          'email'
        );


    bookings.forEach(
      booking => {

        if (
          booking.user &&
          booking.user.email
        ) {

          try {

            if (
              typeof
                sendScheduleUpdateNotification ===
              'function'
            ) {

              sendScheduleUpdateNotification(

                booking.user.email,

                event.title,

                req.body.schedule?.[0] ||
                  {}

              );

            }

          } catch (emailErr) {

            console.error(
              'Email delivery fault:',
              emailErr.message
            );

          }

        }

      }
    );


    res.json({

      message:
        'Itinerary schedule saved successfully, alerts dispatched',

      event

    });


  } catch (error) {

    console.error(
      'Update Schedule Error:',
      error
    );

    res.status(500).json({
      message: error.message
    });

  }

};


// ============================================================
// MONTHLY REVENUE ANALYTICS
// ============================================================

exports.getMonthOverMonthRevenue =
  async (req, res) => {

    try {

      const reportPipeline = [

        {
          $match: {

            bookingStatus:
              'active',

            paymentStatus:
              'paid'

          }

        },

        {
          $group: {

            _id: {

              year: {
                $year:
                  '$createdAt'
              },

              month: {
                $month:
                  '$createdAt'
              }

            },

            monthlyRevenue: {
              $sum:
                '$totalPaid'
            },

            ticketsSold: {
              $sum:
                '$quantity'
            }

          }

        },

        {
          $sort: {

            '_id.year': 1,

            '_id.month': 1

          }

        }

      ];


      const structuralData =
        await Booking.aggregate(
          reportPipeline
        );


      const monthNames = [

        '',

        'Jan',

        'Feb',

        'Mar',

        'Apr',

        'May',

        'Jun',

        'Jul',

        'Aug',

        'Sep',

        'Oct',

        'Nov',

        'Dec'

      ];


      const formattedData =
        structuralData.map(
          item => ({

            monthLabel:
              `${monthNames[item._id.month]} ${item._id.year}`,

            revenue:
              item.monthlyRevenue,

            tickets:
              item.ticketsSold

          })
        );


      res.json(
        formattedData
      );


    } catch (err) {

      console.error(
        'Monthly Analytics Error:',
        err
      );

      res.status(500).json({
        message:
          err.message
      });

    }

  };


// ============================================================
// COMPLETE SALES ANALYTICS
// ============================================================

// ============================================================
// SALES ANALYTICS
// ============================================================

exports.getSalesAnalytics = async (req, res) => {
  try {

    // --------------------------------------------------------
    // ORGANIZER EVENT FILTER
    // --------------------------------------------------------

    const eventFilter = {};

    if (req.user.role === 'organizer') {

      const organizerEvents = await Event.find(
        {
          organizer: req.user._id
        },
        {
          _id: 1
        }
      );

      const eventIds = organizerEvents.map(
        event => event._id
      );

      eventFilter.event = {
        $in: eventIds
      };
    }

    // --------------------------------------------------------
    // ONLY PAID + ACTIVE BOOKINGS
    // --------------------------------------------------------

    const bookingMatch = {
      paymentStatus: 'paid',
      bookingStatus: 'active',
      ...eventFilter
    };


    // ========================================================
    // 1. TOTAL TICKETS + TOTAL REVENUE
    // ========================================================

    const overallSales = await Booking.aggregate([

      {
        $match: bookingMatch
      },

      {
        $group: {
          _id: null,

          totalTickets: {
            $sum: '$quantity'
          },

          totalRevenue: {
            $sum: '$totalPaid'
          }
        }
      }

    ]);


    const totalTickets =
      overallSales.length > 0
        ? overallSales[0].totalTickets
        : 0;

    const totalRevenue =
      overallSales.length > 0
        ? overallSales[0].totalRevenue
        : 0;


    // ========================================================
    // 2. TICKET TIER SALES
    // ========================================================

    const tierSalesData = await Booking.aggregate([

      {
        $match: bookingMatch
      },

      {
        $group: {

          _id: '$ticketTierName',

          tickets: {
            $sum: '$quantity'
          },

          revenue: {
            $sum: '$totalPaid'
          }

        }
      },

      {
        $sort: {
          tickets: -1
        }
      }

    ]);


    const tierSales = tierSalesData.map(
      item => ({

        tierName:
          item._id || 'Unknown',

        tickets:
          item.tickets || 0,

        revenue:
          item.revenue || 0

      })
    );


    // ========================================================
    // 3. EVENT-WISE SALES
    // ========================================================

    const eventSalesData = await Booking.aggregate([

      {
        $match: bookingMatch
      },

      {
        $group: {

          _id: '$event',

          tickets: {
            $sum: '$quantity'
          },

          revenue: {
            $sum: '$totalPaid'
          }

        }
      },

      {
        $lookup: {

          from: 'events',

          localField: '_id',

          foreignField: '_id',

          as: 'eventDetails'

        }

      },

      {
        $unwind: {
          path: '$eventDetails',
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $project: {

          _id: 0,

          eventId: '$_id',

          eventTitle: {
            $ifNull: [
              '$eventDetails.title',
              'Unknown Event'
            ]
          },

          tickets: 1,

          revenue: 1

        }

      },

      {
        $sort: {
          tickets: -1
        }
      }

    ]);


    // ========================================================
    // 4. TIER + EVENT-WISE SALES
    // ========================================================

    const eventTierSalesData = await Booking.aggregate([

      {
        $match: bookingMatch
      },

      {
        $group: {

          _id: {
            event: '$event',
            tier: '$ticketTierName'
          },

          tickets: {
            $sum: '$quantity'
          },

          revenue: {
            $sum: '$totalPaid'
          }

        }
      },

      {
        $lookup: {

          from: 'events',

          localField: '_id.event',

          foreignField: '_id',

          as: 'eventDetails'

        }

      },

      {
        $unwind: {
          path: '$eventDetails',
          preserveNullAndEmptyArrays: true
        }

      },

      {
        $project: {

          _id: 0,

          eventId: '$_id.event',

          eventTitle: {
            $ifNull: [
              '$eventDetails.title',
              'Unknown Event'
            ]
          },

          tierName: {
            $ifNull: [
              '$_id.tier',
              'Unknown Tier'
            ]
          },

          tickets: 1,

          revenue: 1

        }

      },

      {
        $sort: {
          tickets: -1
        }

      }

    ]);


    // ========================================================
    // 5. RESPONSE
    // ========================================================

    res.json({

      totalTickets,

      totalRevenue,

      tierSales,

      eventSales:
        eventSalesData,

      eventTierSales:
        eventTierSalesData

    });


  } catch (error) {

    console.error(
      'Sales Analytics Error:',
      error
    );

    res.status(500).json({

      message:
        error.message

    });

  }
};
  // ============================================================
// EVENT SALES ANALYTICS
// ============================================================

exports.getEventSalesAnalytics = async (req, res) => {

  try {

    // ========================================================
    // STEP 1
    // Find events belonging to this organizer
    // ========================================================

    let eventQuery = {};

    if (req.user.role === 'organizer') {

      eventQuery.organizer = req.user._id;

    }


    const events = await Event.find(eventQuery)
      .select('_id title ticketTiers');


    if (!events || events.length === 0) {

      return res.json({
        summary: {
          totalTicketsSold: 0,
          totalRevenue: 0,
          eventsWithSales: 0
        },

        eventSales: [],

        tierSales: []
      });

    }


    // ========================================================
    // STEP 2
    // Get event IDs
    // ========================================================

    const eventIds = events.map(
      event => event._id
    );


    // ========================================================
    // STEP 3
    // Aggregate PAID bookings
    // ========================================================

    const bookingSales = await Booking.aggregate([

      {
        $match: {

          event: {
            $in: eventIds
          },

          paymentStatus: 'paid',

          bookingStatus: 'active'

        }
      },


      // ======================================================
      // EVENT-WISE SALES
      // ======================================================

      {
        $group: {

          _id: {
            event: '$event'
          },

          ticketsSold: {
            $sum: '$quantity'
          },

          revenue: {
            $sum: '$totalPaid'
          }

        }
      }

    ]);


    // ========================================================
    // STEP 4
    // Create event-wise sales data
    // ========================================================

    const eventSales = events.map(event => {

      const sale = bookingSales.find(

        item =>
          item._id.event.toString() ===
          event._id.toString()

      );


      return {

        eventId: event._id,

        eventTitle: event.title,

        ticketsSold:
          sale?.ticketsSold || 0,

        revenue:
          sale?.revenue || 0

      };

    });


    // ========================================================
    // STEP 5
    // Overall Summary
    // ========================================================

    const totalTicketsSold =
      eventSales.reduce(

        (total, event) =>
          total + Number(event.ticketsSold || 0),

        0

      );


    const totalRevenue =
      eventSales.reduce(

        (total, event) =>
          total + Number(event.revenue || 0),

        0

      );


    const eventsWithSales =
      eventSales.filter(

        event =>
          Number(event.ticketsSold) > 0

      ).length;


    // ========================================================
    // STEP 6
    // Ticket Tier Analytics
    // ========================================================

    const tierSalesAggregation =
      await Booking.aggregate([

        {
          $match: {

            event: {
              $in: eventIds
            },

            paymentStatus: 'paid',

            bookingStatus: 'active'

          }
        },


        {
          $group: {

            _id: '$ticketTierName',

            ticketsSold: {
              $sum: '$quantity'
            },

            revenue: {
              $sum: '$totalPaid'
            }

          }
        },


        {
          $sort: {
            ticketsSold: -1
          }
        }

      ]);


    const tierSales =
      tierSalesAggregation.map(

        item => ({

          tierName:
            item._id,

          ticketsSold:
            item.ticketsSold,

          revenue:
            item.revenue

        })

      );


    // ========================================================
    // STEP 7
    // RESPONSE
    // ========================================================

    res.json({

      summary: {

        totalTicketsSold,

        totalRevenue,

        eventsWithSales

      },

      eventSales,

      tierSales

    });


  } catch (error) {

    console.error(
      'Event Sales Analytics Error:',
      error
    );


    res.status(500).json({

      message:
        error.message

    });

  }

};