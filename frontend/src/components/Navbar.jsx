import React, { useEffect, useState } from "react";
import "../styles/landing.css";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../i18n/translations";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { language, setLanguage } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      className="navbar" 
      style={{
        background: scrolled ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.6)',
        boxShadow: scrolled ? '0 4px 30px rgba(0, 0, 0, 0.3)' : 'none'
      }}
    >
      <div className="nav-right">
        <Link className="feedback" to="/Feedback">
          <span>{t.feedback}</span>
        </Link>
        <Link className="scores" to="/test-scores">
          <span>{t.viewTestScores}</span>
        </Link>
        <label className="language-switch" htmlFor="language-select">
          <span>{t.language}</span>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Language selection"
          >
            <option value="en">{t.english}</option>
            <option value="hi">{t.hindi}</option>
          </select>
        </label>
        <Link className="profile" to="/profile">
        <span>Aaditya Shirke</span>
        </Link>
        <Link className="signup" to="/">
          <button className="logout-btn">{t.logout}</button>
        </Link>
      </div>
    </div>
  );
}

export default Navbar;

