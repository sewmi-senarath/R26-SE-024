function createHttpError(message, statusCode = 400, details = null) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.details = details;
    return error;
  }
  
  function validateCreateSession(payload) {
    const required = ["patientId", "caregiverId"];
    const missing = required.filter((key) => !payload?.[key]);
  
    if (missing.length) {
      throw createHttpError("Missing required fields", 400, { missing });
    }
  }
  
  function validateAnswerPayload(payload) {
    if (!payload?.questionId) {
      throw createHttpError("questionId is required", 400);
    }
  
    if (!Object.prototype.hasOwnProperty.call(payload, "answer")) {
      throw createHttpError("answer is required", 400);
    }
  }
  
  module.exports = {
    createHttpError,
    validateCreateSession,
    validateAnswerPayload,
  };