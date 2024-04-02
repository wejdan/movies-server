const mongoose = require("mongoose");
const { Schema } = mongoose;

// Actor Schema
const actorSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true, // Trims whitespace from the name
    unique: true, // Enforces uniqueness for the name field
  },
  profile: {
    type: String,
    required: true,
    trim: true, // Trims whitespace from the nationality
  },
  about: {
    type: String,
    required: true,
    trim: true, // Trims whitespace from the nationality
  },
  gender: {
    type: String,
    required: true,
    enum: ["male", "female"], // Only 'male' or 'female' are valid genders
    trim: true,
  },
});

// Actor Model
const Actor = mongoose.model("Actor", actorSchema);

module.exports = Actor;
