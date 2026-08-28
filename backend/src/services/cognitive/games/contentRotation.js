const PatientContentHistory = require("../../../models/cognitive/PatientContentHistory");
const { shuffle } = require("./gameContentUtils");

// Games whose content is drawn from a shared pool and therefore benefits from
// "don't repeat for a few sessions" rotation. Personalized items (a patient's
// own family / foods / places) are always kept regardless - rotation only ever
// gates the generic pool that pads a round out, so personalization is preserved.
const ROTATION_GAMES = new Set([
  "memory_recall",
  "object_recall",
  "word_puzzle",
  "grid_flash",
  "listen_repeat",
  "memory_match",
]);

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

// Load the rolling window of recently-served keys for one patient+game.
// Returns oldest -> newest. Never throws: on any DB error it degrades to "no
// history" so a game is never blocked by rotation bookkeeping.
async function loadRecentKeys(patientId, gameId) {
  try {
    const doc = await PatientContentHistory.findOne({ patientId, gameId }).lean();
    return Array.isArray(doc && doc.recentKeys) ? doc.recentKeys : [];
  } catch (error) {
    console.warn("[content-rotation] load failed:", error.message);
    return [];
  }
}

// Append the keys served this round and keep only the most recent `windowSize`.
// Failures are logged, never thrown, so recording can never break a response.
async function recordServedKeys(patientId, gameId, servedKeys, windowSize) {
  const keys = (servedKeys || []).map(normalizeKey).filter(Boolean);
  if (!keys.length) return;

  try {
    const doc = await PatientContentHistory.findOne({ patientId, gameId });
    const existing = Array.isArray(doc && doc.recentKeys) ? doc.recentKeys : [];
    // Drop any just-served key from its old position, then re-append at the end
    // so the window reflects true recency, and trim to the window size.
    const served = new Set(keys);
    const merged = [...existing.filter((key) => !served.has(key)), ...keys];
    const trimmed = merged.slice(-Math.max(windowSize, keys.length));

    await PatientContentHistory.updateOne(
      { patientId, gameId },
      { $set: { recentKeys: trimmed } },
      { upsert: true }
    );
  } catch (error) {
    console.warn("[content-rotation] record failed:", error.message);
  }
}

// Pick `count` items from `pool`, preferring ones whose key is NOT in the recent
// window so a returning patient sees fresh content. When there aren't enough
// fresh items (small pool / large window), the shortfall is filled with the
// LEAST recently seen items - the game always gets a full round.
function rotateSample(pool, count, recentKeys, keyOf) {
  const recencyRank = new Map();
  recentKeys.forEach((key, index) => recencyRank.set(key, index)); // higher = more recent

  const fresh = [];
  const seen = [];
  pool.forEach((item) => {
    if (recencyRank.has(normalizeKey(keyOf(item)))) seen.push(item);
    else fresh.push(item);
  });

  const freshShuffled = shuffle(fresh);
  if (freshShuffled.length >= count) return freshShuffled.slice(0, count);

  // Top up with the oldest-seen items first (lowest recency rank).
  seen.sort(
    (a, b) => recencyRank.get(normalizeKey(keyOf(a))) - recencyRank.get(normalizeKey(keyOf(b)))
  );
  return [...freshShuffled, ...seen].slice(0, count);
}

module.exports = {
  ROTATION_GAMES,
  loadRecentKeys,
  recordServedKeys,
  rotateSample,
  normalizeKey,
};
