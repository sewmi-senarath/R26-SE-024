// Pre-fetch (warm) the real photos for the whole built-in game vocabulary, so
// that at play time every image is already cached on this server and loads
// instantly. Run once (and again whenever you add catalog items):
//
//   npm run seed:images
//
// Novel words the LLM invents for a specific patient are still generated on
// first sight, but the common vocabulary below covers the bulk of what players
// see. Safe to re-run — already-cached images are skipped.

require("dotenv").config();

const {
  SEQUENCE_ITEMS,
  RECALL_OBJECTS,
} = require("../services/cognitive/games/staticGameContent");
const {
  warmToCache,
  isCached,
} = require("../services/cognitive/games/imageGenerationService");

// A few common personalization terms that aren't in the static catalog but show
// up often via the rule-based tier (festivals, foods, places, occupations).
const EXTRA_TERMS = [
  "Lantern", "Lamp", "Star", "Candle", "Moon", "Dates", "Sweets",
  "Rice", "Curry", "Bread", "Cake", "Tea", "Coffee", "Fish", "Soup",
  "Temple", "Church", "Mosque", "Beach", "Park", "Garden", "School",
  "Textbook", "Chalk", "Paddy", "Hoe", "Pot", "Spoon", "Hammer", "Wood",
  "Needle", "Thread", "Wheel", "Keys", "Stethoscope", "Medicine", "Bandage",
];

// We warm the two picture-heavy recall games (memory_recall, object_recall)
// plus common personalization terms. Word-puzzle clue images are left to
// on-demand generation — only one shows at a time and it has an emoji fallback.
function collectTerms() {
  const terms = [
    ...(SEQUENCE_ITEMS || []).map((i) => i.label),
    ...(RECALL_OBJECTS || []).map((i) => i.label),
    ...EXTRA_TERMS,
  ].filter(Boolean);

  // De-dupe case-insensitively.
  const seen = new Set();
  const unique = [];
  terms.forEach((term) => {
    const key = String(term).trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(String(term).trim());
    }
  });
  return unique;
}

// Images are rendered by fal.ai (FLUX schnell), which handles concurrent
// requests, so a handful of parallel workers finishes the catalog quickly.
async function run() {
  const terms = collectTerms();
  const CONCURRENCY = 4;
  let done = 0;
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`Warming ${terms.length} game images into the cache...`);

  const queue = [...terms];
  async function worker() {
    while (queue.length) {
      const term = queue.shift();
      done += 1;
      if (isCached(term)) {
        skipped += 1;
        console.log(`  [${done}/${terms.length}] cached already: ${term}`);
        continue;
      }
      const ok = await warmToCache(term);
      if (ok) {
        generated += 1;
        console.log(`  [${done}/${terms.length}] generated: ${term}`);
      } else {
        failed += 1;
        console.warn(`  [${done}/${terms.length}] FAILED: ${term}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  console.log(
    `\nDone. generated=${generated} skipped=${skipped} failed=${failed} total=${terms.length}`
  );
  process.exit(failed && !generated ? 1 : 0);
}

run().catch((err) => {
  console.error("Image seeding crashed:", err);
  process.exit(1);
});
