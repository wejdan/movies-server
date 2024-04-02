const { validationResult } = require("express-validator");
const fs = require("fs");
const Actor = require("../models/Actor"); // Assuming this is the correct path to your Actor model
const { default: mongoose } = require("mongoose");
const AppError = require("../utils/appError");

const getActors = async (req, res, next) => {
  const searchQuery = req.query.query;
  const page = parseInt(req.query.page, 10) || 1; // Ensure base 10 is used for parsing
  const pageSize = 10; // Set a standard page size or make it configurable through an environment variable or query parameter

  const queryCondition = {};
  if (searchQuery) {
    // Apply case-insensitive regex search for actors by name
    queryCondition.name = { $regex: searchQuery, $options: "i" };
  }

  try {
    // Calculate the number of documents to skip for pagination
    const skipAmount = (page - 1) * pageSize;

    // Fetch the page of actors based on queryCondition, skipAmount, and pageSize
    const actors = await Actor.find(queryCondition)
      .skip(skipAmount)
      .limit(pageSize);

    // Calculate total actors to determine the number of pages
    const totalActors = await Actor.countDocuments(queryCondition);
    const totalPages = Math.ceil(totalActors / pageSize);

    // Respond with actors data and pagination details
    res.json({
      actors: actors.map((actor) => actor.toObject({ getters: true })), // Convert each actor document to an object
      totalPages, // Total number of pages based on the totalActors and pageSize
      currentPage: page, // Current page number
      totalActors, // Total number of actors matching the search query
    });
  } catch (error) {
    next(error);
  }
};

const searchActor = async (req, res) => {
  const searchQuery = req.query.query;

  try {
    // Use a case-insensitive regex search to find actors matching the search query in their name
    const results = await Actor.find({
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
const createActor = async (req, res, next) => {
  const { name, about, gender } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let profileImagePath;
    console.log(req.file);
    if (req.file) {
      profileImagePath = req.file.path; // Get the path of the uploaded image
    }
    const createdActor = new Actor({
      name,
      profile: profileImagePath, // Assuming 'profile' holds the image path
      about,
      gender,
      // No 'user' field is defined in the Actor model you've provided,
      // but you might want to add one if actors are associated with users.
    });
    await createdActor.save({ session });
    // If actors are associated with users, update the user here as necessary
    await session.commitTransaction();
    res.status(201).json({ actor: createdActor });
  } catch (error) {
    await session.abortTransaction();

    next(error);
  } finally {
    session.endSession();
  }
};

const deleteActor = async (req, res, next) => {
  const actorId = req.params.actorId;

  try {
    await Actor.findByIdAndRemove(actorId);
    res.status(200).json({ message: "Actor deleted successfully." });
  } catch (error) {
    next(error);
  }
};

const getActorById = async (req, res, next) => {
  const actorId = req.params.actorId;

  try {
    const actor = await Actor.findById(actorId);
    if (!actor) {
      return next(new AppError("Actor not found.", 404));
    }
    res.json({ actor: actor.toObject({ getters: true }) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActors,
  createActor,
  deleteActor,
  getActorById,
  searchActor,
};
