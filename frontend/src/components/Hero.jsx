import React, { useEffect, useState, useRef } from "react";
import "../styles/landing.css";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../i18n/translations";

function Hero() {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Parallax transforms for different layers
  const orb1Transform = `translateY(${scrollY * 0.15}px) translateX(${scrollY * 0.05}px)`;
  const orb2Transform = `translateY(${scrollY * -0.1}px) translateX(${scrollY * -0.03}px)`;
  const orb3Transform = `translateY(${scrollY * 0.08}px)`;
  const contentTransform = `translateY(${scrollY * -0.05}px)`;

  return (
    <div className="hero" ref={heroRef}>
      {/* Parallax Orbs */}
      <div 
        className="parallax-orb orb-purple" 
        style={{ transform: orb1Transform }}
      />
      <div 
        className="parallax-orb orb-cyan" 
        style={{ transform: orb2Transform }}
      />
      <div 
        className="parallax-orb orb-pink" 
        style={{ transform: orb3Transform }}
      />

      {/* Hero Content */}
      <div className="hero-content" style={{ transform: contentTransform }}>
        <div className="badge animate-fade-in-up">{t.onlineAssessment}</div>
        
        <h1 className="animate-fade-in-up delay-100">
          {t.comprehensive} <span>{t.cognitive}</span> {t.screening}
        </h1>
        
        <p className="animate-fade-in-up delay-200">
          {t.heroDescription}
        </p>

        <div className="hero-buttons animate-fade-in-up delay-300">
          <button className="primary-btn">{t.viewAssessments}</button>
          <Link to="../numberMemoryTest">
            <button className="secondary-btn">
              {t.getStarted} <span style={{ marginLeft: "6px" }}>→</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Hero;

