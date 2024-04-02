const { validationResult } = require("express-validator");
const Movie = require("../models/Movie"); // Assuming this is the correct path to your Actor model
const mongoose = require("mongoose");

const Genre = require("../models/Genera"); // Adjust the path as necessary to where your Genre model is defined
const fs = require("fs");
const path = require("path");
const Review = require("../models/Review");
const AppError = require("../utils/appError");
// Assuming the existence of a "featured" field or you're using certain criteria to define "featured"
const getFeaturedMovies = async (req, res, next) => {
  try {
    const queryCondition = {
      // Define your criteria for featured movies here
      // For example, movies with a specific tag or upcoming movies
      // tags: { $in: ["Featured"] },
      status: "Released", // Example: Fetch only released movies
      // You can add more conditions to filter featured movies as per your requirements
    };

    const featuredMovies = await Movie.find(queryCondition)
      .populate("genre", "value") // Assuming you want to show genre names
      .populate("director", "name") // Populate director's name
      .populate("writers", "name") // Populate writers' names
      .populate("casts.actor", "name") // Populate actor names in casts
      .limit(10); // Limit the number of featured movies or use a query parameter

    const modifiedMovies = featuredMovies.map((movie) => {
      const movieObj = movie.toObject({ getters: true });
      // Customize the movie object as needed, for example, by adding an 'id' field
      return {
        ...movieObj,
        id: movieObj._id.toString(),
        _id: undefined, // Optionally remove the _id field
      };
    });

    res.json(modifiedMovies);
  } catch (error) {
    next(error);
  }
};

const getGeneras = async (req, res, next) => {
  try {
    const genres = await Genre.find(); // Fetch all genres
    const modifiedGenres = genres.map((genre) => {
      const genreObj = genre.toObject({ getters: true }); // Convert document to object
      // Replace _id with id in the response
      return {
        ...genreObj,
        id: genreObj._id.toString(), // Convert _id to string and assign to id
        _id: undefined, // Optionally remove the _id field
      };
    });
    res.json(modifiedGenres); // Send the modified genres as a JSON response
  } catch (error) {
    next(error);
  }
};

const getMovies = async (req, res, next) => {
  const searchQuery = req.query.query;
  const page = parseInt(req.query.page, 10) || 1; // Ensure base 10 is used for parsing
  const pageSize = 10; // Set a standard page size or make it configurable through an environment variable or query parameter

  const queryCondition = {};
  if (searchQuery) {
    // Apply case-insensitive regex search for actors by name
    queryCondition.title = { $regex: searchQuery, $options: "i" };
  }

  try {
    // Calculate the number of documents to skip for pagination
    const skipAmount = (page - 1) * pageSize;

    // Fetch the page of actors based on queryCondition, skipAmount, and pageSize
    const movies = await Movie.find(queryCondition)
      .skip(skipAmount)
      .limit(pageSize)
      .populate("genre") // Populate genres
      .populate("director", "name") // Populate director, showing only the name field
      .populate("writers", "name") // Populate writers, showing only the name field
      .populate("casts.actor", "name"); // Populate actors in casts, showing only the name field

    // Calculate total actors to determine the number of pages
    const totalMovies = await Movie.countDocuments(queryCondition);
    const totalPages = Math.ceil(totalMovies / pageSize);

    // Respond with actors data and pagination details
    res.json({
      movies: movies.map((movie) => {
        const movieObject = movie.toObject({ getters: true });
        // Option 1: Rename _id to id and remove _id
        movieObject.id = movieObject._id.toString();
        delete movieObject._id;

        // Option 2: Just add an id field, keep both _id and id
        // movieObject.id = movieObject._id.toString();

        return movieObject;
      }), // Convert each actor document to an object
      totalPages, // Total number of pages based on the totalActors and pageSize
      currentPage: page, // Current page number
      totalMovies, // Total number of actors matching the search query
    });
  } catch (error) {
    next(error);
  }
};

const searchMovies = async (req, res, next) => {
  const searchQuery = req.query.query;

  try {
    // Use a case-insensitive regex search to find actors matching the search query in their name
    const results = await Movie.find({
      name: { $regex: searchQuery, $options: "i" },
    }).limit(10); // Limit the results to 10 or any number you see fit

    // Transform the results to match the expected format for React Select
    const actors = results.map((actor) => ({
      value: actor._id.toString(),
      label: actor.name,
      image: actor.profile, // Assuming 'profile' is the field for the actor's image URL
    }));

    res.json(actors);
  } catch (error) {
    next(error);
  }
};
const createMovie = async (req, res, next) => {
  const {
    title,
    description,
    language,
    type,
    status,
    releaseDate,
    genre,
    director = null, // Default to null if not provided
    writers = [],
    casts,
    // Assuming tags are sent as an array of strings
    tags,
  } = req.body;

  let posterUrl = "";
  let trailerUrl = "";

  // Check if files were uploaded and construct URL path
  if (req.files) {
    if (req.files.poster) {
      posterUrl = path.join(
        "uploads",
        "movies",
        "posters",
        req.files.poster[0].filename
      );
    }
    if (req.files.trailer) {
      trailerUrl = path.join(
        "uploads",
        "movies",
        "trailers",
        req.files.trailer[0].filename
      );
    }
  }
  let movieData = {
    title,
    description,
    poster: posterUrl,
    trailer: trailerUrl,
    tags,
    genre,
    writers, // This will now correctly handle an empty array
    casts: casts.map((cast) => ({
      actor: cast.actor,
      role: cast.role,
    })),
    language,
    status,
    type,
    releaseDate: new Date(releaseDate),
  };
  if (director) {
    // Check if director is truthy, which includes checking for non-empty string
    movieData.director = director;
  }
  const createdMovie = new Movie(movieData);

  try {
    await createdMovie.save();
    res.status(201).json({ movie: createdMovie });
  } catch (error) {
    if (req.files) {
      const files =
        req.files.poster || req.files.trailer
          ? [...req.files.poster, ...req.files.trailer]
          : [];
      files.forEach((file) => {
        fs.unlink(file.path, (err) => {
          if (err)
            console.error("Error cleaning up file after failed creation:", err);
        });
      });
    }

    next(error);
  }
};

