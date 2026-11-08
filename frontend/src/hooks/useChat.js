import { useCallback, useRef, useState } from "react";
import { sendMessage } from "../services/chatApi";
import { ChatApiError } from "../services/errors";

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastQuestion = useRef("");
  const busy = useRef(false); // stops double-sending
  const conversationId = useRef(null); // the backend's conversation id, reused for follow-ups

  const run = useCallback(async (question) => {
    if (busy.current) return;
    busy.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const reply = await sendMessage(question, conversationId.current);
   if (reply.conversationId) conversationId.current = reply.conversationId;
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          text: reply.answer,
          status: reply.status,
          sources: reply.sources,
          isDemo: reply.isDemo,
           isAi: reply.isAi,
          time: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(err instanceof ChatApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      busy.current = false;
      setIsLoading(false);
    }
  }, []);

  const ask = useCallback(
    (text) => {
      const question = text.trim();
      if (!question || busy.current) return;
      lastQuestion.current = question;
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "user", text: question, time: new Date().toISOString() },
      ]);
      run(question);
    },
    [run]
  );

  const retry = useCallback(() => {
    if (lastQuestion.current) run(lastQuestion.current);
  }, [run]);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
    lastQuestion.current = "";
    conversationId.current = null; // "New chat" starts a new conversations
  }, []);

  return { messages, isLoading, error, ask, retry, clear };
}