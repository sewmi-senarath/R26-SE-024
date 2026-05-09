const mongoose = require("mongoose");

function createHttpError(message, statusCode = 400, details = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function validateGameSessionPayload(payload) {
  const required = [
    "gameId",
    "patientId",
    "difficulty",
    "score",
    "maxScore",
    "timeTaken",
    "correctAnswers",
    "totalAnswers",
    "completedAt",
  ];
  const missing = required.filter((key) => payload?.[key] === undefined || payload?.[key] === null);

  if (missing.length) {
    throw createHttpError("Missing required fields", 400, { missing });
  }

  if (!["easy", "medium", "hard"].includes(payload.difficulty)) {
    throw createHttpError("Invalid difficulty", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(payload.patientId)) {
    throw createHttpError("Invalid patientId", 400);
  }

  for (const key of ["score", "maxScore", "timeTaken", "correctAnswers", "totalAnswers"]) {
    if (typeof payload[key] !== "number" || Number.isNaN(payload[key]) || payload[key] < 0) {
      throw createHttpError(`${key} must be a non-negative number`, 400);
    }
  }

  if (Number.isNaN(Date.parse(payload.completedAt))) {
    throw createHttpError("completedAt must be a valid date", 400);
  }
}

module.exports = {
  createHttpError,
  validateGameSessionPayload,
};
