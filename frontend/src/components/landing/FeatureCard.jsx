export default function FeatureCard({ icon, title, description, question, index, onSelect }) {
  return (
    <article className="feature-card" style={{ "--delay": `${index * 0.12}s` }}>
      <div className="feature-card__icon" aria-hidden="true">{icon}</div>
      <h3 className="feature-card__title">{title}</h3>
      <p className="feature-card__text">{description}</p>
      <button type="button" className="feature-card__link" onClick={() => onSelect(question)}>
        Ask about {title.toLowerCase()} <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}