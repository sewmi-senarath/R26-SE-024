const { success } = require("../../utils/responseFormatter");
const gameSessionService = require("../../services/cognitive/games/gameSessionService");
const { validateGameSessionPayload } = require("../../services/cognitive/games/gameValidationService");

async function createSession(req, res, next) {
  try {
    validateGameSessionPayload(req.body);
    const session = await gameSessionService.createGameSession(req.body);
    return success(res, { session }, "Game session saved", 201);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createSession,
};
