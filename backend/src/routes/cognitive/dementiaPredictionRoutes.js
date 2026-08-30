const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const Assessment = require('../../models/cognitive/Assessment');
const User = require('../../models/auth/User');
const SeverityPrediction = require('../../models/cognitive/SeverityPrediction');
const svc = require('../../services/cognitive/dementiaPrediction/dementiaPredictionService');

// Mirrors backend/ml/caregiver -> backend/src/routes/caregiver/insightRoutes.js.
// The dementia Flask API (backend/ml/dementia/app.py, port 5002) returns a
// 2-class triage (monitor / escalate, ~93% accuracy). It needs the patient's
// Functional Activities Questionnaire (FAQ) on file - see POST /faq.

const ROLES = ['patient', 'caregiver', 'family'];

// POST /api/cognitive/dementia/faq/:patientId
// Save one FAQ submission (10 items, each 0-3). `sessionId` (optional) ties it
// to the screening-test session it followed.
router.post('/faq/:patientId', protect, authorize(...ROLES), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { answers, sessionId } = req.body || {};
    const doc = await svc.saveFaq(patientId, answers, sessionId);
    return res.status(201).json({ success: true, result: doc });
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message, details: error.details });
  }
});

// GET /api/cognitive/dementia/faq/:patientId/latest
// Most recent FAQ for the patient, or null. The results screen uses this to
// decide whether to show the "complete the questionnaire" button.
router.get('/faq/:patientId/latest', protect, authorize(...ROLES), async (req, res) => {
  try {
    const doc = await svc.getLatestFaq(req.params.patientId);
    return res.status(200).json({ success: true, result: doc || null });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/cognitive/dementia/predict/:patientId
// Pulls the patient's latest completed assessment + latest FAQ, calls the ML
// model, returns the triage, and persists a SeverityPrediction row for the
// Reporting tab.
router.post('/predict/:patientId', protect, authorize(...ROLES), async (req, res) => {
  try {
    const { patientId } = req.params;

    const [patient, latestAssessment, faq] = await Promise.all([
      User.findById(patientId),
      Assessment.findOne({ patientId, status: 'done' }).sort({ completedAt: -1 }),
      svc.getLatestFaq(patientId),
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
    if (!faq) {
      return res.status(409).json({
        success: false,
        code: 'FAQ_REQUIRED',
        message: 'Complete the daily-living questionnaire to get a triage result.',
      });
    }

    const ml = await svc.requestPrediction({ patient, assessment: latestAssessment, faq });
    if (!ml || !ml.success) {
      return res.status(500).json({ success: false, message: 'ML model prediction failed' });
    }

    // Best-effort persist - a save failure must not lose the prediction.
    try {
      await svc.persistPrediction({ patientId, assessment: latestAssessment, faq, ml });
    } catch (saveErr) {
      console.error('[Dementia] Failed to persist SeverityPrediction:', saveErr.message);
    }

    return res.status(200).json({
      success: true,
      result: {
        triage: ml.triage,
        confidence: ml.confidence,
        probabilities: ml.probabilities,
        message: ml.message,
        basedOnAssessment: latestAssessment.sessionId,
        basedOnFaq: faq._id,
        submittedAt: ml.submittedAt,
      },
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Dementia ML service not running. Start backend/ml/dementia/app.py first.',
      });
    }
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
});

// GET /api/cognitive/dementia/predict/:patientId/history
// All past predictions for this patient, most recent first - used by the
// Reporting tab to chart triage trends over time.
router.get('/predict/:patientId/history', protect, authorize(...ROLES), async (req, res) => {
  try {
    const { patientId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const history = await SeverityPrediction.find({ patientId })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.status(200).json({ success: true, result: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
