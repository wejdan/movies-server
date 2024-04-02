// utils/errors.js
const process = require("process");

function errorLogger(error) {
  console.error(`Error: ${error.message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(error.stack);
  }
  // Further integration with external logging services can be added here.
}

function gracefulShutdown(server) {
  if (server) {
    server.close(() => {
      console.log("Server closed due to uncaught exception");
      process.exit(1); // Exit with an error status
    });
  } else {
    process.exit(1); // Exit immediately if server isn't started yet
  }
}

// Capture uncaught exceptions and unhandled promise rejections

// process.on("uncaughtException", (error) => {
//   console.log("Uncaught Exception 💥");
//   gracefulShutdown(error);
// });

// process.on("unhandledRejection", (error) => {
//   console.log("Unhandled Rejection 💥");
//   gracefulShutdown(error);
// });

module.exports = {
  errorLogger,
  gracefulShutdown,
};
