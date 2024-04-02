const jwt = require("jsonwebtoken");

function generateToken(userId, email) {
  const token = jwt.sign(
    { userId: userId, email: email },
    process.env.JWT_SECRET, // Use an environment variable for the secret key
    { expiresIn: "1h" }
  );
  return token;
}

module.exports = generateToken;
