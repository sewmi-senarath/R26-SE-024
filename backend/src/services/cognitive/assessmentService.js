const crypto = require("crypto");
const Assessment = require("../../models/cognitive/Assessment");
const { listActiveQuestions } = require("./questionService");
const { buildScoreSnapshot } = require("./scoringService");
const { createHttpError } = require("./validationService");

async function getActiveQuestions() {
  return listActiveQuestions();
}

async function createAssessmentSession(payload) {
  const questions = await getActiveQuestions();

  const doc = await Assessment.create({
    sessionId: crypto.randomUUID(),
    patientId: payload.patientId,
    caregiverId: payload.caregiverId,
    status: "active",
    totalQuestions: questions.length,
    locale: payload.locale || "en-AU",
    administrationMode: payload.administrationMode || "assisted",
    registrationWords: ["Apple", "Table", "Penny"],
    questionSetVersion: 1,
    startedAt: new Date(),
    lastModified: new Date(),
  });

  return doc;
}

async function getAssessmentBySessionId(sessionId) {
  const assessment = await Assessment.findOne({ sessionId });
  if (!assessment) throw createHttpError("Assessment session not found", 404);
  return assessment;
}

async function submitAnswer(sessionId, payload) {
  const [assessment, questions] = await Promise.all([
    getAssessmentBySessionId(sessionId),
    getActiveQuestions(),
  ]);

  if (assessment.status === "done") {
    throw createHttpError("Assessment is already completed", 409);
  }

  const question = questions.find((q) => q.questionId === payload.questionId);
  if (!question) {
    throw createHttpError("Invalid questionId", 400);
  }

  assessment.answers.set(payload.questionId, payload.answer);
  assessment.answeredAt.set(payload.questionId, payload.answeredAt || Date.now());

  if (typeof payload.timeSpentMs === "number") {
    assessment.timePerQuestion.set(payload.questionId, payload.timeSpentMs);
  }

  if (payload.skipped === true && !assessment.skipped.includes(payload.questionId)) {
    assessment.skipped.push(payload.questionId);
  }

  if (payload.questionId === "registration") assessment.recallWordsShown = true;
  if (payload.questionId === "attention_serial7") assessment.serial7Attempted = true;

  const snapshot = buildScoreSnapshot(questions, assessment.toObject());

  assessment.sectionScores = snapshot.sectionScores;
  assessment.totalScore = snapshot.totalScore;
  assessment.severity = snapshot.severity;
  assessment.impairmentFlag = snapshot.impairmentFlag;
  assessment.scoringLog = snapshot.scoringLog;
  assessment.lastModified = new Date();

  await assessment.save();

  return assessment;
}

async function updateProgress(sessionId, payload) {
  const assessment = await getAssessmentBySessionId(sessionId);

  if (typeof payload.currentQuestionIndex === "number") {
    assessment.currentQuestionIndex = payload.currentQuestionIndex;
  }
  if (typeof payload.questionStartTime === "number") {
    assessment.questionStartTime = payload.questionStartTime;
  }
  if (payload.timeLimit === null || typeof payload.timeLimit === "number") {
    assessment.timeLimit = payload.timeLimit;
  }
  if (typeof payload.timeExpired === "boolean") {
    assessment.timeExpired = payload.timeExpired;
  }

  assessment.lastModified = new Date();
  await assessment.save();
  return assessment;
}

async function completeAssessment(sessionId) {
  const [assessment, questions] = await Promise.all([
    getAssessmentBySessionId(sessionId),
    getActiveQuestions(),
  ]);

  const snapshot = buildScoreSnapshot(questions, assessment.toObject());

  assessment.sectionScores = snapshot.sectionScores;
  assessment.totalScore = snapshot.totalScore;
  assessment.severity = snapshot.severity;
  assessment.impairmentFlag = snapshot.impairmentFlag;
  assessment.scoringLog = snapshot.scoringLog;

  assessment.status = "done";
  assessment.completedAt = new Date();
  assessment.lastModified = new Date();

  await assessment.save();
  return assessment;
}

async function listAssessmentsByPatient(patientId) {
  return Assessment.find({ patientId }).sort({ createdAt: -1 }).lean();
}

module.exports = {
  createAssessmentSession,
  getAssessmentBySessionId,
  submitAnswer,
  updateProgress,
  completeAssessment,
  listAssessmentsByPatient,
};
