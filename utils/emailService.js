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
exports.sendTicketConfirmation = async (recipientEmail, ticketDetails) => {
  const mailOptions = {
    from: `"EventPro.io Gateways" <${EMAIL_USER}>`,
    to: recipientEmail,
    subject: `🎉 Ticket Confirmed: ${ticketDetails.eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-top: 12px;">
        <h2 style="color: #2563eb; margin-bottom: 5px;">Reservation Confirmed!</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 0;">Hi ${ticketDetails.name}, your pass is active and registered.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 10px 0; color: #0f172a;">${ticketDetails.eventTitle}</h3>
          <p style="margin: 4px 0; font-size: 13px;"><b>Admission Tier:</b> ${ticketDetails.tier}</p>
          <p style="margin: 4px 0; font-size: 13px;"><b>Quantity:</b> ${ticketDetails.quantity} Seat(s)</p>
          <p style="margin: 4px 0; font-size: 13px;"><b>Total Paid:</b> Rs. ${ticketDetails.totalPaid}</p>
          <p style="margin: 4px 0; font-size: 11px; color: #94a3b8; margin-top: 10px;">Transaction String Ref: ${ticketDetails.paymentId}</p>
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;">Present this digital email pass at the venue door tracking validation screens.</p>
      </div>
    `
  };

  try {
    const trackingInfo = await transporter.sendMail(mailOptions);
    console.log(`✉️ Confirmation email dispatched to ${recipientEmail}. MessageID: ${trackingInfo.messageId}`);
    return trackingInfo;
  } catch (err) {
    console.error(`❌ Nodemailer execution fault routing to ${recipientEmail}:`, err.message);
  }
};

/**
 * 📅 Sends an explicit timetable alert notice to all attendees if an organizer updates schedules
 */
exports.sendScheduleUpdateNotification = async (recipientEmail, eventTitle, scheduleArray) => {
  const mailOptions = {
    from: `"EventPro.io Updates" <${EMAIL_USER}>`,
    to: recipientEmail,
    subject: `🔔 Schedule Update Required: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0;">
        <h3 style="color: #dc2626;">Itinerary Schedule Revised</h3>
        <p style="font-size: 14px; color: #334155;">The organizer has modified the timetable configurations for <b>${eventTitle}</b>. Please check your tracking cards dashboard for the full updated timeline layout.</p>
        <p style="font-size: 12px; color: #64748b;">Thank you for your cooperation,</p>
        <p style="font-size: 12px; font-weight: bold; color: #2563eb;">EventPro Administration Node</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error(`❌ Failed tracking schedule notification update mail to ${recipientEmail}:`, err.message);
  }
};
