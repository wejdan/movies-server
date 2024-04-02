const mongoose = require("mongoose");

// Define the tag schema
const genreSchema = new mongoose.Schema({
  value: { type: String, required: true },
});

// Create the model using the schema
const Genera = mongoose.model("Genera", genreSchema);

module.exports = Genera;
