import SourceCitations from "./SourceCitations";
import StatusBanner from "./StatusBanner";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const time = new Date(message.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const noEvidence = message.status === "insufficient_evidence";

  return (
    <div className={`msg ${isUser ? "msg--user" : "msg--assistant"}`}>
      <div className="msg__bubble">
        {!isUser && message.isDemo && <span className="badge badge--small">Demo response</span>}
        {!isUser && message.isAi && (message.sources ?? []).length === 0 && (
          <span className="badge badge--small">AI-generated, not verified</span>
        )}
        

        {noEvidence ? (
          <StatusBanner variant="warning" title="Not enough evidence">
            {message.text ||
              "The approved documents did not contain enough information to answer this. Please contact the relevant university office."}
          </StatusBanner>
        ) : (
          <p className="msg__text">{message.text}</p>
        )}
      </div>

      {!isUser && !noEvidence && (
        <SourceCitations sources={message.sources ?? []} isDemo={message.isDemo} />
      )}

      <time className="msg__time" dateTime={message.time}>{time}</time>
    </div>
  );
}