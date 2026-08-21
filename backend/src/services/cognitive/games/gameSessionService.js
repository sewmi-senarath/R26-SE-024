const GameSession = require("../../../models/cognitive/GameSession");

async function createGameSession(payload) {
  return GameSession.create({
    gameId: payload.gameId,
    patientId: payload.patientId,
    difficulty: payload.difficulty,
    score: payload.score,
    maxScore: payload.maxScore,
    timeTaken: payload.timeTaken,
    correctAnswers: payload.correctAnswers,
    totalAnswers: payload.totalAnswers,
    completedAt: new Date(payload.completedAt),
  });
}

async function getGameSessionsForPatient(patientId) {
  return GameSession.find({ patientId }).sort({ completedAt: -1 }).lean();
}

module.exports = {
  createGameSession,
  getGameSessionsForPatient,
};
