const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect, authorize } = require('../../middleware/auth');
const Assessment = require('../../models/cognitive/Assessment');
const User = require('../../models/auth/User');
const SeverityPrediction = require('../../models/cognitive/SeverityPrediction');
const RiskScreening = require('../../models/cognitive/RiskScreening');

// Mirrors backend/ml/caregiver -> backend/src/routes/caregiver/insightRoutes.js pattern.
// Dementia Flask API runs on its own port so it can be started/restarted
// independently of the caregiver stress model.
const ML_URL = 'http://localhost:5002';

// POST /api/cognitive/dementia/predict/:patientId
// Pulls the patient's latest completed assessment score + profile info,
// calls the ML model, and returns both the ML prediction and the existing
// rule-based severity (from scoringService) so they can be compared. Also
// persists a SeverityPrediction row so the Reporting tab can chart this
// over time instead of only ever seeing the most recent call.
router.post('/predict/:patientId', protect, authorize('patient', 'caregiver', 'family'), async (req, res) => {
  try {
    const { patientId } = req.params;

    const [patient, latestAssessment] = await Promise.all([
      User.findById(patientId),
      Assessment.findOne({ patientId, status: 'done' }).sort({ completedAt: -1 }),
    ]);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    if (!latestAssessment) {
      return res.status(404).json({
        success: false,
        message: 'No completed assessment found for this patient yet',
      });
    }

    const payload = {
      age: patient.age || 75,
      // educationYears / ses aren't collected yet in the User model -
      // sensible defaults are used until those fields are added to onboarding.
      educationYears: 12,
      ses: 3,
      totalScore: latestAssessment.adjustedScore ?? latestAssessment.totalScore,
      sex: patient.gender ? patient.gender[0].toUpperCase() : '',
    };

    const mlResponse = await axios.post(`${ML_URL}/predict`, payload);
    const result = mlResponse.data;

    if (!result.success) {
      return res.status(500).json({ success: false, message: 'ML model prediction failed' });
    }

    // Fire-and-forget-ish, but awaited so a save failure doesn't silently
    // vanish - if it fails we still return the prediction to the caller.
    try {
      await SeverityPrediction.create({
        patientId,
        basedOnAssessment: latestAssessment.sessionId,
        severity: result.severity,
        confidence: result.confidence,
        probabilities: result.probabilities,
        ruleBasedSeverity: result.ruleBasedSeverity,
        agreesWithRule: result.agreesWithRule,
        message: result.message,
      });
    } catch (saveErr) {
      console.error('[Dementia] Failed to persist SeverityPrediction:', saveErr.message);
    }

    res.status(200).json({
      success: true,
      result: {
        severity: result.severity,
        confidence: result.confidence,
        probabilities: result.probabilities,
        ruleBasedSeverity: result.ruleBasedSeverity,
        agreesWithRule: result.agreesWithRule,
        message: result.message,
        basedOnAssessment: latestAssessment.sessionId,
        submittedAt: result.submittedAt,
      },
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Dementia ML service not running. Start backend/ml/dementia/app.py first.',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/cognitive/dementia/predict/:patientId/history
// All past severity predictions for this patient, most recent first - used
// by the Reporting tab to chart severity/confidence trends over time.
router.get('/predict/:patientId/history', protect, authorize('patient', 'caregiver', 'family'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const history = await SeverityPrediction.find({ patientId }).sort({ createdAt: -1 }).limit(limit);
    res.status(200).json({ success: true, result: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/cognitive/dementia/screen/:patientId
// Behavioral risk screener - NO cognitive test required. The caregiver/family
// member fills out a short observation checklist (memory complaints,
// confusion, disorientation, personality changes, etc.) and this calls the
// screener model for an early risk read, complementary to /predict above
// which needs a completed formal assessment. Good as a prompt to schedule
// the full MemoCare assessment sooner if risk comes back elevated. Also
// persists a RiskScreening row for the Reporting tab's history view.
router.post('/screen/:patientId', protect, authorize('patient', 'caregiver', 'family'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const checklist = req.body; // { memoryComplaints, behavioralProblems, confusion, ... }

    // patientId may be a real registered User (patient self-flow, or a
    // caregiver's linked patient) OR a caregiver-only Patient record with no
    // login of its own - in that case this just resolves to null and the
    // checklist's own age/gender fields (already known to the caregiver) are
    // used instead. Either way this route should never 404 on that alone.
    const patient = await User.findById(patientId).catch(() => null);

    const payload = {
      ...checklist,
      age: checklist.age ?? patient?.age ?? 75,
      gender: checklist.gender ?? patient?.gender ?? '',
    };

    const mlResponse = await axios.post(`${ML_URL}/predict-risk`, payload);
    const result = mlResponse.data;

    if (!result.success) {
      return res.status(500).json({ success: false, message: 'Risk screening failed' });
    }

    try {
      await RiskScreening.create({
        patientId,
        checklist: {
          memoryComplaints: !!checklist.memoryComplaints,
          behavioralProblems: !!checklist.behavioralProblems,
          confusion: !!checklist.confusion,
          disorientation: !!checklist.disorientation,
          personalityChanges: !!checklist.personalityChanges,
          difficultyCompletingTasks: !!checklist.difficultyCompletingTasks,
          forgetfulness: !!checklist.forgetfulness,
        },
        riskProbability: result.riskProbability,
        riskLevel: result.riskLevel,
        topFactors: result.topFactors,
        message: result.message,
        submittedBy: req.user?.userId || null,
      });
    } catch (saveErr) {
      console.error('[Dementia] Failed to persist RiskScreening:', saveErr.message);
    }

    res.status(200).json({
      success: true,
      result: {
        riskProbability: result.riskProbability,
        riskLevel: result.riskLevel,
        message: result.message,
        topFactors: result.topFactors,
        submittedAt: result.submittedAt,
      },
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Dementia ML service not running. Start backend/ml/dementia/app.py first.',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/cognitive/dementia/screen/:patientId/history
router.get('/screen/:patientId/history', protect, authorize('patient', 'caregiver', 'family'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const history = await RiskScreening.find({ patientId }).sort({ createdAt: -1 }).limit(limit);
    res.status(200).json({ success: true, result: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
