const sharp = require("sharp");

// Middleware to resize image
const resizeImage = async (req, res, next) => {
  if (!req.file) return next(); // Proceed if no file is uploaded
  const filename = `actor-${
    req.file.originalname.split(".")[0]
  }-${Date.now()}.jpeg`;

  try {
    await sharp(req.file.buffer)
      .resize(200, 200) // Resize to 200x200 pixels
      .toFormat("jpeg")
      .jpeg({ quality: 90 }) // Set JPEG quality
      .toFile(`uploads/actors/${filename}`);

    // Update req.file to reflect the new image file
    req.file.filename = filename;
    req.file.path = `uploads/actors/${filename}`;

    next();
  } catch (err) {
    console.error("Error resizing image", err);
    next(err);
  }
};
module.exports = { resizeImage };

// Update your route to use the resizeImage middleware
