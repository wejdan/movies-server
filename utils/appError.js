class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // Add a "message" property
    this.statusCode = statusCode; // Adds a "code" property for HTTP status code
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
