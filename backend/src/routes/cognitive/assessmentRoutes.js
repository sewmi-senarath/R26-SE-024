const express = require("express");
const {
  createSession,
  getSession,
  submitAnswer,
  updateProgress,
  completeSession,
  getPatientAssessments,
} = require("../../controllers/cognitive/assessmentController");

const assessmentRoutes = express.Router();

assessmentRoutes.post("/", createSession);
assessmentRoutes.get("/patient/:patientId/history", getPatientAssessments);
assessmentRoutes.get("/:sessionId", getSession);
assessmentRoutes.patch("/:sessionId/answer", submitAnswer);
assessmentRoutes.patch("/:sessionId/progress", updateProgress);
assessmentRoutes.post("/:sessionId/complete", completeSession);

module.exports = assessmentRoutes;
