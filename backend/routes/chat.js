const express = require("express");
const crypto = require("crypto");
const { AppError } = require("../errors");
const { askAiService } = require("../services/aiClient");

const router = express.Router();
const MAX_MESSAGE_LENGTH = 1000;
const MAX_ID_LENGTH = 100;

// POST /api/chat   (the "/api/chat" part is added in index.js)
// In Express 5, if this async function throws, Express passes the error to errorHandler for us.
router.post("/", async (req, res) => {
  // In Express 5, req.body is undefined when no JSON body was sent
  const body = req.body ?? {};

  if (typeof body.message !== "string") {
    throw new AppError(400, "INVALID_REQUEST", "Message must be a string.");
  }
  const message = body.message.trim();
  if (message.length < 1 || message.length > MAX_MESSAGE_LENGTH) {
    throw new AppError(400, "INVALID_REQUEST", `Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters.`);
  }

  let conversationId = body.conversationId;
  if (conversationId === undefined || conversationId === null || conversationId === "") {
    conversationId = crypto.randomUUID(); // history is not stored yet; the id is a label for later
  } else if (typeof conversationId !== "string" || conversationId.length > MAX_ID_LENGTH) {
    throw new AppError(400, "INVALID_REQUEST", "conversationId must be a short string or null.");
  }

  const reply = await askAiService({ message, conversationId });
  res.json({ ...reply, conversationId });
});

module.exports = router;