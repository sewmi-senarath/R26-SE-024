// /backend/src/middleware/auth.js

const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/auth/User');

// ✅ Verify JWT Token - Protects routes
const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header: "Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check if user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists or is deactivated.',
      });
    }

    // Attach user to request
    req.user = {
      userId: user._id,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
    });
  }
};

// ✅ Role Authorization - Restricts access by role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden. Role '${req.user.role}' is not allowed to access this resource.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };