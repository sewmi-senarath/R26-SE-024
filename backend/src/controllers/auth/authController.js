const User = require('../../models/auth/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../../utils/jwt');

// ─────────────────────────────────────────────
// 📌 REGISTER
// POST /api/auth/register
// Body: { fullName, email, password, role }
// ─────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Validate role
    const validRoles = ['patient', 'caregiver', 'family'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be patient, caregiver, or family.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    // Create user (password auto-hashed by model pre-save hook)
    const user = await User.create({ fullName, email, password, role });

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// 📌 LOGIN
// POST /api/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact support.',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Update refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
};

// ─────────────────────────────────────────────
// 📌 REFRESH TOKEN
// POST /api/auth/refresh
// Body: { refreshToken }
// ─────────────────────────────────────────────
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required.',
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user and match stored refresh token
    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token.',
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id, user.role);

    res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token.',
    });
  }
};

// ─────────────────────────────────────────────
// 📌 LOGOUT
// POST /api/auth/logout
// Requires: Bearer token
// ─────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    // Clear refresh token from DB
    await User.findByIdAndUpdate(req.user.userId, { refreshToken: null });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during logout.',
    });
  }
};

// ─────────────────────────────────────────────
// 📌 GET CURRENT USER
// GET /api/auth/me
// Requires: Bearer token
// ─────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

module.exports = { register, login, refresh, logout, getMe };