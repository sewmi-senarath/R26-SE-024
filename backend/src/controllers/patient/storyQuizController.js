const StoryQuizAttempt = require('../../models/family/StoryQuizAttempt');
const Memory = require('../../models/family/FamilyMemory');
const Patient = require('../../models/caregiver/Patient');
const SessionOutcome = require('../../models/family/SessionOutcome');
const { tryGenerateStoryQuiz } = require('../../services/family/storyQuizService');
const { computeDecision } = require('../../services/family/decisionEngine');
const { runFollowUpScan } = require('../../services/family/followUpScanner');

// see family-side storyQuizController.js::recomputeDecisionAfterQuiz
const recomputeDecisionAfterQuiz = async (attempt) => {
  const outcome = await SessionOutcome.findOne({ sessionId: attempt.sessionId });
  if (!outcome || !outcome.decision) return;

  const priorInputs = outcome.decision.inputs || {};
  const recallScore = attempt.questions.length ? attempt.score / attempt.questions.length : null;

  outcome.decision = computeDecision({
    moodLift: outcome.moodLift,
    framesUsed: priorInputs.framesUsed,
    framesTotal: priorInputs.framesTotal,
    recallScore,
    quizDetail: { questions: attempt.questions.map((q) => ({
      questionText: q.questionText, isCorrect: q.isCorrect, sourceSnippet: q.sourceSnippet,
    })) },
    reaction: priorInputs.reaction,
    category: priorInputs.category,
  });
  await outcome.save();

  await runFollowUpScan(outcome);
};

// Same logic as the family-side storyQuizController.js, just scoped to the
// logged-in patient's own resolved care record instead of a linked one —
// deliberately duplicated rather than shared, same reasoning the patient
// emotionController.js documents (an edit here can't affect the
// already-verified family pipeline).

const sanitizeQuestion = (q) => ({
  questionText: q.questionText,
  options: q.options,
  selectedOptionIndex: q.selectedOptionIndex,
  isCorrect: q.isCorrect,
});

const sanitizeAttempt = (attempt) => ({
  attemptId: attempt._id,
  memoryId: attempt.memoryId,
  sessionId: attempt.sessionId,
  status: attempt.status,
  score: attempt.score,
  totalQuestions: attempt.questions.length,
  questions: attempt.questions.map(sanitizeQuestion),
});

const generateQuiz = async (req, res) => {
  try {
    const { memoryId, sessionId } = req.body;
    const patientId = req.resolvedPatientId;

    if (!memoryId || !sessionId) {
      return res.status(400).json({ success: false, message: 'memoryId and sessionId are required' });
    }

    const existing = await StoryQuizAttempt.findOne({ sessionId });
    if (existing) {
      if (existing.patientId.toString() !== patientId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this quiz' });
      }
      return res.status(200).json({ success: true, quiz: sanitizeAttempt(existing) });
    }

    const memory = await Memory.findById(memoryId);
    if (!memory) {
      return res.status(404).json({ success: false, message: 'Memory not found' });
    }
    if (memory.patientId.toString() !== patientId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to quiz this memory' });
    }

    const patient = await Patient.findById(patientId);

    const questions = await tryGenerateStoryQuiz({
      generatedStory: memory.generatedStory,
      familyNote: memory.familyNote,
      category: memory.category,
      patientName: patient ? patient.name : '',
    });

    if (!questions) {
      return res.status(200).json({ success: true, quiz: null });
    }

    const attempt = await StoryQuizAttempt.create({
      patientId,
      memoryId,
      sessionId,
      questions,
      generationSource: 'ai',
    });

    res.status(201).json({ success: true, quiz: sanitizeAttempt(attempt) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const answerQuestion = async (req, res) => {
  try {
    const { questionIndex, selectedOptionIndex } = req.body;
    const patientId = req.resolvedPatientId;

    const attempt = await StoryQuizAttempt.findById(req.params.attemptId);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Quiz attempt not found' });
    }
    if (attempt.patientId.toString() !== patientId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this quiz' });
    }
    if (
      !Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= attempt.questions.length ||
      !Number.isInteger(selectedOptionIndex)
    ) {
      return res.status(400).json({ success: false, message: 'questionIndex and selectedOptionIndex are required' });
    }

    const question = attempt.questions[questionIndex];
    if (question.selectedOptionIndex !== null) {
      return res.status(409).json({ success: false, message: 'This question has already been answered' });
    }

    question.selectedOptionIndex = selectedOptionIndex;
    question.isCorrect = selectedOptionIndex === question.correctOptionIndex;
    question.answeredAt = new Date();

    const allAnswered = attempt.questions.every((q) => q.selectedOptionIndex !== null);
    let quizComplete = false;
    if (allAnswered) {
      attempt.score = attempt.questions.filter((q) => q.isCorrect).length;
      attempt.status = 'completed';
      quizComplete = true;
    }

    await attempt.save();

    if (quizComplete) {
      await recomputeDecisionAfterQuiz(attempt);
    }

    res.status(200).json({
      success: true,
      questionIndex,
      isCorrect: question.isCorrect,
      correctOptionIndex: question.correctOptionIndex,
      sourceSnippet: question.sourceSnippet,
      quizComplete,
      score: quizComplete ? attempt.score : null,
      totalQuestions: attempt.questions.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { generateQuiz, answerQuestion };
