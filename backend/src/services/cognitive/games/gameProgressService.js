const PatientGameProgress = require("../../../models/cognitive/PatientGameProgress");
const {
  computeSessionMetrics,
  decideDifficulty,
  WINDOW,
} = require("./difficultyEngine");

// How many composite scores we keep per game. Only the last WINDOW drive a
// decision; the rest feed the trend chart in the profile report.
const HISTORY_LENGTH = 10;

// Record one completed session and adapt the difficulty for that (patient,
// game). Returns a DifficultyProgressUpdate the client shows after the game.
// Self-contained and defensive: a bookkeeping failure must never break saving
// the session itself, so the controller treats a thrown error as "no update".
async function recordSessionAndAdapt(session) {
  const { patientId, gameId, difficulty } = session;
  const metrics = computeSessionMetrics(session);

  let progress = await PatientGameProgress.findOne({ patientId, gameId });
  if (!progress) {
    // First ever play: seed the tracked level from whatever it was played at
    // (that comes from the one-time assessment plan on the client).
    progress = new PatientGameProgress({ patientId, gameId, difficulty });
  }

  progress.totalSessions += 1;
  progress.sessionsSinceLastChange += 1;
  progress.recentScores = [...progress.recentScores, metrics.composite].slice(
    -HISTORY_LENGTH,
  );
  progress.lastMetrics = metrics;

  const window = progress.recentScores.slice(-WINDOW);
  const decision = decideDifficulty({
    currentDifficulty: progress.difficulty,
    sessionsSinceLastChange: progress.sessionsSinceLastChange,
    window,
  });

  const previousDifficulty = progress.difficulty;

  if (decision.changed) {
    const at = new Date();
    progress.difficulty = decision.difficulty;
    progress.sessionsSinceLastChange = 0;
    progress.lastChangeAt = at;
    progress.lastChangeReason = decision.reason;
    progress.changeHistory.push({
      from: previousDifficulty,
      to: decision.difficulty,
      direction: decision.direction,
      reason: decision.reason,
      avgComposite: decision.avgComposite,
      sessionComposite: metrics.composite,
      at,
    });
  }

  await progress.save();

  return {
    gameId,
    previousDifficulty,
    difficulty: progress.difficulty,
    changed: decision.changed,
    reason: decision.reason,
    compositeScore: metrics.composite,
    totalSessions: progress.totalSessions,
    recentScores: window,
  };
}

// Lean per-game state used by the games screen to override the assessment plan.
async function getProgressForPatient(patientId) {
  const rows = await PatientGameProgress.find({ patientId }).lean();
  return rows.map((row) => ({
    gameId: row.gameId,
    difficulty: row.difficulty,
    totalSessions: row.totalSessions,
    lastChangeAt: row.lastChangeAt ? row.lastChangeAt.toISOString() : null,
    lastChangeReason: row.lastChangeReason,
    recentScores: row.recentScores || [],
  }));
}

// Rich per-game report for the patient profile: current level, latest metric
// breakdown, the composite trend, and the full change timeline with reasons.
async function getDifficultyReport(patientId) {
  const rows = await PatientGameProgress.find({ patientId })
    .sort({ gameId: 1 })
    .lean();

  return rows.map((row) => {
    const scores = row.recentScores || [];
    const averageComposite = scores.length
      ? Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length)
      : null;

    return {
      gameId: row.gameId,
      currentDifficulty: row.difficulty,
      totalSessions: row.totalSessions,
      averageComposite,
      latestMetrics: row.lastMetrics || null,
      recentScores: scores,
      lastChangeAt: row.lastChangeAt ? row.lastChangeAt.toISOString() : null,
      changeCount: (row.changeHistory || []).length,
      changeHistory: (row.changeHistory || []).map((change) => ({
        from: change.from,
        to: change.to,
        direction: change.direction,
        reason: change.reason,
        avgComposite: change.avgComposite,
        at: change.at ? new Date(change.at).toISOString() : null,
      })),
    };
  });
}

module.exports = {
  recordSessionAndAdapt,
  getProgressForPatient,
  getDifficultyReport,
};
