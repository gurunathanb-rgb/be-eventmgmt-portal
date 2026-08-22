const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../utils/config'); 

const protect = async (req, res, next) => {
  let token;

  // Read the token directly out of the parsed cookies object
  if (req.cookies && req.cookies.token) {
    try {
      token = req.cookies.token;
      
      // 🌟 FIX: Use process.env.JWT_SECRET to match your signing controllers perfectly
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Look up the user profile without pulling their sensitive hashed password field
      req.user = await User.findById(decoded.id).select('-password');
      
      // 🌟 FIX: Safety boundary check if a user holding a valid cookie was deleted from the DB
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, this user profile no longer exists' });
      }
      
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token validation failed' });
    }
  }

  // Fallback case block if no matching cookie container is passed from the client browser
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no cookie token found' });
  }
};

// 🌟 ADDITION: Your multi-role check middleware to protect organizer and admin endpoints
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access Denied: Your role [${req.user ? req.user.role : 'Guest'}] does not have permission to access this resource.` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
