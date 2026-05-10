const express = require("express");
const {
  createSession,
  getSession,
  submitAnswer,
  updateProgress,
  completeSession,
  getPatientAssessments,
} = require("../../controllers/cognitive/assessmentController");

const router = express.Router();

router.post("/", createSession);
router.get("/patient/:patientId/history", getPatientAssessments);
router.get("/:sessionId", getSession);
router.patch("/:sessionId/answer", submitAnswer);
router.patch("/:sessionId/progress", updateProgress);
router.post("/:sessionId/complete", completeSession);

module.exports = router;
