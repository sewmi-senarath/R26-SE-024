const express = require('express');
const router = express.Router();

const { protect, authorize, resolveOwnPatientRecord } = require('../../middleware/auth');
const { generateQuiz, answerQuestion } = require('../../controllers/patient/storyQuizController');

router.use(protect, authorize('patient'), resolveOwnPatientRecord);

router.post('/generate', generateQuiz);
router.post('/:attemptId/answer', answerQuestion);

module.exports = router;
