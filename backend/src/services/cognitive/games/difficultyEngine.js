const { GAME_CONTENT } = require("./staticGameContent");

// ── Tuning ────────────────────────────────────────────────────────────────
// "Balanced" responsiveness: difficulty is re-evaluated on a rolling window of
// the last WINDOW sessions of a game, and never changes again until COOLDOWN
// further sessions have been played at the new level. Together with the
// "every session in the window must clear PROMOTE_MIN_EACH" rule, this keeps
// the level stable instead of bouncing between tiers on a single lucky/unlucky
// game. Time is captured too (each change is timestamped), but the *unit* of
// adaptation is games played, not calendar time - an elderly patient may play
// in bursts, and reacting to demonstrated ability is fairer than to the clock.
const WINDOW = 3; // sessions averaged for a decision
const COOLDOWN = 3; // sessions to hold a new level before re-evaluating
const PROMOTE_AVG = 80; // window average needed to move up a tier
const PROMOTE_MIN_EACH = 70; // every session in the window must clear this too
const DEMOTE_AVG = 45; // window average at/below which we ease the level

// Composite = how well the patient did, blending three signals. Accuracy (raw
// score) dominates; correctness rate rewards answering more items right; speed
// is a lighter nudge so a fast-but-wrong game never looks like mastery.
const WEIGHTS = { accuracy: 0.55, correctnessRate: 0.25, speedScore: 0.2 };

const ORDER = ["easy", "medium", "hard"];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value) => Math.round(value);
const mean = (values) =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;

function timeLimitFor(gameId, difficulty) {
  const limit = GAME_CONTENT[gameId]?.[difficulty]?.timeLimitSeconds;
  return typeof limit === "number" && limit > 0 ? limit : null;
}

// Faster-than-half the allowed time scores full marks; going well over the
// limit floors out. Untimed levels get a neutral score so speed neither helps
// nor hurts a game that was never racing a clock.
function computeSpeedScore(gameId, difficulty, timeTaken) {
  const limit = timeLimitFor(gameId, difficulty);
  if (!limit) return 70; // neutral baseline for untimed levels
  if (!(timeTaken > 0)) return 70;

  const ratio = timeTaken / limit;
  if (ratio <= 0.5) return 100;
  if (ratio >= 1.2) return 30;
  // Linear from (0.5 → 100) down to (1.2 → 30).
  return round(100 - ((ratio - 0.5) / 0.7) * 70);
}

// Turn one raw session into normalized 0-100 metrics + a blended composite.
function computeSessionMetrics(session) {
  const { gameId, difficulty, score, maxScore, correctAnswers, totalAnswers, timeTaken } =
    session;

  const accuracy = maxScore > 0 ? clamp((score / maxScore) * 100, 0, 100) : 0;
  const correctnessRate =
    totalAnswers > 0 ? clamp((correctAnswers / totalAnswers) * 100, 0, 100) : accuracy;
  const speedScore = computeSpeedScore(gameId, difficulty, timeTaken);

  const composite = round(
    accuracy * WEIGHTS.accuracy +
      correctnessRate * WEIGHTS.correctnessRate +
      speedScore * WEIGHTS.speedScore,
  );

  return {
    accuracy: round(accuracy),
    correctnessRate: round(correctnessRate),
    speedScore: round(speedScore),
    composite: clamp(composite, 0, 100),
  };
}

// Decide whether the level should move, given the current tier, how long it has
// been held, and the recent composite window. Pure - no persistence here.
function decideDifficulty({ currentDifficulty, sessionsSinceLastChange, window }) {
  const tierIndex = ORDER.indexOf(currentDifficulty);
  const avg = round(mean(window));

  if (window.length < WINDOW) {
    return {
      changed: false,
      difficulty: currentDifficulty,
      avgComposite: avg,
      reason: `Getting to know your level - difficulty is reviewed after ${WINDOW} games at ${currentDifficulty}.`,
    };
  }

  if (sessionsSinceLastChange < COOLDOWN) {
    return {
      changed: false,
      difficulty: currentDifficulty,
      avgComposite: avg,
      reason: `Settling in at ${currentDifficulty} - we'll review the level again after a few more games.`,
    };
  }

  const consistentlyStrong = window.every((s) => s >= PROMOTE_MIN_EACH);
  if (avg >= PROMOTE_AVG && consistentlyStrong && tierIndex < ORDER.length - 1) {
    const to = ORDER[tierIndex + 1];
    return {
      changed: true,
      direction: "up",
      difficulty: to,
      avgComposite: avg,
      reason: `Great progress - your last ${WINDOW} games averaged ${avg}%, so we raised the challenge from ${currentDifficulty} to ${to}.`,
    };
  }

  if (avg <= DEMOTE_AVG && tierIndex > 0) {
    const to = ORDER[tierIndex - 1];
    return {
      changed: true,
      direction: "down",
      difficulty: to,
      avgComposite: avg,
      reason: `Recent games averaged ${avg}%, so we eased the level from ${currentDifficulty} to ${to} to help you keep succeeding.`,
    };
  }

  return {
    changed: false,
    difficulty: currentDifficulty,
    avgComposite: avg,
    reason: `${currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)} looks like the right fit right now - recent games averaged ${avg}%.`,
  };
}

module.exports = {
  computeSessionMetrics,
  decideDifficulty,
  WINDOW,
  COOLDOWN,
  ORDER,
};
