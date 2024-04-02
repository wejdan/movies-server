const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/appError");

const checkAuth = async (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      return next(new AppError("Authentication failed!", 403));
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedToken.userId).select(
      "+passwordLastChanged"
    );

    if (!user) {
      return next(new AppError("user no longer exist.", 403));
    }

    // Assuming you store a 'passwordChangedAt' timestamp and include an 'iat' (issued at) claim in your JWT
    if (
      user.passwordLastChanged &&
      decodedToken.iat < new Date(user.passwordLastChanged).getTime() / 1000
    ) {
      return next(
        new AppError("User password has changed. Please log in again.", 401)
      );
    }

    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    next(new AppError("Authentication failed!", 403));
  }
};
const restrictTo = (...roles) => {
  return async (req, res, next) => {
    // User ID is available from the checkAuth middleware
    const userId = req.userData.userId;

    try {
      // Find the user by ID to check their role
      const user = await User.findById(userId);

      if (!user) {
        return next(new AppError("User no longer exists.", 403));
      }

      // Check if the user's role is included in the roles allowed to access the route
      if (!roles.includes(user.role)) {
        // User's role is not allowed
        return next(
          new AppError(
            "You do not have permission to perform this action.",
            403
          )
        );
      }

      // User has permission
      next();
    } catch (err) {
      next(new AppError("Access restricted.", 403));
    }
  };
};

const checkAdmin = async (req, res, next) => {
  try {
    // Ensure user data is available; this relies on checkAuth having been called first
    if (!req.userData || !req.userData.userId) {
      return next(new AppError("Access Denied / Unauthorized request", 401));
    }

    // Fetch the user based on userId set by checkAuth
    const user = await User.findById(req.userData.userId);

    if (!user) {
      return next(new AppError("user no longer exist.", 403));
    }

    // Check if the user is an admin
    if (!user.isAdmin) {
      return next(new AppError("Access denied. Admins only.", 403));
    }

    // Proceed if the user is an admin
    next();
  } catch (error) {
    return next(new AppError("Access Denied / Unauthorized request", 401));
  }
};

module.exports = {
  checkAuth,
  checkAdmin,
  restrictTo,
};
