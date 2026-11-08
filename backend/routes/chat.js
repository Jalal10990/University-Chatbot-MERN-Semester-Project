
const express = require("express");
const crypto = require("crypto");
const { AppError } = require("../errors");
const { askAiService } = require("../services/aiClient");
const pool = require("../db");

const router = express.Router();

const MAX_MESSAGE_LENGTH = 1000;
// Conversation memory: how much of the earlier conversation is sent to the AI.
// More history = better follow-ups, but a longer prompt = slower answers on a CPU.
const HISTORY_MESSAGES = 6; // last 6 messages (3 question/answer pairs)
const HISTORY_CHARS = 400; // each old message is cut to this many characters

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// POST /api/chat
router.post("/", async (req, res) => {
  // 1. Validate the request.
  const body = req.body ?? {};

  if (typeof body.message !== "string") {
    throw new AppError(
      400,
      "INVALID_REQUEST",
      "Message must be a string."
    );
  }

  const message = body.message.trim();

  if (message.length < 1 || message.length > MAX_MESSAGE_LENGTH) {
    throw new AppError(
      400,
      "INVALID_REQUEST",
      `Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters.`
    );
  }

  // 2. Create or validate the public conversation UUID.
  let conversationId = body.conversationId;

  if (
    conversationId === undefined ||
    conversationId === null ||
    conversationId === ""
  ) {
    conversationId = crypto.randomUUID();
  } else if (
    typeof conversationId !== "string" ||
    !UUID_PATTERN.test(conversationId)
  ) {
    throw new AppError(
      400,
      "INVALID_REQUEST",
      "conversationId must be a valid UUID or null."
    );
  }

  // 3. Find the existing conversation in Supabase.
  let result = await pool.query(
    `SELECT id
     FROM conversations
     WHERE session_id = $1`,
    [conversationId]
  );

  let dbConversationId;

  // 4. Create the conversation if it does not exist.
  if (result.rows.length === 0) {
    result = await pool.query(
      `INSERT INTO conversations (session_id, title)
       VALUES ($1, $2)
       RETURNING id`,
      [conversationId, message.slice(0, 80)]
    );

    dbConversationId = result.rows[0].id;
  } else {
    dbConversationId = result.rows[0].id;
  }
  // 4b. Load the earlier messages of this conversation (BEFORE saving the new one).
  const historyResult = await pool.query(
    `SELECT role, content
     FROM messages
     WHERE conversation_id = $1 AND role IN ('user', 'assistant')
     ORDER BY id DESC
     LIMIT $2`,
    [dbConversationId, HISTORY_MESSAGES]
  );
  const history = historyResult.rows
    .reverse() // the query returned newest first; the AI needs oldest first
    .map((row) => ({ role: row.role, content: String(row.content).slice(0, HISTORY_CHARS) }));

  // 5. Save the user's message.
  await pool.query(
    `INSERT INTO messages (conversation_id, role, content)
     VALUES ($1, $2, $3)`,
    [dbConversationId, "user", message]
  );

  // 6. Call the existing cloud AI service.
  // Keep the existing timeout and response validation in aiClient.js.
  const reply = await askAiService({
    message,
    conversationId,
    history,
  });

  // 7. Save the assistant's answer.
  const savedReply = await pool.query(
    `INSERT INTO messages (conversation_id, role, content)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [dbConversationId, "assistant", reply.answer]
  );

  // 8. Update conversation activity.
  await pool.query(
    `UPDATE conversations
     SET updated_at = NOW()
     WHERE id = $1`,
    [dbConversationId]
  );

  // 9. Return the existing AI response structure.
  // Keep sources, status, mode, and other reply fields intact.
  res.json({
    ...reply,
    conversationId,
  });
});

module.exports = router;
