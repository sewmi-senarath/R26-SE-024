const { success } = require("../../utils/responseFormatter");
const personalizedGameContentService = require("../../services/cognitive/games/personalizedGameContentService");
const { attachGeneratedImages } = require("../../services/cognitive/games/imageGenerationService");

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
