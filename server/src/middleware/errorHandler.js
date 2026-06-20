// src/middleware/errorHandler.js
// Catches any error thrown in a route and turns it into a clean JSON
// response instead of crashing the server or leaking a stack trace.

export function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.status || 500;
  const message =
    status === 500 ? "Something went wrong on our end" : err.message;

  res.status(status).json({ error: message });
}

// Wraps an async route handler so thrown errors are passed to
// errorHandler automatically instead of needing try/catch everywhere.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
