const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/authRoutes')
const eventRoutes= require('./routes/eventRoutes')
const bookingRoutes = require('./routes/bookingRoutes')
const adminRoutes = require('./routes/adminRoutes')

const app = express();

// 1. Mount Stripe Webhook BEFORE general express.json middleware
// This ensures raw payloads can be processed if signature validation is turned back on.
app.use('/api/bookings/webhook', bookingRoutes);

// 2. Global System Middlewares
app.use(cors({
  //origin: 'http://localhost:5173', // Your Vite frontend location URL string
   //origin: 'http://127.0.0.1:5173',
   origin: 'https://fe-eventmgmt-portal.netlify.app',
  credentials: true,                // Enables passing secure HTTP-Only cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// STATIC UPLOAD FILES
app.use('/uploads',express.static(path.join(__dirname, 'uploads')));

// 3. API Route Registration Mapping
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Global 404 Route handling fallback mapping anomalies
app.use('{*path}', (req, res) => {
  res.status(404).json({ message: 'Requested backend API resource endpoint not found.' });
});

module.exports = app;