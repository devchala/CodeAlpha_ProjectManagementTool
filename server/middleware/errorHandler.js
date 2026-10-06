const config = require("../config/env");

const notFound = (req, res) => res.status(404).json({ message: "Not found" });

/**
 * One place that turns any error into a consistent `{ message }` JSON response.
 * Unexpected (500) errors are logged on the server but never leaked to the client.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = 500;
  let message = "Something went wrong. Please try again.";

  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Request body is not valid JSON.";
  } else if (err.type === "entity.too.large") {
    status = 413;
    message = "Request body is too large.";
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid id.";
  } else if (err.name === "ValidationError" && err.errors) {
    status = 400;
    message = Object.values(err.errors)[0]?.message || "Invalid data.";
  } else if (err.code === 11000) {
    status = 409;
    message = "That record already exists.";
  } else if (/^Mongo(Server|Network)/.test(err.name)) {
    status = 503;
    message = "The database is temporarily unavailable. Please try again.";
  }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, config.isProd ? err.message : err);
  }
  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };
