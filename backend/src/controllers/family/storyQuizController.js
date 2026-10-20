const StoryQuizAttempt = require('../../models/family/StoryQuizAttempt');
const Memory = require('../../models/family/FamilyMemory');
const Patient = require('../../models/caregiver/Patient');
const SessionOutcome = require('../../models/family/SessionOutcome');
const { tryGenerateStoryQuiz } = require('../../services/family/storyQuizService');
const { computeDecision } = require('../../services/family/decisionEngine');
const { runFollowUpScan } = require('../../services/family/followUpScanner');

// Decide (stage 3), hook #2 — recall is finally known now that the quiz is
// complete. Recomputes and overwrites the matching SessionOutcome's
// decision (saved earlier, mood-only, by finalizeSession — see
// emotionController.js). Reuses that earlier decision's stored `inputs`
// for moodLift/framesUsed/framesTotal/category rather than re-deriving
// them, since they were already computed once and audited there.
const recomputeDecisionAfterQuiz = async (attempt) => {
  const outcome = await SessionOutcome.findOne({ sessionId: attempt.sessionId });
  if (!outcome || !outcome.decision) return; // no matching session (shouldn't happen) — nothing to update

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

  // Check (stage 6) — this session is now meaningful (real recall known);
  // see if it's the follow-up to any earlier acted-on, pending session
  await runFollowUpScan(outcome);
};

// strips the server-only fields (correctOptionIndex, sourceSnippet) so an
// unanswered question's answer is never sent to the client ahead of time
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

// --- GENERATE — called right after a story-listening session finalizes.
//     Tries the AI quiz service; on any failure, quiz stays null and no
//     document is created (see storyQuizService.js for why: FamilyMemory
//     has no structured fields to build a reliable non-AI question from) ---
const generateQuiz = async (req, res) => {
  try {
    const { memoryId, sessionId } = req.body;
    const patientId = req.linkedPatientId;

    if (!memoryId || !sessionId) {
      return res.status(400).json({ success: false, message: 'memoryId and sessionId are required' });
    }

    // idempotency guard — never regenerate or double-call the AI service
    // for a session that already has an attempt (TTS-done + tracker
    // cleanup can plausibly fire more than once)
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

// --- ANSWER one question at a time — never a bulk submit, since a wrong
//     answer needs an immediate re-read prompt, not a final-summary reveal ---
const answerQuestion = async (req, res) => {
  try {
    const { questionIndex, selectedOptionIndex } = req.body;
    const patientId = req.linkedPatientId;

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

// --- PATCH mark a completed quiz as seen by the family (mirrors
//     markReactionSeen in eventController.js) ---
const markQuizSeen = async (req, res) => {
  try {
    const attempt = await StoryQuizAttempt.findById(req.params.attemptId);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Quiz attempt not found' });
    }
    if (attempt.patientId.toString() !== req.linkedPatientId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this quiz' });
    }

    attempt.seenByFamilyAt = new Date();
    await attempt.save();

    res.status(200).json({ success: true, attempt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { generateQuiz, answerQuestion, markQuizSeen };
