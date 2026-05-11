// /backend/src/routes/auth/authRoutes.js

const express = require('express');
const router = express.Router();

// ✅ Correct paths - going up 2 levels from routes/auth/
const { register, login, refresh, logout, getMe, getMePhotos, getPatientPhotos } = require('../../controllers/auth/authController');
const { protect } = require('../../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me/photos', protect, getMePhotos);
router.get('/patients/:patientId/photos', protect, getPatientPhotos);
router.get('/me', protect, getMe);

module.exports = router;

