const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Movie = require("./Movie"); // Assuming this is the correct path to your Actor model

// Review Schema
const reviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User", // Assuming you have a User model
      required: true,
    },
    movie: {
      type: Schema.Types.ObjectId,
      ref: "Movie", // Assuming you have a Movie model
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0, // Minimum rating value
      max: 10, // Maximum rating value
    },
    comment: {
      type: String,
      required: true,
      trim: true, // Automatically trim whitespace around the comment
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);
reviewSchema.index({ user: 1, movie: 1 }, { unique: true });
reviewSchema.post("save", async function () {
  // `this` refers to the review document that was saved
  await this.constructor.calculateAverageRating(this.movie);
});

// Optionally, recalculate average rating after deleting a review
reviewSchema.post("remove", async function () {
  // `this` refers to the review document that was removed
  await this.constructor.calculateAverageRating(this.movie);
});

// Static method to calculate and update the average rating of a movie
reviewSchema.statics.calculateAverageRating = async function (movieId) {
  const stats = await this.aggregate([
    { $match: { movie: movieId } },
    {
      $group: {
        _id: "$movie",
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Movie.findByIdAndUpdate(movieId, {
      averageRating: stats[0].averageRating,
    });
  } else {
    // If there are no reviews, you might want to reset the average rating
    await Movie.findByIdAndUpdate(movieId, {
      averageRating: 0,
    });
  }
};
// Create the model from the schema and export it
const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
