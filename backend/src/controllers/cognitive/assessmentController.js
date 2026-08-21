const { success } = require("../../utils/responseFormatter");
const {
  validateCreateSession,
  validateAnswerPayload,
} = require("../../services/cognitive/validationService");
const assessmentService = require("../../services/cognitive/assessmentService");

async function createSession(req, res, next) {
  try {
    validateCreateSession(req.body);
    const session = await assessmentService.createAssessmentSession(req.body);
    return success(res, { session }, "Assessment session created", 201);
  } catch (error) {
    return next(error);
  }
}

async function getSession(req, res, next) {
  try {
    const session = await assessmentService.getAssessmentBySessionId(req.params.sessionId);
    return success(res, { session }, "Assessment session fetched");
  } catch (error) {
    return next(error);
  }
}

async function submitAnswer(req, res, next) {
  try {
    validateAnswerPayload(req.body);
    const session = await assessmentService.submitAnswer(req.params.sessionId, req.body);
    return success(res, { session }, "Answer submitted");
  } catch (error) {
    return next(error);
  }
}

async function updateProgress(req, res, next) {
  try {
    const session = await assessmentService.updateProgress(req.params.sessionId, req.body || {});
    return success(res, { session }, "Progress updated");
  } catch (error) {
    return next(error);
  }
}

async function completeSession(req, res, next) {
  try {
    const session = await assessmentService.completeAssessment(req.params.sessionId);
    return success(res, { session }, "Assessment completed");
  } catch (error) {
    return next(error);
  }
}

async function getPatientAssessments(req, res, next) {
  try {
    const sessions = await assessmentService.listAssessmentsByPatient(req.params.patientId);
    return success(res, { sessions, total: sessions.length }, "Patient assessments fetched");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createSession,
  getSession,
  submitAnswer,
  updateProgress,
  completeSession,
  getPatientAssessments,
};