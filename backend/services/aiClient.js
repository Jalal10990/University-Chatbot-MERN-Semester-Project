const config = require("../config");
const { AppError } = require("../errors");

const VALID_STATUS = ["ok", "insufficient_evidence"];
const VALID_MODE = ["mock", "ai"];

const isTimeout = (err) => err && (err.name === "TimeoutError" || err.name === "AbortError");

const badReply = (detail) =>
  new AppError(502, "AI_SERVICE_BAD_RESPONSE", `The AI service sent an unusable reply (${detail}).`);

// Never trust another service's data blindly: check it, and rebuild a clean object.
function validateAiReply(data) {
  if (!data || typeof data !== "object") throw badReply("not an object");
  if (!VALID_STATUS.includes(data.status)) throw badReply("unknown status");
  if (!VALID_MODE.includes(data.mode)) throw badReply("unknown mode");
  if (data.status === "ok" && (typeof data.answer !== "string" || !data.answer)) {
    throw badReply("empty answer");
  }

  const sources = Array.isArray(data.sources)
    ? data.sources.map((s) => ({
        title: typeof s.title === "string" ? s.title : "Untitled document",
        page: Number.isInteger(s.page) ? s.page : null,
        snippet: typeof s.snippet === "string" ? s.snippet : "",
        // allow only normal web links
        url: typeof s.url === "string" && /^https?:\/\//.test(s.url) ? s.url : null,
      }))
    : [];

  return {
    answer: typeof data.answer === "string" ? data.answer : "",
    sources,
    status: data.status,
    mode: data.mode,
  };
}

// async function: it returns a Promise. `await` pauses THIS function (not the whole server)
// until the network call finishes, so other requests keep being served.
async function askAiService({ message, conversationId, history = [] }) {
  let response;
  try {
    response = await fetch(`${config.aiServiceUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversationId, history }),
      signal: AbortSignal.timeout(config.aiTimeoutMs), // cancels the request after the time limit
    });
  } catch (err) {
    if (isTimeout(err)) {
      throw new AppError(504, "AI_SERVICE_TIMEOUT", "The AI service took too long to respond.");
    }
    throw new AppError(503, "AI_SERVICE_UNAVAILABLE", "The AI service is not reachable. Please try again later.");
  }

  if (!response.ok) {
    throw new AppError(502, "AI_SERVICE_BAD_RESPONSE", `The AI service returned an error (code ${response.status}).`);
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    if (isTimeout(err)) {
      throw new AppError(504, "AI_SERVICE_TIMEOUT", "The AI service took too long to respond.");
    }
    throw badReply("not valid JSON");
  }

  return validateAiReply(data);
}

// Quick check used by GET /health/ai (3 second limit)
async function checkAiHealth() {
  try {
    const response = await fetch(`${config.aiServiceUrl}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

module.exports = { askAiService, checkAiHealth };