import { useCallback, useState } from "react";
import CampusBackground from "./components/landing/CampusBackground";
import Navbar from "./components/layout/Navbar";
import Hero from "./components/landing/Hero";
import FeatureGrid from "./components/landing/FeatureGrid";
import TrustNotice from "./components/landing/TrustNotice";
import ChatWorkspace from "./components/chat/ChatWorkspace";
import { useChat } from "./hooks/useChat";
import { scrollToSection } from "./utils/scrollToSection";

export default function App() {
  const [view, setView] = useState("landing"); // "landing" or "chat"
  const [prefill, setPrefill] = useState("");
  const chat = useChat();
  const clearPrefill = useCallback(() => setPrefill(""), []);

  const goHome = () => {
    setView("landing");
    window.scrollTo({ top: 0 });
  };

  const openChat = () => {
    setView("chat");
    window.scrollTo({ top: 0 });
  };

  const askAbout = (question) => {
    setPrefill(question);
    openChat();
  };

  const explore = () => {
    setView("landing");
    setTimeout(() => scrollToSection("features"), 50);
  };

  return (
    <div className="app-shell">
      <CampusBackground />
      <a className="skip-link" href="#main-content">Skip to main content</a>

      <Navbar activeView={view} onGoHome={goHome} onExplore={explore} onOpenChat={openChat} />

      <main id="main-content">
        {view === "landing" ? (
          <>
            <Hero onAskAssistant={openChat} onExplore={explore} />
            <FeatureGrid onSelectQuestion={askAbout} />
            <TrustNotice />
          </>
        ) : (
          <ChatWorkspace chat={chat} prefill={prefill} onPrefillUsed={clearPrefill} />
        )}
      </main>
    </div>
  );
}