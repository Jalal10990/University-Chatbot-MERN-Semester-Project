const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const config = require("./config");
const chatRouter = require("./routes/chat");
const { checkAiHealth } = require("./services/aiClient");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.frontendOrigins, // only our frontend, not every website
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json({ limit: config.bodyLimit })); // bigger bodies get a 413 error

app.get("/", (req, res) => {
  res.json({
    message: "University Chatbot backend is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "node-backend",
  });
});

// Checks that the AI service is reachable too
app.get("/health/ai", async (req, res) => {
  const up = await checkAiHealth();
  res.status(up ? 200 : 503).json({
    status: up ? "ok" : "degraded",
    service: "node-backend",
    aiService: up ? "up" : "down",
  });
});

app.use("/api/chat", chatRouter);

// Order matters: these two must come LAST
app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Backend running on http://localhost:${config.port}`);
});