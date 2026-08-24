const Question = require("../../models/cognitive/Question");

const ACTIVE_SECTIONS = ["Orientation", "Registration", "Attention", "Recall", "Language"];

function isSupportedAssessmentQuestion(question) {
  return ACTIVE_SECTIONS.includes(question.section);
}

async function listActiveQuestions() {
  const questions = await Question.find({ isActive: true }).sort({ order: 1 }).lean();
  return questions.filter(isSupportedAssessmentQuestion);
}

module.exports = {
  listActiveQuestions,
  isSupportedAssessmentQuestion,
};
