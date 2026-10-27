const { AppError } = require("../errors");

const send = (res, status, code, message) =>
  res.status(status).json({ error: { code, message } });

// Runs when no route matched
function notFound(req, res) {
  send(res, 404, "NOT_FOUND", `Route ${req.method} ${req.path} was not found.`);
}

// Express recognises an error handler by its FOUR parameters
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) return send(res, err.status, err.code, err.message);
  if (err.type === "entity.too.large") return send(res, 413, "PAYLOAD_TOO_LARGE", "The request body is too large.");
  if (err.type === "entity.parse.failed") return send(res, 400, "INVALID_JSON", "The request body is not valid JSON.");

  // Unknown bug: log the details here, but never show them to the user
  console.error("Unexpected error:", err);
  return send(res, 500, "INTERNAL_ERROR", "Something went wrong on the server.");
}

module.exports = { notFound, errorHandler };