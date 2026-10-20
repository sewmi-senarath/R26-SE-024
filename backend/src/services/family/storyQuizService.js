const axios = require('axios');

// local, free, self-hosted quiz-generation model (ml-service/story-quiz-service) —
// NOT the Modal-hosted story-narrator (AI_SERVICE_URL), which a live probe
// confirmed is the wrong tool for structured quiz output (truncates,
// returns answer-text instead of an index, hallucination-guard misfires on
// quiz wording). Same <NAME>_ML_URL convention already used by
// CAREGIVER_ML_URL/DEMENTIA_ML_URL for the other Python microservices.
const QUIZ_ML_URL = process.env.QUIZ_ML_URL || 'http://localhost:5003';

// role-agnostic, like faceEmotionDetector.js is for emotion — shared by both
// the family and patient story-quiz controllers.
//
// Validation is stricter than eventController.js's tryAiCardText on
// purpose: a slightly-off card sentence just looks a bit generic, but a
// wrong "correct answer" actively misleads a dementia patient into
// thinking they misremembered something they actually got right.
//
// Requires all 3 questions — a 2-question quiz is a much noisier memory-
// recall signal (random guessing alone gets 2-of-2 right on 3-option
// questions 1-in-9 times, vs 1-in-27 for 3-of-3). The fix for an
// occasional weak question is the Python service retrying generation
// (ml-service/story-quiz-service/main.py's GENERATE_RETRIES) until it
// lands a clean 3, not accepting fewer here.
const MAX_QUESTION_LENGTH = 300;
const MIN_VALID_QUESTIONS = 3;

const isValidQuestion = (q) => {
  if (!q || typeof q !== 'object') return false;
  if (typeof q.question !== 'string' || !q.question.trim() || q.question.length > MAX_QUESTION_LENGTH) return false;
  if (!Array.isArray(q.options) || q.options.length !== 3) return false;
  if (!q.options.every((o) => typeof o === 'string' && o.trim().length > 0)) return false;
  const normalized = q.options.map((o) => o.trim().toLowerCase());
  if (new Set(normalized).size !== normalized.length) return false; // no duplicate options
  if (!Number.isInteger(q.correct_index) || q.correct_index < 0 || q.correct_index > 2) return false;
  if (q.source_snippet !== undefined && typeof q.source_snippet !== 'string') return false;
  return true;
};

// Node-side validation of the local quiz-generation service's response —
// see the request/response contract documented in the implementation plan
// (ml-service/story-quiz-service/main.py implements the other side of it).
// Returns a normalized array of exactly 3 questions ready for
// StoryQuizAttempt.create(...), or null if anything about the response
// can't be trusted (including: the service isn't running, timeout,
// network error, or a malformed/incomplete payload). Never throws — the
// caller always has a safe "skip the quiz" path.
const tryGenerateStoryQuiz = async ({ generatedStory, familyNote, category, patientName }) => {
  if (!generatedStory || !generatedStory.trim()) return null;

  try {
    const response = await axios.post(
      `${QUIZ_ML_URL}/generate-quiz`,
      {
        generated_story: generatedStory,
        family_note: familyNote || '',
        category: category || 'other',
        patient_name: patientName || 'them',
        num_questions: 3,
      },
      { timeout: 180000 } // generous — the Python service retries generation internally (up to 3x) to land a clean 3-question quiz
    );

    const data = response.data;
    if (!data || data.success !== true || !Array.isArray(data.questions) || data.questions.length < MIN_VALID_QUESTIONS) {
      console.warn('AI quiz generation returned an unusable shape, skipping quiz.');
      return null;
    }

    const validQuestions = data.questions.filter(isValidQuestion);
    if (validQuestions.length < MIN_VALID_QUESTIONS) {
      console.warn('AI quiz generation returned too few valid questions, skipping quiz.');
      return null;
    }

    return validQuestions.map((q) => ({
      questionText: q.question.trim(),
      options: q.options.map((o) => o.trim()),
      correctOptionIndex: q.correct_index,
      sourceSnippet: q.source_snippet ? q.source_snippet.trim() : '',
    }));
  } catch (error) {
    console.warn('AI quiz generation failed, skipping quiz for this session:', error.message);
    return null;
  }
};

module.exports = { tryGenerateStoryQuiz };
