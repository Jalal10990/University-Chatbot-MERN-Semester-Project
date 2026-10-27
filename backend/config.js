// Reads settings from .env once, with safe defaults, so no other file touches process.env.
require("dotenv").config({ quiet: true });

function readInt(name, fallback) {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const config = {
  port: readInt("PORT", 5000),
  // remove trailing slashes so we can safely write `${url}/chat`
  aiServiceUrl: (process.env.AI_SERVICE_URL || "http://127.0.0.1:8000").replace(/\/+$/, ""),
  // comma-separated list of websites allowed to call this API from a browser
  frontendOrigins: (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  aiTimeoutMs: readInt("AI_TIMEOUT_MS", 15000),
  bodyLimit: process.env.BODY_LIMIT || "10kb",
};

module.exports = config;