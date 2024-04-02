const express = require("express");
const { body } = require("express-validator");
const {
  loginUser,
  signupUser,
  getUserData,
  verifyOtp,
  requsetOtp,
  forgetPassword,
  resetPassword,
  updatePassword,
} = require("../controllers/auth-controllers");

const { checkAuth } = require("../middleware/check-auth");
const { validateRequest } = require("../middleware/check-input");

const router = express.Router();

// Place the specific route before the general one
router.post("/verifyOtp", verifyOtp);
router.post("/requestOtp", requsetOtp);
router.post("/forgot", forgetPassword);
router.patch("/updatePassword", checkAuth, updatePassword);

router.post("/reset/:token", resetPassword);

router.post(
  "/login",
  [
    body("email").not().isEmpty().withMessage("Please enter a valid email."),
    body("password").not().isEmpty().withMessage("Name must not be empty."),
  ],
  validateRequest,
  loginUser
);
router.post(
  "/signup",
  [
    body("name").not().isEmpty().withMessage("Name must not be empty."),
    body("email").isEmail().withMessage("Please enter a valid email."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long."),
  ],
  validateRequest,
  signupUser
);

router.get("/userData", checkAuth, getUserData);

// Export the router
module.exports = router;
