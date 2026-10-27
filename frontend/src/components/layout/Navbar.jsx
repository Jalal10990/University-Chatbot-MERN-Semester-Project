import Button from "../ui/Button";
import "./Navbar.css";

export default function Navbar({ activeView, onGoHome, onExplore, onOpenChat }) {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <button type="button" className="navbar__brand" onClick={onGoHome} aria-label="Go to home page">
          <img
            src="/images/logo.png"
            alt="COMSATS University Islamabad logo"
            className="navbar__logo"
          />
          <span className="navbar__title">University Information Assistant</span>
        </button>

        <nav className="navbar__nav" aria-label="Main navigation">
          <button
            type="button"
            className={`navbar__link ${activeView === "landing" ? "is-active" : ""}`}
            onClick={onGoHome}
            aria-current={activeView === "landing" ? "page" : undefined}
          >
            Home
          </button>
          <button type="button" className="navbar__link" onClick={onExplore}>
            Information
          </button>
          <button
            type="button"
            className={`navbar__link ${activeView === "chat" ? "is-active" : ""}`}
            onClick={onOpenChat}
            aria-current={activeView === "chat" ? "page" : undefined}
          >
            Assistant
          </button>
        </nav>

        <Button variant="primary" onClick={onOpenChat} className="navbar__cta">
          Ask the AI
        </Button>
      </div>
    </header>
  );
}