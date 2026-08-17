const express    = require('express');
const router     = express.Router();
const RecommendationFeedback = require('../../models/caregiver/RecommendationFeedback');

// ── POST /api/caregiver/recommendations/feedback ───────────────────────────
// Save caregiver feedback on a recommendation
router.post('/feedback', async (req, res) => {
  try {
    const {
      caregiverId,
      recommendationId,
      category,
      title,
      feedback,
      stressLevel,
      stressScore,
    } = req.body;

    if (!caregiverId || !recommendationId || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'caregiverId, recommendationId and feedback are required',
      });
    }

    // Save feedback
    const record = await RecommendationFeedback.create({
      caregiverId,
      recommendationId,
      category,
      title,
      feedback,
      stressLevel,
      stressScore,
    });

    console.log(`[Recommendation] ${feedback} for ${recommendationId} by ${caregiverId}`);

    res.status(201).json({
      success: true,
      message: 'Feedback saved successfully',
      record,
    });

  } catch (error) {
    console.error('[Recommendation] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/caregiver/recommendations/priorities/:caregiverId ─────────────
// Get recommendation priorities based on feedback history
router.get('/priorities/:caregiverId', async (req, res) => {
  try {
    const { caregiverId } = req.params;

    // Get all feedback for this caregiver
    const allFeedback = await RecommendationFeedback.find({ caregiverId });

    // Calculate priority adjustments per recommendation
    const priorityMap = {};

    allFeedback.forEach(fb => {
      const id = fb.recommendationId;
      if (!priorityMap[id]) {
        priorityMap[id] = { helpful: 0, not_helpful: 0, score: 0 };
      }
      if (fb.feedback === 'helpful') {
        priorityMap[id].helpful += 1;
        priorityMap[id].score   += 1;
      } else {
        priorityMap[id].not_helpful += 1;
        priorityMap[id].score       -= 1;
      }
    });

    // Determine boosted and suppressed recommendations
    const boosted    = [];
    const suppressed = [];

    Object.entries(priorityMap).forEach(([id, data]) => {
      if (data.score >= 3)       boosted.push(id);
      else if (data.score <= -3) suppressed.push(id);
    });

    res.status(200).json({
      success:     true,
      priorityMap,
      boosted,
      suppressed,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/caregiver/recommendations/history/:caregiverId ───────────────
// Get feedback history
router.get('/history/:caregiverId', async (req, res) => {
  try {
    const { caregiverId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const history = await RecommendationFeedback
      .find({ caregiverId })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({ success: true, history });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;