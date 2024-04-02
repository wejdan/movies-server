const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Optional: Import a library to validate URLs, if you choose to use one
// const validator = require('validator');

const castSchema = new Schema({
  actor: {
    type: Schema.Types.ObjectId,
    ref: "Actor",
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
});

const movieSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Enforces uniqueness for the name field
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    poster: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: String,
      },
    ],
    genre: [
      {
        type: Schema.Types.ObjectId,
        ref: "Genera",
      },
    ],
    director: {
      type: Schema.Types.ObjectId,
      ref: "Actor",
    },
    writers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Actor",
      },
    ],
    casts: [castSchema],
    language: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Released", "Upcoming", "In Production"], // Example enum for status
    },
    type: {
      type: String,
      required: true,
      enum: ["Movie", "Series"], // Example enum for type
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    trailer: {
      type: String,
      required: false, // Change to true if the trailer URL is required
      trim: true,
      // Optional: Validate URL format, uncomment and adjust as needed
      // validate: [validator.isURL, 'Invalid URL format']
    },
    averageRating: {
      type: Number,
      default: 0, // Default average rating when no reviews are present
    },
  },
  {
    timestamps: true, // Mongoose will add createdAt and updatedAt fields automatically
  }
);

const Movie = mongoose.model("Movie", movieSchema);

module.exports = Movie;
