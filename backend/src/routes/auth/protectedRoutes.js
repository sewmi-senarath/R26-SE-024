// /backend/src/routes/auth/protectedRoutes.js

const express = require('express');
const router = express.Router();

// ✅ Going up 2 levels from routes/auth/ to reach src/middleware/
const { protect, authorize } = require('../../middleware/auth');

router.get('/patient/dashboard', protect, authorize('patient'), (req, res) => {
  res.json({ success: true, message: 'Patient Dashboard', user: req.user });
});

router.get('/caregiver/dashboard', protect, authorize('caregiver'), (req, res) => {
  res.json({ success: true, message: 'Caregiver Dashboard', user: req.user });
});

router.get('/family/dashboard', protect, authorize('family'), (req, res) => {
  res.json({ success: true, message: 'Family Dashboard', user: req.user });
});

module.exports = router;