const AppError = require("../utils/appError");
const handleDuplicateKeyError = (error) => {
  const fieldName = Object.keys(error.keyValue)[0];
  const value = error.message.match(/(["'])(\\?.)*?\1/)[0];
  const message = `The ${fieldName} '${value}' is already used. Please use another ${fieldName}.`;
  return new AppError(message, 400); // 400 Bad Request
};

// Handle Mongoose validation errors
const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400); // 400 Bad Request
};

// Handle invalid MongoDB ID errors
const handleInvalidIdError = (error) => {
  return new AppError("Invalid ID. The ID does not exist.", 400); // 400 Bad Request
};
const handleDevErrors = (error, res) => {
  res.status(error.statusCode || 500).json({
    message: error.message || "An unknown error occurred",
    stack: error.stack,
    error,
  });
};

const handleProdErrors = (error, res) => {
  if (error.isOperational) {
    res.status(error.statusCode || 500).json({
      message: error.message || "An unknown error occurred",
    });
  } else {
    console.error("ERROR 💥", error); // Log the error details for the developer
    res.status(500).json({
      message: "An unknown error occurred",
    });
  }
};

const notFoundError = (req, res, next) => {
  next(new AppError("Could not find this route.", 404));
};

const globalErrorHandler = (error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }

  let err = { ...error };
  err.message = error.message;
  console.log(error.code, error.code === 11000);
  // Check for specific error types and handle them
  if (error.name === "ValidationError") err = handleValidationError(err);
  if (error.code === 11000) err = handleDuplicateKeyError(err);
  if (error.name === "CastError") err = handleInvalidIdError(err);

  // Environment-specific error handling
  if (process.env.NODE_ENV === "development") {
    handleDevErrors(err, res);
  } else {
    // In production, mark all errors not explicitly handled as operational
    if (!err.isOperational) {
      console.error("ERROR 💥", err);
      err = new AppError("An unknown error occurred", 500);
    }
    handleProdErrors(err, res);
  }
};

module.exports = { notFoundError, globalErrorHandler };
