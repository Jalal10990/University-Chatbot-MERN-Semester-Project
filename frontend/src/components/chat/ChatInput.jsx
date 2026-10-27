import Button from "../ui/Button";

const MAX_LENGTH = 1000;

export default function ChatInput({ value, onChange, onSubmit, sending }) {
  const handleKeyDown = (e) => {
    // Enter sends, Shift+Enter makes a new line
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className="chat__input" onSubmit={handleSubmit}>
      <label htmlFor="chat-input" className="sr-only">Your question</label>
      <textarea
        id="chat-input"
        rows={2}
        maxLength={MAX_LENGTH}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your question… (Enter to send, Shift+Enter for a new line)"
      />
      <Button type="submit" variant="primary" disabled={sending || !value.trim()}>
        Send
      </Button>
    </form>
  );
}