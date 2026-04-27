const Question = require("../../models/cognitive/Question");

async function listActiveQuestions() {
  return Question.find({ isActive: true }).sort({ order: 1 }).lean();
}

module.exports = {
  listActiveQuestions,
};