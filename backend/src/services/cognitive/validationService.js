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

    if (payload.drawing != null) validateDrawing(payload.drawing);
  }

  const MAX_DRAWING_STROKES = 200;
  const MAX_DRAWING_BYTES = 200 * 1024;

  // A saved drawing is { width, height, strokes: [{ d, color, strokeWidth }] }.
  function validateDrawing(drawing) {
    const isNum = (n) => typeof n === "number" && Number.isFinite(n) && n > 0;
    const { width, height, strokes } = drawing || {};

    if (!isNum(width) || !isNum(height) || !Array.isArray(strokes)) {
      throw createHttpError("drawing must have width, height and strokes", 400);
    }
    if (strokes.length > MAX_DRAWING_STROKES) {
      throw createHttpError("drawing has too many strokes", 400);
    }
    const badStroke = strokes.some(
      (s) =>
        typeof s?.d !== "string" ||
        typeof s?.color !== "string" ||
        !isNum(s?.strokeWidth),
    );
    if (badStroke) {
      throw createHttpError("drawing strokes are malformed", 400);
    }
    if (Buffer.byteLength(JSON.stringify(drawing)) > MAX_DRAWING_BYTES) {
      throw createHttpError("drawing is too large", 413);
    }
  }

  module.exports = {
    createHttpError,
    validateCreateSession,
    validateAnswerPayload,
    validateDrawing,
  };