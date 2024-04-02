const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const fs = require("fs");
const { validationResult } = require("express-validator");

// Middleware to validate MongoDB ObjectID
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(
        new AppError(`Invalid ID format for parameter: ${paramName}.`, 400)
      );
    }
    next();
  };
};
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Handle single file upload cleanup
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error cleaning up file:", err);
      });
    }

    // Handle multiple files upload cleanup
    if (req.files) {
      // Assuming req.files is an array of files
      // Adjust according to your actual structure, it might be an object if using fields
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error cleaning up file:", err);
          });
        });
    }

    const errorMessage = errors
      .array()
      .map((err) => err.msg)
      .join(". ");
    return next(new AppError(`Invalid inputs: ${errorMessage}`, 422));
  }

  next(); // Proceed to the next middleware if no errors
};
module.exports = {
  validateObjectId,
  validateRequest,
};
