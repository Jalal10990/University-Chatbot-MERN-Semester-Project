export default function TypingIndicator() {
  return (
    <div className="msg msg--assistant">
      <div className="typing" role="status">
        <span className="sr-only">The assistant is preparing an answer</span>
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </div>
    </div>
  );
}