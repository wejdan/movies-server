const crypto = require("crypto"); // Node.js built-in module
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const generateToken = require("../utils/token");
const Otp = require("../models/OTP");
const { sendOtpEmail, sendRestEmail } = require("../utils/email");
const AppError = require("../utils/appError");

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
// Utility function for handling validation errors
const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      console.log("no user returning");

      return next(
        new AppError("No account with that email address exists.", 404)
      );
    }

    const resetToken = user.generateResetToken();
    await user.save(); // Save the user with the reset token and expiration

    // Send the reset token to the user's email (modify sendRestEmail as needed)

    try {
      // Attempt to send the reset email
      await sendRestEmail(user.email, resetToken);
      res.status(200).json({
        message:
          "An e-mail has been sent to " +
          user.email +
          " with further instructions.",
      });
    } catch (sendEmailError) {
      // If sending the email fails, clear the reset token and expiration
      console.error("Failed to send reset email:", sendEmailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save(); // Save changes to the user
      return next(
        new AppError("Failed to send reset email. Please try again later.", 500)
      );
    }
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  const token = req.params.token; // The token sent by the user
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex"); // Hash it

  try {
    // Now, find the user by hashed token and check if the token hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return next(
        new AppError("Password reset token is invalid or has expired.", 400)
      );
    }

    // Verify if the new password is different from the old one
    const isSamePassword = await user.verifyPassword(req.body.password);
    if (isSamePassword) {
      return next(
        new AppError(
          "New password cannot be the same as the current password.",
          400
        )
      );
    }

    // Set the new password and clear the reset token and its expiration
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save(); // Save the updated user
    res.status(200).json({ message: "Your password has been updated." });
  } catch (error) {
    next(error);
  }
};

const requsetOtp = async (req, res, next) => {
  const { email } = req.body;
  const otp = generateOtp();

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If a user with the email already exists, send an error response

      return next(
        new AppError("Email is already in use by another account.", 400)
      );
    }
    await Otp.findOneAndDelete({ email });
    const otpInstance = new Otp({ email, otp });
    await otpInstance.save();
    await sendOtpEmail(email, otp); // Implement this function based on your email service

    res.status(200).json({ message: "OTP sent to email." });
  } catch (error) {
    next(error);
  }
};
const verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return next(new AppError("Invalid OTP or OTP expired.", 403));
    }

    // OTP is valid, proceed with user verification logic here
    // Optionally, delete the OTP record or mark it as verified
    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      return next(
        new AppError("Invalid credentials, could not log you in.", 403)
      );
    }

    const isValidPassword = await existingUser.verifyPassword(password);
    if (!isValidPassword) {
      return next(
        new AppError("Invalid credentials, could not log you in.", 403)
      );
    }

    const token = generateToken(existingUser.id, existingUser.email);
    const userObj = existingUser.toObject({ getters: true });
    delete userObj.password;
    const cookieOptions = {
      httpOnly: true, // The cookie is only accessible by the web server
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Cookie expiration date (e.g., 90 days)
    };
    res.cookie("token", token, cookieOptions);
    res.json({ token: token, user: userObj });
  } catch (error) {
    next(error);
  }
};
const updatePassword = async (req, res, next) => {
  try {
    // Assuming the userId is stored in req.userData after authentication
    const userId = req.userData.userId;
    const { currentPassword, newPassword } = req.body;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found.", 404));
    }

    // Verify the current password
    const isMatch = await user.verifyPassword(currentPassword);
    if (!isMatch) {
      return next(new AppError("Your current password is wrong.", 401));
    }

    // Check if the new password is the same as the current password
    const isSamePassword = await user.verifyPassword(newPassword);
    if (isSamePassword) {
      return next(
        new AppError(
          "New password cannot be the same as the current password.",
          400
        )
      );
    }

    // Update the password and save the user
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
};

const signupUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return next(
        new AppError("User exists already, please login instead.", 422)
      );
    }

    const createdUser = new User({
      name,
      email,
      password,
      signUpDate: new Date(),
      isAdmin: false,
    });
    await createdUser.save();

    const token = generateToken(createdUser.id, createdUser.email);
    const userObject = createdUser.toObject({ getters: true });
    delete userObject.password;

    res.status(201).json({ token: token, user: userObject });
  } catch (error) {
    next(error);
  }
};

const getUserData = async (req, res, next) => {
  try {
    const userId = req.userData.userId;
    // Fetch the user data including the isAdmin property
    const userData = await User.findById(userId).select("-password");
    // Convert Mongoose document to a plain JavaScript object
    const userObject = userData.toObject({ getters: true });

    // Extract isAdmin separately and exclude it from the userObject
    const { isAdmin, ...restOfUserData } = userObject;

    // Return both isAdmin and the rest of the user data in the response
    res.json({
      user: restOfUserData, // User data without isAdmin
      isAdmin, // isAdmin flag separately
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginUser,
  signupUser,
  getUserData,
  verifyOtp,
  requsetOtp,
  forgetPassword,
  resetPassword,
  updatePassword,
};
