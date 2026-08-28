const { success } = require("../../utils/responseFormatter");
const personalizedGameContentService = require("../../services/cognitive/games/personalizedGameContentService");
const { attachGeneratedImages } = require("../../services/cognitive/games/imageGenerationService");
const { SEQUENCE_ITEMS } = require("../../services/cognitive/games/staticGameContent");

const MEMORY_RECALL_DISTRACTOR_COUNT = 3;

// Build decoy options for the Memory Recall grid from the shared pool, excluding
// anything already used as a correct item. Generating them here (rather than on
// the client) means they flow through the same image pipeline as the real
// items, so every tile gets a picture and the answer isn't given away by an
// emoji-vs-image difference. De-duping by label also prevents the same object
// appearing twice (e.g. two "Pizza" tiles).
function buildMemoryDistractors(items, count) {
  const used = new Set(
    (items || []).map((i) => String(i.label || "").trim().toLowerCase())
  );
  const pool = SEQUENCE_ITEMS.filter(
    (i) => !used.has(String(i.label || "").trim().toLowerCase())
  );
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).map((item, idx) => ({
    ...item,
    id: `distractor_${idx}_${item.id}`,
  }));
}

// Fill in AI-generated images for any item that has no real photo yet, so the
// games show pictures instead of emojis. Runs for every content tier (LLM,
// rule-based, static) because all of them return through here. Games without an
// items/objects/words list (orientation, face-name) are left untouched.
// baseUrl is this server's origin so devices can reach cached image files.
async function withGeneratedImages(config, baseUrl) {
  if (!config) return config;
  if (config.items) config.items = await attachGeneratedImages(config.items, baseUrl);
  if (config.objects) config.objects = await attachGeneratedImages(config.objects, baseUrl);
  if (config.words) config.words = await attachGeneratedImages(config.words, baseUrl);
  if (config.distractors)
    config.distractors = await attachGeneratedImages(config.distractors, baseUrl);
  return config;
}

async function getContent(req, res, next) {
  try {
    const { gameId, patientId, difficulty } = req.params;
    const { config, personalized } =
      await personalizedGameContentService.getPersonalizedGameContent({
        gameId,
        patientId,
        difficulty,
        requestUser: req.user,
      });

    // Memory Recall needs decoy tiles; generate them here so they pass through
    // the same image pipeline as the correct items (uniform look, no repeats).
    if (gameId === "memory_recall" && config && Array.isArray(config.items)) {
      config.distractors = buildMemoryDistractors(
        config.items,
        MEMORY_RECALL_DISTRACTOR_COUNT
      );
    }

    await withGeneratedImages(config, `${req.protocol}://${req.get("host")}`);

    return success(
      res,
      { config, personalized },
      personalized ? "Personalized game content loaded" : "Static game content loaded"
    );
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getContent,
};
