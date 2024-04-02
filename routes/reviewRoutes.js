const express = require("express");
const router = express.Router({ mergeParams: true }); // Make sure mergeParams is true
const reviewControllers = require("../controllers/review-controllers");
const { body } = require("express-validator");
const { checkAuth } = require("../middleware/check-auth");
const { validateObjectId } = require("../middleware/check-input");

// Assuming you have a function to get the highest rated movies
router.get("/userRating", checkAuth, reviewControllers.getMovieRatedByUser);
router.get("/", reviewControllers.getMovieReviews);

router.post(
  "/",
  checkAuth,
  [
    body("rating")
      .isFloat({ min: 0, max: 10 }) // Ensure rating is a float between 0 and 5
      .withMessage("Rating must be between 0 and 5"),
    body("comment").not().isEmpty().withMessage("Comment must not be empty"),
  ],
  reviewControllers.createReview // Corrected to use the createReview function
);
router.patch(
  "/:reviewId",
  checkAuth,
  validateObjectId("reviewId"),
  [
    body("rating")
      .isFloat({ min: 0, max: 10 }) // Ensure rating is a float between 0 and 5
      .withMessage("Rating must be between 0 and 5"),
    body("comment").not().isEmpty().withMessage("Comment must not be empty"),
  ],
  reviewControllers.updateReview // Corrected to use the createReview function
);
// Get average rating for a movie
router.get(
  "/average",

  reviewControllers.getMovieAverageRating
);

module.exports = router;
