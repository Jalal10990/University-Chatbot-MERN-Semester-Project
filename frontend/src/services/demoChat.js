import { ChatApiError } from "./errors";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getDemoReply(question) {
  await wait(900); // pretend the service is thinking

  const command = question.trim().toLowerCase();

  if (command === "/demo-error") {
    throw new ChatApiError("Demo: this is a simulated service error.");
  }

  if (command === "/demo-nodata") {
    return { isDemo: true, status: "insufficient_evidence", answer: "", sources: [] };
  }

  return {
    isDemo: true,
    status: "ok",
    answer:
      "Demo response: the AI service is not connected yet, so this is not a real answer. " +
      `Your question was: "${question}"`,
    sources: [
      {
        title: "Sample citation (not a real document)",
        page: null,
        snippet:
          "This box shows where real document names, page numbers and excerpts will appear once the AI service is connected.",
        isSample: true,
      },
    ],
  };
}