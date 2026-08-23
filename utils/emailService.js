const nodemailer = require('nodemailer');
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = require('./config');

// Initialize the standalone SMTP transport client engine
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST || 'smtp.gmail.com', // Defaults to Gmail SMTP server if left blank
  port: Number(EMAIL_PORT) || 587,      // 587 for TLS STARTTLS securely wrapped channels
  secure: false,                        // Use false for 587, true for port 465
  auth: {
    user: EMAIL_USER,                   // Your company/personal email address profile
    pass: EMAIL_PASS                    // 🌟 MUST BE A 16-CHARACTER GMAIL APP PASSWORD
  }
});

/**
 * 🎟️ Sends an HTML Ticket confirmation email receipt upon successful checkout processing
 */
/**
 * 🎟️ Sends an HTML Ticket confirmation email upon successful checkout
 */
exports.sendTicketConfirmation = async (recipientEmail, ticketDetails) => {

  // Format event date safely
  let formattedDate = 'Date not available';

  if (ticketDetails.eventDate) {
    const eventDate = new Date(ticketDetails.eventDate);

    if (!isNaN(eventDate.getTime())) {
      formattedDate = eventDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    }
  }

  const mailOptions = {
    from: `"EventPro.io Gateways" <${EMAIL_USER}>`,
    to: recipientEmail,

    subject: `🎉 Ticket Confirmed: ${ticketDetails.eventTitle}`,

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
          Hi ${ticketDetails.name}, your pass is active and registered.
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
            ${ticketDetails.eventTitle}
          </h3>

          <!-- Event Date -->
          <p style="
            margin: 6px 0;
            font-size: 13px;
          ">
            <b>📅 Event Date:</b>
            ${formattedDate}
          </p>

          <!-- Event Time -->
          <p style="
            margin: 6px 0;
            font-size: 13px;
          ">
            <b>🕐 Event Time:</b>
            ${ticketDetails.eventTime || 'Time not available'}
          </p>

          <!-- Event Location -->
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

          <!-- Ticket Information -->
          <p style="
            margin: 6px 0;
            font-size: 13px;
          ">
            <b>🎟️ Admission Tier:</b>
            ${ticketDetails.tier}
          </p>

          <p style="
            margin: 6px 0;
            font-size: 13px;
          ">
            <b>👥 Quantity:</b>
            ${ticketDetails.quantity} Seat(s)
          </p>

          <p style="
            margin: 6px 0;
            font-size: 13px;
          ">
            <b>💰 Total Paid:</b>
            Rs. ${ticketDetails.totalPaid}
          </p>

          <p style="
            margin: 12px 0 0 0;
            font-size: 11px;
            color: #94a3b8;
          ">
            Transaction Reference:
            ${ticketDetails.paymentId}
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
            Please present this digital ticket confirmation at the venue.
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

  try {

    const trackingInfo = await transporter.sendMail(mailOptions);

    console.log(
      `✉️ Confirmation email dispatched to ${recipientEmail}. MessageID: ${trackingInfo.messageId}`
    );

    return trackingInfo;

  } catch (err) {

    console.error(
      `❌ Nodemailer execution fault routing to ${recipientEmail}:`,
      err.message
    );

  }
};
