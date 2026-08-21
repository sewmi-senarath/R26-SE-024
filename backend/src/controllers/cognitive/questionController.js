const { success } = require("../../utils/responseFormatter");
const questionService = require("../../services/cognitive/questionService");

async function getQuestions(req, res, next) {
  try {
    const questions = await questionService.listActiveQuestions();
    return success(res, { questions, total: questions.length }, "Questions fetched");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getQuestions,
};