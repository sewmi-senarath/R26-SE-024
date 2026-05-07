// const express = require('express');
// const router  = express.Router();
// const axios   = require('axios');

// const ML_URL  = 'http://localhost:5001'; // caregiver Flask API

// // ── POST /api/caregiver/insights/checkin ──────────────────────────────────
// router.post('/checkin', async (req, res) => {
//   try {
//     const { caregiverId, ...formData } = req.body;

//     if (!caregiverId) {
//       return res.status(400).json({
//         success: false,
//         message: 'caregiverId is required',
//       });
//     }

//     // Call Python ML API
//     const mlResponse = await axios.post(`${ML_URL}/predict`, formData);
//     const result     = mlResponse.data;

//     if (!result.success) {
//       return res.status(500).json({
//         success: false,
//         message: 'ML model prediction failed',
//       });
//     }

//     // Return prediction result to frontend
//     res.status(200).json({
//       success: true,
//       result: {
//         stressLevel:  result.stressLevel,
//         stressScore:  result.stressScore,
//         confidence:   result.confidence,
//         message:      result.message,
//         tips:         result.tips,
//         submittedAt:  result.submittedAt,
//       },
//     });

//   } catch (error) {
//     console.error('[Insight Route] Error:', error.message);

//     // If Flask is not running
//     if (error.code === 'ECONNREFUSED') {
//       return res.status(503).json({
//         success: false,
//         message: 'ML service not running. Start Flask API first.',
//       });
//     }

//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // ── GET /api/caregiver/insights/latest/:caregiverId ───────────────────────
// router.get('/latest/:caregiverId', async (req, res) => {
//   try {
//     // For now return null — add DB storage later
//     res.status(200).json({ success: false, result: null });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect, authorize } = require('../../middleware/auth');

const ML_URL = 'http://localhost:5001';

// ✅ Protected - caregiver only
router.post('/checkin', protect, authorize('caregiver'), async (req, res) => {
  try {
    // ✅ Get caregiverId from JWT token
    const caregiverId = req.user.userId;
    const formData = req.body;

    const mlResponse = await axios.post(`${ML_URL}/predict`, formData);
    const result = mlResponse.data;

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'ML model prediction failed',
      });
    }

    res.status(200).json({
      success: true,
      result: {
        stressLevel: result.stressLevel,
        stressScore: result.stressScore,
        confidence:  result.confidence,
        message:     result.message,
        tips:        result.tips,
        submittedAt: result.submittedAt,
      },
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'ML service not running.',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Protected - get latest result
router.get('/latest', protect, authorize('caregiver'), async (req, res) => {
  try {
    res.status(200).json({ success: false, result: null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;