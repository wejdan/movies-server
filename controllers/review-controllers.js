const { validationResult } = require("express-validator");
const fs = require("fs");
const { default: mongoose } = require("mongoose");
// controllers/review-controllers.js
const Review = require("../models/Review");
const Movie = require("../models/Movie");
const AppError = require("../utils/appError");

// No need to import User and Profile models since we're only using the Review model

const getMovieReviews = async (req, res, next) => {
  const { movieId } = req.params;
  try {
    // First, find the movie to get the title
    const movie = await Movie.findById(movieId).select("title");
    if (!movie) {
      return next(new AppError("Movie not found.", 404));
    }

    // Then, find all reviews for the movie and populate the user's name
    const movieReviews = await Review.find({ movie: movieId })
      .populate("user", "name") // Simplified populate for user's name
      .exec();

    const reviews = movieReviews.map((review) => ({
      id: review._id.toString(),
      user: {
        name: review.user.name,
      },
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    }));

    // Combine the movie title with the reviews into a single object
    const result = {
      movieTitle: movie.title,
      reviews: reviews, // An array of review objects
    };

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  // Extracting the userId from req.userData set by the checkAuth middleware
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Cleanup uploaded files if validation fails

    return next(new AppError(errors.array(), 422));
  }

  const userId = req.userData.userId;

  // Now, you can use this userId to associate the review with the user
  // Example usage:
  try {
    const { rating, comment } = req.body;
    const { movieId } = req.params; // Extract movieId from request parameters

    const newReview = new Review({
      user: userId,
      movie: movieId,
      rating,
      comment,
    });

    await newReview.save();

    res
      .status(201)
      .json({ message: "Review created successfully", review: newReview });
  } catch (error) {
    next(error);
  }
};

const getMovieAverageRating = async (req, res, next) => {
  const { movieId } = req.params;

  try {
    const averageRating = await Review.aggregate([
      { $match: { movie: mongoose.Types.ObjectId(movieId) } },
      { $group: { _id: null, averageRating: { $avg: "$rating" } } },
    ]);

    res.json({ averageRating: averageRating[0]?.averageRating || 0 });
  } catch (error) {
    next(error);
  }
};

const getMovieRatedByUser = async (req, res, next) => {
  const userId = req.userData.userId;
  const { movieId } = req.params; // Assuming the movieId is passed as a URL parameter
  console.log("getMovieRatedByUser", req.params);
  try {
    // Fetch the specific review made by the user for the given movie
    const review = await Review.findOne(
      {
        user: userId,
        movie: movieId,
      },
      "rating comment createdAt"
    );

    if (!review) {
      console.log("no review");

      return res.json(null); // Return null if no review is found
    }

    // If a review is found, return its details without the movie title
    const reviewDetails = {
      id: review._id.toString(),
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    };
    console.log("reviewDetails", reviewDetails);
    res.json(reviewDetails);
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array(), 422));
  }

  const userId = req.userData.userId; // Extracted by checkAuth middleware
  const { rating, comment } = req.body;
  const { reviewId } = req.params; // Get review ID from URL parameters

  try {
    // Attempt to find the review by reviewId ensuring it belongs to the user
    const review = await Review.findOne({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      return next(
        new AppError(
          "Review not found or you do not have permission to update this review.",
          404
        )
      );
    }

    // Update the review with new values
    review.rating = rating;
    review.comment = comment;

    await review.save(); // Save the updated review

    res.json({ message: "Review updated successfully", review });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getMovieReviews,

  getMovieAverageRating,
  getMovieRatedByUser,
  updateReview,
};
