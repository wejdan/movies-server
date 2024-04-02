const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const moviesControllers = require("../controllers/movies-controller");
const reviewControllers = require("../controllers/review-controllers");
const reviewRoutes = require("./reviewRoutes");

const mongoose = require("mongoose");

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDirectory = "uploads/"; // Default directory
    if (file.fieldname === "poster") {
      uploadDirectory += "movies/posters"; // Directory for posters
    } else if (file.fieldname === "trailer") {
      uploadDirectory += "movies/trailers"; // Directory for trailers
    }
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "poster" && file.mimetype.startsWith("image/")) {
    cb(null, true); // Allow upload
  } else if (
    file.fieldname === "trailer" &&
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true); // Allow upload
  } else {
    // If the conditions are not met, reject the file
    cb(new Error(`Unsupported file type for ${file.fieldname}`), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });
// Route for uploading place images

const { body } = require("express-validator");
const {
  checkAdmin,
  checkAuth,
  restrictTo,
} = require("../middleware/check-auth");
const {
  validateObjectId,
  validateRequest,
} = require("../middleware/check-input");

//router.get("/movies/:actorId", actorControllers.getActorMovies);
router.get("/search", moviesControllers.searchMovies);
router.get("/generas", moviesControllers.getGeneras);
router.get("/featured-movies", moviesControllers.getFeaturedMovies);

router.get(
  "/genre/:genreId",
  validateObjectId("genreId"),
  moviesControllers.getMoviesByGenra
);
router.get(
  "/similar-movies/:movieId",
  validateObjectId("movieId"),
  moviesControllers.getSimilarMovies
);

router.post(
  "/",
  checkAuth,
  restrictTo("admin"),
  upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "trailer", maxCount: 1 },
  ]),
  (req, res, next) => {
    const fieldsToParse = ["writers", "casts", "tags", "genre"];
    fieldsToParse.forEach((field) => {
      if (typeof req.body[field] === "string") {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (e) {
          // Handle or log error if parsing fails
          console.error(`Error parsing ${field}:`, e);
        }
      }
    });
    next();
  },
  [
    body("title").trim().not().isEmpty().withMessage("Title must not be empty"),
    body("description")
      .trim()
      .not()
      .isEmpty()
      .withMessage("Description must not be empty"),
    body("language")
      .trim()
      .not()
      .isEmpty()
      .withMessage("Language must not be empty"),
    body("type")
      .isIn(["Movie", "Series"])
      .withMessage("Type must be either 'Movie' or 'Series'"),
    body("status")
      .isIn(["Released", "Upcoming", "In Production"])
      .withMessage("Invalid status"),
    // body("releaseDate").isISO8601().withMessage("Invalid release date"),
    // Ensure 'genre' contains valid MongoDB ObjectIDs
    body("genre.*")
      .custom((value) => {
        console.log(
          "Validating genre ID:",
          value,
          "IsValid:",
          mongoose.Types.ObjectId.isValid(value)
        );
        return mongoose.Types.ObjectId.isValid(value);
      })
      .withMessage("Invalid genre ID"),
    // Ensure 'tags' contains valid MongoDB ObjectIDs
    // Validate 'director' as a valid MongoDB ObjectID

    // Validate each writer in 'writers' array as a valid MongoDB ObjectID

    // Validate casts: ensure each actor in 'casts' array is a valid MongoDB ObjectID and role is not empty
    body("casts.*.actor")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid actor ID"),
    body("casts.*.role")
      .trim()
      .not()
      .isEmpty()
      .withMessage("Role must not be empty"),
  ],
  validateRequest,
  moviesControllers.createMovie // The controller function to handle actor creation.
);
router.get("/", moviesControllers.getMovies);

router.get(
  "/:movieId",
  validateObjectId("movieId"),
  moviesControllers.getMovieById
);

router.delete(
  "/:movieId",
  checkAuth,
  restrictTo("admin"),
  validateObjectId("movieId"),
  moviesControllers.deleteMovie
);
router.use("/:movieId/reviews", validateObjectId("movieId"), reviewRoutes);
module.exports = router;
