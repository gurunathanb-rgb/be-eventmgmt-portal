const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../utils/config');

// 🌟 OPTIMIZATION: Consistent token signing using a singular secret string source
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// 🌟 HELPER: Uniform cookie dispatch configuration option block
// const sendTokenCookie = (res, token) => {
//   res.cookie('token', token, {
//     httpOnly: true,                 // Prevents client-side scripts from reading the cookie
//     secure: process.env.NODE_ENV === 'production', // true in production (requires HTTPS)
//     sameSite: 'strict',             // Protects against CSRF attacks
//     maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days calculation parameter match
//   });
// };

const sendTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,

    // HTTPS is required for production
    secure: process.env.NODE_ENV === 'production',

    // Required because Netlify frontend and backend
    // are on different sites/domains
    sameSite:
      process.env.NODE_ENV === 'production'
        ? 'none'
        : 'lax',

    // 30 days
    maxAge: 30 * 24 * 60 * 60 * 1000,

    // Available to all API routes
    path: '/'
  });
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists matching that email profile' });
    }

    const user = await User.create({ name, email, password, role });
    const token = generateToken(user._id);

    // 🌟 FIX: Uniform cookie delivery strategy
    sendTokenCookie(res, token);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: 'Account initialized and logged in successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      // 🌟 FIX: Switched to the uniform generateToken helper function
      const token = generateToken(user._id);

      sendTokenCookie(res, token);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        message: 'Logged in successfully'
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Profile account resource not found' });

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) user.password = req.body.password;

    const updatedUser = await user.save();
    const token = generateToken(updatedUser._id);

    // 🌟 FIX: Re-issue token cookie to keep the authentication active
    sendTokenCookie(res, token);

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      message: 'Profile update completed successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🌟 ADDITION: Explicit logout route logic required for HTTP-Only setups
// exports.logoutUser = async (req, res) => {
//   try {
//     res.cookie('token', '', {
//       httpOnly: true,
//       expires: new Date(0), // Instantly expires cookie storage parameter maps
//       sameSite: 'strict',
//       secure: process.env.NODE_ENV === 'production'
//     });
//     res.json({ message: 'Logged out cleanly and session token invalidated.' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
exports.logoutUser = async (req, res) => {
  try {

    res.cookie('token', '', {
      httpOnly: true,

      secure:
        process.env.NODE_ENV === 'production',

      sameSite:
        process.env.NODE_ENV === 'production'
          ? 'none'
          : 'lax',

      expires: new Date(0),

      path: '/'
    });

    res.json({
      message:
        'Logged out cleanly and session token invalidated.'
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};
