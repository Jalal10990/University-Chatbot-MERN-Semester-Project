import { useEffect, useState } from "react";
import Button from "../ui/Button";
import MessageList from "./MessageList";
import SuggestedQuestions from "./SuggestedQuestions";
import ChatInput from "./ChatInput";
import StatusBanner from "./StatusBanner";
import { USE_DEMO } from "../../config/env";
import "./Chat.css";

export default function ChatWorkspace({ chat, prefill, onPrefillUsed }) {
  const { messages, isLoading, error, ask, retry, clear } = chat;
  const [draft, setDraft] = useState("");

  // When a feature card is clicked, put its question in the box (without sending)
  useEffect(() => {
    if (prefill) {
      setDraft(prefill);
      onPrefillUsed();
    }
  }, [prefill, onPrefillUsed]);

  const send = () => {
    const text = draft.trim();
    if (!text || isLoading) return;
    setDraft("");
    ask(text);
  };

  return (
    <section className="chat-page container" aria-label="AI assistant chat">
      <div className="chat">
        <header className="chat__header">
          <div>
            <h2 className="chat__title">University Assistant</h2>
            <p className="chat__subtitle">Designed to answer from approved university documents.</p>
          </div>
          <div className="chat__header-actions">
            {USE_DEMO && <span className="badge">Demo mode</span>}
            <Button variant="secondary" onClick={clear} disabled={messages.length === 0 || isLoading}>
              New chat
            </Button>
          </div>
        </header>

        {USE_DEMO && (
          <StatusBanner variant="info" title="Demo mode">
            The AI service is not connected. Replies are labeled placeholders, not real answers.
            Try typing /demo-error or /demo-nodata to preview the error states.
          </StatusBanner>
        )}

        {messages.length === 0 ? (
          <div className="chat__empty">
            <h3>Ask a question about the university</h3>
            <p>Start with a suggestion or type your own question below.</p>
            <SuggestedQuestions onPick={ask} />
          </div>
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}

        {error && (
          <StatusBanner variant="error" title="Something went wrong" action={{ label: "Try again", onClick: retry }}>
            {error}
          </StatusBanner>
        )}

        <ChatInput value={draft} onChange={setDraft} onSubmit={send} sending={isLoading} />
      </div>
    </section>
  );
}