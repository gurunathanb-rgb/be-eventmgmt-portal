const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const supportRoutes = require('./routes/supportRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

const app = express();

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));




// 🌟 FIX 2: Dynamic CORS origin processing array configuration rules
const allowedOrigins = [
  //'http://localhost:5173',
  //'http://127.0.0.1:5173',
  //'http://localhost:3001',
  //'http://127.0.0.1:3001',
  'https://fe-eventmgmt-portal.netlify.app/api'
];

// 2. Global System Middlewares
app.use(cors({
  origin: function (origin, callback) {
    // Allows server-to-server or tools like Postman (where origin is undefined)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,                // Enables passing secure HTTP-Only cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
// 1. Mount Stripe Webhook BEFORE general express.json middleware
app.use('/api/bookings/webhook', bookingRoutes);


// STATIC UPLOAD FILES
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. API Route Registration Mapping
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/support', supportRoutes);
app.use('/api/feedback', feedbackRoutes);

// Global 404 Route handling fallback mapping anomalies
app.use('{*path}', (req, res) => {
  res.status(404).json({ message: 'Requested backend API resource endpoint not found.' });
});

module.exports = app;
