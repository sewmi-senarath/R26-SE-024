const User = require('../../models/auth/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../../utils/jwt');

// ── REGISTER ──────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const {
      fullName, email, password, role,

      // Patient Step 1
      age, gender, preferredLanguage,
      cognitiveLevel, hometown,
      hobbies, interests,

      // Patient Step 2
      familyMembers, lifeEvents,
      countriesLived, occupations,

      // Patient Step 3
      favoritePlaces, favoritePlacesText,
      festivalsCelebrated, foodsPreferred,
      preferredSports, preferredSportsText,
      languagesPreferred,
    } = req.body;

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

    // Create user with all fields
    const user = await User.create({
      fullName, email, password, role,

      // Step 1
      age, gender, preferredLanguage,
      cognitiveLevel, hometown,
      hobbies, interests,

      // Step 2
      familyMembers, lifeEvents,
      countriesLived, occupations,

      // Step 3
      favoritePlaces, favoritePlacesText,
      festivalsCelebrated, foodsPreferred,
      preferredSports, preferredSportsText,
      languagesPreferred,
    });

    // Generate tokens
    const accessToken  = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        user: {
          id:       user._id,
          fullName: user.fullName,
          email:    user.email,
          role:     user.role,
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

// ── LOGIN ─────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact support.',
      });
    }

    const accessToken  = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id:       user._id,
          fullName: user.fullName,
          email:    user.email,
          role:     user.role,
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

// ── REFRESH TOKEN ─────────────────────────────────────────────────────────
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required.',
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user    = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token.',
      });
    }

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

// ── LOGOUT ────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
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

// ── GET CURRENT USER ──────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      'fullName email role ' +
      'age gender preferredLanguage cognitiveLevel hometown hobbies interests ' +
      'familyMembers lifeEvents countriesLived occupations ' +
      'favoritePlaces favoritePlacesText festivalsCelebrated foodsPreferred preferredSports preferredSportsText languagesPreferred ' +
      'avatarColor isOnline shiftsCompleted patientsAssigned hoursThisWeek profileImage'
    );

    res.status(200).json({
      success: true,
      data: {
        user: {
          id:       user._id,
          fullName: user.fullName,
          email:    user.email,
          role:     user.role,

          // Patient Step 1
          age:               user.age,
          gender:            user.gender,
          preferredLanguage: user.preferredLanguage,
          cognitiveLevel:    user.cognitiveLevel,
          hometown:          user.hometown,
          hobbies:           user.hobbies,
          interests:         user.interests,

          // Patient Step 2
          familyMembers:  user.familyMembers,
          lifeEvents:     user.lifeEvents,
          countriesLived: user.countriesLived,
          occupations:    user.occupations,

          // Patient Step 3
          favoritePlaces:      user.favoritePlaces,
          favoritePlacesText:  user.favoritePlacesText,
          festivalsCelebrated: user.festivalsCelebrated,
          foodsPreferred:      user.foodsPreferred,
          preferredSports:     user.preferredSports,
          preferredSportsText: user.preferredSportsText,
          languagesPreferred:  user.languagesPreferred,

          // Caregiver
          avatarColor:      user.avatarColor,
          isOnline:         user.isOnline,
          shiftsCompleted:  user.shiftsCompleted,
          patientsAssigned: user.patientsAssigned,
          hoursThisWeek:    user.hoursThisWeek,
          profileImage:     user.profileImage,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, refresh, logout, getMe };