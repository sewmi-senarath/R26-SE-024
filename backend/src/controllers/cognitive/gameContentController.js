const { success } = require("../../utils/responseFormatter");
const personalizedGameContentService = require("../../services/cognitive/games/personalizedGameContentService");

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
