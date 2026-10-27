import FeatureCard from "./FeatureCard";
import { useInView } from "../../hooks/useInView";
import "./Features.css";

const Icon = ({ children }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const FEATURES = [
  {
    id: "admissions",
    title: "Admissions",
    description: "Ask about the admission process and requirements.",
    question: "What information is available about the admission process?",
    icon: <Icon><path d="M6 3h9l4 4v14H6z" /><path d="M9 14l2 2 4-4" /></Icon>,
  },
  {
    id: "fees",
    title: "Fees",
    description: "Ask where to find fee and payment information.",
    question: "Where can I find information about fees?",
    icon: <Icon><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /></Icon>,
  },
  {
    id: "academics",
    title: "Academics",
    description: "Ask about programs, courses and academic rules.",
    question: "What academic regulations apply to students?",
    icon: <Icon><path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2z" /><path d="M12 6v14" /></Icon>,
  },
  {
    id: "examinations",
    title: "Examinations",
    description: "Ask about examination rules and schedules.",
    question: "What information is available about examinations?",
    icon: <Icon><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9z" /><path d="M8.5 12h7M8.5 16h5" /></Icon>,
  },
];

export default function FeatureGrid({ onSelectQuestion }) {
  const [ref, inView] = useInView();

  return (
    <section id="features" className="section container" aria-labelledby="features-title">
      <div className="section__header">
        <p className="section__eyebrow">University information</p>
        <h2 id="features-title" className="section__title">What would you like to know?</h2>
        <p className="section__lead">
          Pick a topic to start a question. What the assistant can answer depends on
          which university documents have been added to the system.
        </p>
      </div>

      <ul ref={ref} className={`feature-grid ${inView ? "is-visible" : ""}`}>
        {FEATURES.map((f, i) => (
          <li key={f.id}>
            <FeatureCard index={i} onSelect={onSelectQuestion} {...f} />
          </li>
        ))}
      </ul>
    </section>
  );
}