const dotenv = require("dotenv");

dotenv.config();

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || "",
};

if (!config.mongoUri) {
  // Keep fail-fast to avoid silent runtime issues.
  console.warn("MONGO_URI is not set in environment variables.");
}

module.exports = config;