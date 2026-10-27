const QUESTIONS = [
  "What information is available about the admission process?",
  "Where can I find information about fees?",
  "What information is available about examinations?",
  "What academic regulations apply to students?",
];

export default function SuggestedQuestions({ onPick }) {
  return (
    <div className="suggestions" role="group" aria-label="Suggested questions">
      {QUESTIONS.map((q) => (
        <button key={q} type="button" className="chip" onClick={() => onPick(q)}>
          {q}
        </button>
      ))}
    </div>
  );
}