const deleteMovie = async (req, res, next) => {
  const movieId = req.params.movieId;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const deletedMovie = await Movie.findByIdAndDelete(movieId, {
      session: session,
    });
    if (!deletedMovie) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Movie not found.", 404));
      //return res.status(404).json({ message: "Movie not found." });
    }

    // Assuming the Review schema uses the movie field to reference the Movie model
    await Review.deleteMany({ movie: movieId }, { session: session });

    await session.commitTransaction();
    session.endSession();
    res
      .status(200)
      .json({ message: "Movie and associated reviews deleted successfully." });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    next(error);
  }
};
const getMoviesByGenra = async (req, res, next) => {
  const { genreId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10; // Default to 10 items per page if not specified

  try {
    const skip = (page - 1) * pageSize;
    const totalMovies = await Movie.countDocuments({
      genre: { $in: [genreId] },
    });
    const movies = await Movie.find({ genre: { $in: [genreId] } })
      .populate("genre director writers casts.actor")
      .skip(skip)
      .limit(pageSize);
    // const simulatedMovies = Array(pageSize)
    //   .fill(null)
    //   .map((_, index) =>
    //     movies[index % movies.length].toObject({ getters: true })
    //   );
    const category = await Genre.findById(genreId);
    res.json({
      movies: movies.map((movie) => movie.toObject({ getters: true })),
      totalMovies,
      category: category ? category.value : null, // Include category name in response
      totalPages: Math.ceil(totalMovies / pageSize),
      currentPage: page,
    });
  } catch (error) {
    console.error(err);

    next(error);
  }
};

const getMovieById = async (req, res, next) => {
  const movieId = req.params.movieId; // Assume the route parameter is named 'movieId'
  try {
    // Find the movie by ID and populate related fields
    // const averageRating = await Review.aggregate([
    //   { $match: { movie: new mongoose.Types.ObjectId(movieId) } },
    //   { $group: { _id: null, averageRating: { $avg: "$rating" } } },
    // ]);

    const movie = await Movie.findById(movieId)
      .populate("genre", "value") // Assuming you want to populate the 'name' of each genre
      .populate("director", "name") // Populate director's name
      .populate("writers", "name") // Populate writers' names
      .populate({
        path: "casts.actor",
        select: "name profile", // Specify the fields to include
      }); // Populate actors' names in casts

    if (!movie) {
      return next(new AppError("Movie not found.", 404));
    }

    // Convert the movie document to an object and customize the response as needed
    const movieData = movie.toObject({ getters: true });
    console.log(movieData);
    // Add any additional transformations or data here
    res.json(movieData);
  } catch (error) {
    next(error);
  }
};

const getSimilarMovies = async (req, res, next) => {
  const movieId = req.params.movieId;

  try {
    // Fetch the target movie to get its genres, director, casts, writers, and tags
    const targetMovie = await Movie.findById(movieId).lean();

    if (!targetMovie) {
      return next(new AppError("Movie not found.", 404));
    }

    const targetActorIds = targetMovie.casts.map((cast) => cast.actor);

    // Use aggregation to find similar movies
    const similarMovies = await Movie.aggregate([
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(movieId) }, // Exclude the target movie
        },
      },
      {
        $project: {
          title: 1,
          genre: 1,
          director: 1,
          writers: 1,
          casts: 1,
          tags: 1,
          poster: 1,
          actorIds: "$casts.actor", // Project actor IDs for easier comparison
        },
      },
      {
        $addFields: {
          similarityScore: {
            $add: [
              { $size: { $setIntersection: ["$genre", targetMovie.genre] } },
              { $cond: [{ $eq: ["$director", targetMovie.director] }, 1, 0] },
              { $size: { $setIntersection: ["$tags", targetMovie.tags] } },
              {
                $size: { $setIntersection: ["$writers", targetMovie.writers] },
              },
              { $size: { $setIntersection: ["$actorIds", targetActorIds] } }, // Use projected actor IDs for comparison
            ],
          },
          id: "$_id", // Add 'id' field copying the value of '_id'
        },
      },
      {
        $match: {
          similarityScore: { $gt: 0 }, // Filter out movies with no similarities
        },
      },
      {
        $sort: { similarityScore: -1 }, // Sort by descending similarity
      },
      {
        $project: {
          _id: 0, // Exclude the original '_id'
          id: 1, // Include the new 'id' field
          title: 1,
          genre: 1,
          director: 1,
          writers: 1,
          casts: 1,
          tags: 1,
          poster: 1,
          similarityScore: 1, // Include the similarity score if you want to show it
        },
      },
      { $limit: 3 }, // Limit to top 3 similar movies for this example
    ]);

    res.json(similarMovies);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovies,
  searchMovies,
  getMovieById,
  deleteMovie,
  createMovie,
  getGeneras,
  getMoviesByGenra,
  getSimilarMovies,
  getFeaturedMovies,
};
