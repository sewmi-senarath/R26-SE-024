const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { getTaskCompletionReport } = require('../../controllers/caregiver/Reportcontroller');

// ✅ Same protection pattern as taskRoutes — caregivers only
router.get('/task-completion', protect, authorize('caregiver'), getTaskCompletionReport);

module.exports = router;