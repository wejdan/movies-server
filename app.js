const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
require("dotenv").config();
const cors = require("cors");

// Define a rate limit rule
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Apply the rate limit to all requests

// Or apply to a specific route or routes

process.on("uncaughtException", (error) => {
  console.log(error);
  console.log("uncaughtException 💥");
  process.exit(1);
});
// Use Morgan with the 'dev' predefined format
const connectDatabase = require("./utils/database");

const authRoutes = require("./routes/authRoutes");
const actorsRoutes = require("./routes/actorRoutes");
const moviesRoutes = require("./routes/moviesRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const statsRoutes = require("./routes/statsRoutes");
const {
  notFoundError,
  globalErrorHandler,
} = require("./controllers/error-controller");
const { gracefulShutdown } = require("./utils/errors");

const app = express();
const PORT = 5000;

//app.use("/api", apiLimiter);
app.use(express.json());
app.use(mongoSanitize());
app.use(xss());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/actors", actorsRoutes);
app.use("/api/movies", moviesRoutes);
//app.use("/api/reviews", reviewRoutes);
app.use("/api/stats", statsRoutes);

// Handle unknown routes
app.use(notFoundError);

// Global error handling
app.use(globalErrorHandler);
let server;
connectDatabase()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(() => {
    console.error("Database connection failed. Server not started.");
    process.exit(1); // Exit the process with an error code
  });

process.on("unhandledRejection", (error) => {
  console.log("Unhandled Rejection 💥");
  console.log(error);
  gracefulShutdown(server);
});
