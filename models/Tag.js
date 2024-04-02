const mongoose = require("mongoose");

// Define the tag schema
const tagSchema = new mongoose.Schema({
  // Mongoose automatically creates an _id property of ObjectId type, so you do not need to explicitly define it.
  name: {
    type: String,
    required: true,
    trim: true, // Will trim whitespace
    unique: true, // Ensures all tags have a unique name
    minlength: 1, // Minimum length requirement
  },
});

// Create the model using the schema
const Tag = mongoose.model("Tag", tagSchema);

module.exports = Tag;
