import { API_BASE_URL, CHAT_ENDPOINT, USE_DEMO } from "../config/env";
import { getDemoReply } from "./demoChat";
import { ChatApiError } from "./errors";

// Contract with the Node backend (POST /api/chat)
//   request : { message }
//   success : { answer, sources, status, mode, conversationId }
//   error   : { error: { code, message } }
function buildRequestBody(question) {
  return { message: question };
}

function normalizeResponse(data) {
  if (!data || typeof data !== "object") {
    throw new ChatApiError("The service sent a reply the app could not read.");
  }

  const answer = typeof data.answer === "string" ? data.answer : "";
  const status = data.status === "insufficient_evidence" ? "insufficient_evidence" : "ok";

  if (status === "ok" && !answer) {
    throw new ChatApiError("The service returned an empty answer.");
  }

  // Only show sources the backend actually returned. Never invent any.
  const sources = Array.isArray(data.sources)
    ? data.sources.map((s) => ({
        title: s.title ?? "Untitled document",
        page: s.page ?? null,
        snippet: s.snippet ?? "",
        url: typeof s.url === "string" && /^https?:\/\//.test(s.url) ? s.url : null,
      }))
    : [];

  // mode "mock" means a development placeholder, so it gets the "Demo response" label
  return { isDemo: data.mode === "mock", status, answer, sources };
}

// Use the backend's own error message when it sent one
async function readErrorMessage(response) {
  try {
    const data = await response.json();
    if (typeof data?.error?.message === "string") return data.error.message;
  } catch {
    // the body was not JSON, fall through to the generic message
  }
  return `The service returned an error (code ${response.status}).`;
}

export async function sendMessage(question) {
  if (USE_DEMO) return getDemoReply(question);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000); // give up after 30 seconds

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${CHAT_ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequestBody(question)),
      signal: controller.signal,
    });
  } catch (err) {
    throw new ChatApiError(
      err.name === "AbortError"
        ? "The service took too long to respond. Please try again."
        : "Could not reach the service. Check that the backend is running."
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new ChatApiError(await readErrorMessage(response));
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new ChatApiError("The service sent a reply the app could not read.");
  }

  return normalizeResponse(data);
}