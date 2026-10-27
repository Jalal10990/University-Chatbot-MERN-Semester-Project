import Button from "../ui/Button";
import "./Hero.css";

export default function Hero({ onAskAssistant, onExplore }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container">
        <div className="hero__panel">
          <p className="hero__eyebrow reveal" style={{ "--delay": "0.1s" }}>
            COMSATS University Islamabad · Sahiwal Campus
          </p>

          <h1 id="hero-title" className="hero__title reveal" style={{ "--delay": "0.25s" }}>
            Your University, One Intelligent Assistant.
          </h1>

          <p className="hero__text reveal" style={{ "--delay": "0.4s" }}>
            Find admissions, fees, academic and examination information in one place.
            Answers are based on approved university documents, and the sources are
            shown so you can check them.
          </p>

          <div className="hero__actions reveal" style={{ "--delay": "0.55s" }}>
            <Button variant="primary" onClick={onAskAssistant}>Ask the AI Assistant</Button>
            <Button variant="secondary" onClick={onExplore}>Explore University Information</Button>
          </div>
        </div>
      </div>
    </section>
  );
}