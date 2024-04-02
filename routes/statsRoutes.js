const express = require("express");
const router = express.Router();
const statControllers = require("../controllers/stat-controllers");
const { body } = require("express-validator");
const {
  checkAuth,
  checkAdmin,
  restrictTo,
} = require("../middleware/check-auth");

// Assuming you have a function to get the highest rated movies
router.get(
  "/highestRated",
  checkAuth,
  restrictTo("admin"),
  statControllers.getHighestRatedMovies
);
router.get(
  "/totalUsers",
  checkAuth,
  restrictTo("admin"),
  statControllers.getTotalUsers
);
router.get(
  "/totalReviews",
  checkAuth,
  restrictTo("admin"),
  statControllers.getTotalReviews
);
router.get(
  "/totalMovies",
  checkAuth,
  restrictTo("admin"),
  statControllers.getTotalMovies
);
router.get(
  "/recentUpload",
  checkAuth,
  restrictTo("admin"),
  statControllers.getRecentUploads
);

module.exports = router;
