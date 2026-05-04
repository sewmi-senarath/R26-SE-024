const { fail } = require("../utils/responseFormatter");

function notFoundHandler(req, res) {
  return fail(res, `Route not found: ${req.originalUrl}`, 404);
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  const details = err.details || null;

  if (process.env.NODE_ENV !== "test") {
    console.error("[ERROR]", message, details || "", err.stack || "");
  }

  return fail(res, message, statusCode, details);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};