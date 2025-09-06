// Middleware for centralized error handling.
const errorHandler = (err, req, res, next) => {
  // Log the error for debugging. In production, consider using a more robust logger.
  console.error(err.stack);

  // If headers have already been sent (e.g., during streaming),
  // delegate to the default Express handler, which will close the connection.
  if (res.headersSent) {
    return next(err);
  }

  // Define a status code and error message.
  const statusCode = err.statusCode || 500;
  const message = err.message || "An internal server error occurred.";

  // Send a standardized JSON error response.
  res.status(statusCode).json({
    error: "Falha na requisição",
    details: message,
  });
};

export default errorHandler;
