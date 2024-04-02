const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const actorControllers = require("../controllers/actor-controller");

// Multer storage configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/actors"); // Ensure this directory exists
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(
//       null,
//       file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
//     );
//   },
// });
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  // Accept image files only
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload only images."), false);
  }
};
const upload = multer({ storage: storage, fileFilter });
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
const { resizeImage } = require("../utils/imgs");

//router.get("/movies/:actorId", actorControllers.getActorMovies);
router.get("/search", actorControllers.searchActor);

router.post(
  "/",
  checkAuth,
  restrictTo("admin"),
  upload.single("profile"),
  resizeImage, // This handles 'profile' image upload.
  [
    body("name").not().isEmpty().withMessage("Name must not be empty"),
    body("about").not().isEmpty().withMessage("About must not be empty"),
    body("gender")
      .isIn(["male", "female"])
      .withMessage("Gender must be either 'male' or 'female'"),
  ],
  validateRequest,
  actorControllers.createActor // The controller function to handle actor creation.
);
router.get("/", actorControllers.getActors);
router.get(
  "/:actorId",
  validateObjectId("actorId"),
  actorControllers.getActorById
);
// router.patch(
//   "/:actorId",
//   checkAdmin,
//   upload.single("image"),
//   actorControllers.updateActor
// );
router.delete(
  "/:actorId",
  checkAuth,
  restrictTo("admin"),
  validateObjectId("actorId"),
  actorControllers.deleteActor
);
module.exports = router;
