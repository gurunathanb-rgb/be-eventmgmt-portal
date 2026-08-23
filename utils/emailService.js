const nodemailer = require('nodemailer');
const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS
} = require('./config');

// ============================================================
// SMTP TRANSPORT
// ============================================================

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST || 'smtp.gmail.com',

  port: Number(EMAIL_PORT) || 587,

  secure: Number(EMAIL_PORT) === 465,

  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// ============================================================
// VERIFY SMTP CONNECTION
// ============================================================

transporter.verify((error, success) => {

  if (error) {

    console.error(
      '❌ SMTP CONNECTION FAILED:',
      error.message
    );

  } else {

    console.log(
      '✅ SMTP SERVER READY FOR EMAILS'
    );

  }

});

// ============================================================
// SEND TICKET CONFIRMATION
// ============================================================

exports.sendTicketConfirmation = async (
  recipientEmail,
  ticketDetails
) => {

  // ----------------------------------------------------------
  // VALIDATE EMAIL CONFIGURATION
  // ----------------------------------------------------------

  if (!EMAIL_USER) {
    throw new Error(
      'EMAIL_USER is not configured in environment variables'
    );
  }

  if (!EMAIL_PASS) {
    throw new Error(
      'EMAIL_PASS is not configured in environment variables'
    );
  }

  if (!recipientEmail) {
    throw new Error(
      'Recipient email address is missing'
    );
  }


  // ----------------------------------------------------------
  // FORMAT EVENT DATE
  // ----------------------------------------------------------

  let formattedDate =
    'Date not available';

  if (ticketDetails.eventDate) {

    const eventDate =
      new Date(
        ticketDetails.eventDate
      );

    if (
      !isNaN(
        eventDate.getTime()
      )
    ) {

      formattedDate =
        eventDate.toLocaleDateString(
          'en-IN',
          {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          }
        );

    }

  }


  // ----------------------------------------------------------
  // EMAIL CONTENT
  // ----------------------------------------------------------

  const mailOptions = {

    from:
      `"EventPro.io Gateways" <${EMAIL_USER}>`,

    to:
      recipientEmail,

    subject:
      `🎉 Ticket Confirmed: ${ticketDetails.eventTitle}`,

    html: `

      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background-color: #ffffff;
      ">

        <h2 style="
          color: #2563eb;
          margin-bottom: 5px;
        ">
          Reservation Confirmed!
        </h2>

        <p style="
          color: #64748b;
          font-size: 14px;
          margin-top: 0;
        ">
          Hi ${ticketDetails.name || 'Customer'},
          your pass is active and registered.
        </p>

        <div style="
          background-color: #f8fafc;
          border-left: 4px solid #2563eb;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        ">

          <h3 style="
            margin: 0 0 15px 0;
            color: #0f172a;
          ">
            ${ticketDetails.eventTitle || 'Event'}
          </h3>

          <p style="
            margin: 6px 0;
            font-size: 13px;
          ">
            <b>📅 Event Date:</b>
            ${formattedDate}
          </p>

          <p style="
            margin: 6px 0;
            font-size: 13px;
          ">
            <b>🕐 Event Time:</b>
            ${ticketDetails.eventTime || 'Time not available'}
          </p>

          <p style="
            margin: 6px 0;
            font-size: 13px;
          ">
            <b>📍 Venue:</b>
            ${ticketDetails.eventLocation || 'Venue not available'}
          </p>

          <hr style="
            border: none;
            border-top: 1px solid #e2e8f0;
            margin: 15px 0;
          ">

          <p style="
            margin: 6px 0;
            font-size: 13px;
          ">
            <b>🎟️ Admission Tier:</b>
            ${ticketDetails.tier || 'Ticket'}
          </p>

          <p style="
            margin: 6px 0;
            font-size: 13px;
          ">
            <b>👥 Quantity:</b>
            ${ticketDetails.quantity || 0} Seat(s)
          </p>

          <p style="
            margin: 6px 0;
            font-size: 13px;
          ">
            <b>💰 Total Paid:</b>
            Rs. ${ticketDetails.totalPaid || 0}
          </p>

          <p style="
            margin: 12px 0 0 0;
            font-size: 11px;
            color: #94a3b8;
          ">
            Transaction Reference:
            ${ticketDetails.paymentId || 'N/A'}
          </p>

        </div>

        <div style="
          background-color: #eff6ff;
          padding: 12px;
          border-radius: 8px;
          margin-top: 15px;
        ">

          <p style="
            font-size: 12px;
            color: #1e40af;
            margin: 0;
            text-align: center;
          ">
            Please present this digital ticket confirmation
            at the venue.
          </p>

        </div>

        <p style="
          font-size: 12px;
          color: #94a3b8;
          text-align: center;
          margin-top: 30px;
        ">
          Thank you for booking with EventPro.io
        </p>

      </div>

    `
  };


  // ----------------------------------------------------------
  // SEND EMAIL
  // ----------------------------------------------------------

  try {

    const trackingInfo =
      await transporter.sendMail(
        mailOptions
      );

    console.log(
      `✉️ Confirmation email dispatched to ${recipientEmail}. MessageID: ${trackingInfo.messageId}`
    );

    return trackingInfo;

  } catch (err) {

    console.error(
      `❌ Nodemailer execution fault routing to ${recipientEmail}:`,
      err
    );

    // IMPORTANT:
    // Re-throw the error so bookingController
    // can see that email sending failed.
    throw err;

  }

};