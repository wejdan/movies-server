const User = require("../models/User"); // Assuming you have a User model
const Review = require("../models/Review"); // Assuming you have a Review model
const Movie = require("../models/Movie"); // Assuming you have a Movie model
const AppError = require("../utils/appError");

const getHighestRatedMovies = async (req, res, next) => {
  try {
    const highestRatedMovies = await Movie.find({})
      .sort({ averageRating: -1 }) // Sort movies by averageRating in descending order
      .limit(5) // Limit to top 5
      .exec(); // Execute the query

    res.json(
      highestRatedMovies.map((item) => ({
        movieId: item._id,
        averageRating: item.averageRating,
        movieDetails: item,
      }))
    );
  } catch (error) {
    next(error);
  }
};

const getTotalUsers = async (req, res, next) => {
  try {
    // Logic to count the total number of users
    const userCount = await User.countDocuments();
    res.status(200).json({ totalUsers: userCount });
  } catch (error) {
    next(error);
  }
};

const getTotalReviews = async (req, res, next) => {
  try {
    // Logic to count the total number of reviews
    const reviewCount = await Review.countDocuments();
    res.status(200).json({ totalReviews: reviewCount });
  } catch (error) {
    next(error);
  }
};

const getTotalMovies = async (req, res, next) => {
  try {
    // Logic to count the total number of movies
    const movieCount = await Movie.countDocuments();
    res.status(200).json({ totalMovies: movieCount });
  } catch (error) {
    next(error);
  }
};

const getRecentUploads = async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 5; // Default to 5 movies if not specified

  try {
    const recentMovies = await Movie.find()
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .limit(limit) // Limit the number of results
      .populate("genre", "name") // Assuming you want to show genre names
      .populate("director", "name") // Populate director name
      .exec(); // Execute the query

    res.status(200).json(recentMovies);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHighestRatedMovies,
  getTotalUsers,
  getTotalReviews,
  getTotalMovies,
  getRecentUploads,
};
