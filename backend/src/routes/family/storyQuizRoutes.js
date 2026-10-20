const express = require('express');
const router = express.Router();

const { protect, authorize, resolveLinkedPatient } = require('../../middleware/auth');
const { generateQuiz, answerQuestion, markQuizSeen } = require('../../controllers/family/storyQuizController');

router.use(protect, authorize('family'), resolveLinkedPatient);

router.post('/generate', generateQuiz);
router.post('/:attemptId/answer', answerQuestion);
router.patch('/:attemptId/seen', markQuizSeen);

module.exports = router;
