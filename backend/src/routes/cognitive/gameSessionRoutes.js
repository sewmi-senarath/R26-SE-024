const express = require("express");
const {
  createSession,
  getPatientSessions,
} = require("../../controllers/cognitive/gameSessionController");
const { getContent } = require("../../controllers/cognitive/gameContentController");
const { protect } = require("../../middleware/auth");

const gameRoutes = express.Router();

gameRoutes.get("/content/:gameId/:patientId/:difficulty", protect, getContent);
gameRoutes.get("/sessions/patient/:patientId", protect, getPatientSessions);
gameRoutes.post("/sessions", createSession);

module.exports = gameRoutes;
