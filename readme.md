# Online Event Management Portal – Backend

This is the backend application for an **Online Event Management Portal**, developed using **Node.js, Express.js, and MongoDB**.

The backend provides REST APIs for user authentication, event management, event approval, ticket booking, payment processing, attendee management, support inquiries, feedback management, email notifications, and event analytics.

The system supports three types of users:

- **Admin**
- **Event Organizer**
- **Attendee / User**

---

## Features

### 1. User Authentication

- User Registration
- User Login
- JWT-based authentication
- Role-based authorization
- Password encryption using bcrypt
- User account management

---

## 2. Attendee / User Features

- Register and login
- Browse approved event listings
- Search events
- Filter events by:
  - Date
  - Location
  - Category
  - Price range
- View event details
- Select ticket tier and quantity
- Register for events
- Purchase event tickets
- View booking details
- Cancel tickets
- Transfer tickets where applicable
- Submit event feedback
- Raise support inquiries
- View support/feedback information

---

## 3. Event Organizer Features

- Create event listings
- Manage event listings
- Add event title, description, date, time, location, category, ticket pricing, images, and videos
- Search and filter event information
- Submit events for Admin approval
- View event approval status
- Update event schedule
- Notify registered attendees through email when the event schedule changes
- Track ticket sales
- Track event revenue
- View event sales analytics
- View ticket-tier sales
- View month-over-month revenue analytics
- View graphical/chart-based event performance information

---

## 4. Admin Features

### User Management

- View users
- Create users
- Update user information
- Change user roles
- Delete users

### Event Management

- View pending event listings
- Review event listings
- Approve events
- Reject events
- View approved events
- Manage event information

### Attendee Management

- View event attendee information
- Export event attendees
- Generate attendee CSV reports

### Booking Management

- View booking information
- Monitor ticket bookings
- Monitor payment status
- Monitor booking status

### Support Management

- View all support inquiries
- Review support requests
- Respond to user inquiries
- Change support status: Open, In Progress, Resolved, or Closed

### Feedback Management

- View attendee feedback
- Review ratings and comments
- Respond to feedback
- Change feedback status: Visible, Hidden, or Flagged

### Platform Analytics

- Total users
- Total approved events
- Total tickets sold
- Total revenue
- Event category distribution

---

## 5. Payment Integration

The backend supports event ticket payment processing using **Stripe**.

Payment-related functionality includes:

- Ticket payment processing
- Payment status tracking
- Stripe session/payment information
- Booking creation after payment
- Paid and failed payment status management

---

## 6. Email Notifications

The backend uses **Nodemailer** for email notifications.

Email notifications are used for:

- Event schedule changes
- Attendee notifications
- Other event-related communications

---

# Technology Stack

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

### Authentication & Security

- JSON Web Token (JWT)
- bcryptjs
- CORS

### File Upload

- Multer

### Payment

- Stripe

### Email

- Nodemailer

### Development

- Nodemon
- dotenv

---

# npm Installation

Install the required backend packages:

```bash
npm install express mongoose dotenv cors jsonwebtoken bcryptjs multer stripe nodemailer
```

Install Nodemon as a development dependency:

```bash
npm install --save-dev nodemon
```

---

# Backend Application Folder Structure

```text
backend/
│
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   ├── bookingController.js
│   ├── eventController.js
│   ├── feedbackController.js
│   └── supportController.js
│
├── middleware/
│   ├── authMiddleware.js
│   └── uploadMiddleware.js
│
├── models/
│   ├── User.js
│   ├── Booking.js
│   ├── Event.js
│   ├── Feedback.js
│   └── SupportTicket.js
│
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── bookingRoutes.js
│   ├── eventRoutes.js
│   ├── feedbackRoutes.js
│   └── supportRoutes.js
│
├── uploads/
│   ├── images/
│   └── videos/
│
├── .env
├── app.js
├── server.js
└── package.json
```

---

# User Roles

| Role | Main Responsibilities |
|---|---|
| **Admin** | Manage users, events, bookings, support, feedback and platform analytics |
| **Organizer** | Create and manage events, monitor ticket sales and revenue |
| **Attendee / User** | Browse events, purchase tickets, manage bookings, submit feedback and support inquiries |

---

# Backend API Modules

The backend APIs are organized into:

- Authentication
- User Management
- Event Management
- Booking Management
- Payment Processing
- Admin Management
- Support Management
- Feedback Management
- Event Analytics
- Attendee Export
- Email Notifications

---

# Environment Variables

Create a `.env` file in the backend root directory and configure the required environment variables.

Example:

```env
PORT=3001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

Do not commit the `.env` file to GitHub.

---

# Running the Backend

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Or start the server using Node.js:

```bash
node server.js
```

---

# Backend Deployment

The backend can be deployed to a cloud platform such as **Render**.

After deployment, the frontend application can communicate with the backend through the deployed REST API.

---

# Project Objective

The objective of this project is to provide a complete online event management platform where:

- Attendees can discover and purchase event tickets.
- Organizers can create and manage events.
- Administrators can control users, events, bookings, support inquiries and feedback.
- Organizers and administrators can monitor event sales and revenue through analytics.
- Attendees receive notifications when important event information changes.
