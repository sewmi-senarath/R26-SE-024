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
const router  = express.Router();
const axios   = require('axios');
const CheckIn = require('../../models/caregiver/CheckIn');
const { calculateBurnoutRisk } = require('../../utils/burnoutCalculator');

const ML_URL = 'http://localhost:5001';

// ── POST /api/caregiver/insights/checkin ──────────────────────────────────
router.post('/checkin', async (req, res) => {
  try {
    const { caregiverId, ...formData } = req.body;

    if (!caregiverId) {
      return res.status(400).json({
        success: false,
        message: 'caregiverId is required',
      });
    }

    // Call ML API
    const mlResponse = await axios.post(
      `${ML_URL}/predict`, formData, { timeout: 10000 }
    );
    const result = mlResponse.data;

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'ML prediction failed',
      });
    }

    // Today's date
    const today = new Date().toISOString().split('T')[0];

    // Save to MongoDB
    const checkIn = await CheckIn.findOneAndUpdate(
      { caregiverId, checkInDate: today },
      {
        caregiverId,
        checkInDate:         today,
        sleepHours:          formData.sleepHours,
        physicalTiredness:   formData.physicalTiredness,
        mood:                formData.mood,
        emotionalOverwhelm:  formData.emotionalOverwhelm,
        hoursCaregiving:     formData.hoursCaregiving,
        tasksAssigned:       formData.tasksAssigned,
        tasksCompleted:      formData.tasksCompleted,
        difficultSituations: formData.difficultSituations,
        breaksTaken:         formData.breaksTaken,
        mentallyExhausted:   formData.mentallyExhausted,
        difficultyManaging:  formData.difficultyManaging,
        emotionallyDrained:  formData.emotionallyDrained,
        stressLevel:         result.stressLevel,
        stressScore:         result.stressScore,
        confidence:          result.confidence,
      },
      { upsert: true, new: true }
    );

    // Get last 7 days for burnout
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCheckIns = await CheckIn.find({
      caregiverId,
      checkInDate: { $gte: sevenDaysAgo.toISOString().split('T')[0] },
    }).sort({ checkInDate: 1 });

    // Calculate burnout risk
    const burnoutRisk = calculateBurnoutRisk(recentCheckIns);

    // Update burnout fields
    await CheckIn.findByIdAndUpdate(checkIn._id, {
      burnoutRiskScore: burnoutRisk.riskScore,
      burnoutRiskLevel: burnoutRisk.riskLevel,
    });

    // Get weekly chart data
    const weeklyData = buildWeeklyData(recentCheckIns);

    res.status(200).json({
      success: true,
      result: {
        stressLevel:  result.stressLevel,
        stressScore:  result.stressScore,
        confidence:   result.confidence,
        message:      result.message,
        tips:         result.tips,
        submittedAt:  result.submittedAt,
        burnout: {
          riskScore:       burnoutRisk.riskScore,
          riskLevel:       burnoutRisk.riskLevel,
          trend:           burnoutRisk.trend,
          forecast:        burnoutRisk.forecast,
          factors:         burnoutRisk.factors,
          daysAnalyzed:    burnoutRisk.daysAnalyzed,
          avgStressScore:  burnoutRisk.avgStressScore,
          avgSleep:        burnoutRisk.avgSleep,
          consecutiveHigh: burnoutRisk.consecutiveHigh,
        },
        weeklyData,
        stats: {
          avgSleep:       recentCheckIns.length > 0
            ? recentCheckIns.reduce((s,c) => s + c.sleepHours, 0) / recentCheckIns.length
            : formData.sleepHours,
          activeHours:    formData.hoursCaregiving,
          tasksCompleted: formData.tasksCompleted,
          breaksTaken:    formData.breaksTaken,
        },
      },
    });

  } catch (error) {
    console.error('[Insight] Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'ML service not running. Start Flask API first.',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/caregiver/insights/latest/:caregiverId ───────────────────────
router.get('/latest/:caregiverId', async (req, res) => {
  try {
    const { caregiverId } = req.params;

    // Get latest check-in
    const latest = await CheckIn.findOne({ caregiverId })
      .sort({ checkInDate: -1 });

    if (!latest) {
      return res.status(200).json({ success: false, result: null });
    }

    // Get last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCheckIns = await CheckIn.find({
      caregiverId,
      checkInDate: { $gte: sevenDaysAgo.toISOString().split('T')[0] },
    }).sort({ checkInDate: 1 });

    const burnoutRisk = calculateBurnoutRisk(recentCheckIns);
    const weeklyData  = buildWeeklyData(recentCheckIns);

    res.status(200).json({
      success: true,
      result: {
        stressLevel: latest.stressLevel,
        stressScore: latest.stressScore,
        confidence:  latest.confidence,
        message:     getStressMessage(latest.stressLevel),
        tips:        getStressTips(latest.stressLevel),
        submittedAt: latest.createdAt,
        burnout: {
          riskScore:    burnoutRisk.riskScore,
          riskLevel:    burnoutRisk.riskLevel,
          trend:        burnoutRisk.trend,
          forecast:     burnoutRisk.forecast,
          factors:      burnoutRisk.factors,
          daysAnalyzed: burnoutRisk.daysAnalyzed,
        },
        weeklyData,
        stats: {
          avgSleep:       recentCheckIns.length > 0
            ? recentCheckIns.reduce((s,c) => s + c.sleepHours, 0) / recentCheckIns.length
            : 0,
          activeHours:    recentCheckIns.length > 0
            ? recentCheckIns.reduce((s,c) => s + c.hoursCaregiving, 0) / recentCheckIns.length
            : 0,
          tasksCompleted: recentCheckIns.reduce((s,c) => s + c.tasksCompleted, 0),
          breaksTaken:    recentCheckIns.length > 0
            ? recentCheckIns.reduce((s,c) => s + c.breaksTaken, 0) / recentCheckIns.length
            : 0,
        },
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/caregiver/insights/history/:caregiverId ──────────────────────
router.get('/history/:caregiverId', async (req, res) => {
  try {
    const { caregiverId } = req.params;
    const days = parseInt(req.query.days) || 7;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const checkIns = await CheckIn.find({
      caregiverId,
      checkInDate: { $gte: fromDate.toISOString().split('T')[0] },
    }).sort({ checkInDate: 1 });

    res.status(200).json({
      success:    true,
      checkIns:   checkIns,
      weeklyData: buildWeeklyData(checkIns),
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Helper: build 7-day chart data ────────────────────────────────────────
const buildWeeklyData = (checkIns) => {
  const days    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const result  = days.map(d => ({
    day:        d,
    stress:     0,
    tasks:      0,
    hasData:    false,
  }));

  checkIns.forEach(c => {
    const date    = new Date(c.checkInDate);
    const dayIdx  = date.getDay();
    result[dayIdx] = {
      day:     days[dayIdx],
      stress:  c.stressScore * 10,
      tasks:   c.tasksCompleted,
      hasData: true,
    };
  });

  // Reorder to start from Monday
  const monday = result.slice(1).concat(result[0]);
  return monday;
};

// ── Helpers ────────────────────────────────────────────────────────────────
const getStressMessage = (level) => ({
  Low:      'You are managing well today. Keep taking care of yourself!',
  Moderate: 'You have had a busy day. Watch your energy levels carefully.',
  High:     'High stress detected. Please take a break and seek support.',
}[level] || '');

const getStressTips = (level) => ({
  Low:      ['Keep up your healthy habits!','Maintain your sleep schedule.','Continue taking regular breaks.'],
  Moderate: ['Take a break every 2 hours.','Delegate tasks if possible.','Drink water and step outside.'],
  High:     ['Take a break now.','Ask for help with your workload.','Try a 5-minute breathing exercise.'],
}[level] || []);

module.exports = router;