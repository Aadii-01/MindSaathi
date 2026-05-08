import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/landing.css";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../i18n/translations";

function Card({ title, desc, to }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="card animate-fade-in-up">
      <div className="card-icon">📄</div>
      <div className="active-badge">Active</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <button
        className="begin-btn"
        onClick={() => {
          if (to) navigate(to);
        }}
      >
        {t.beginTest} →
      </button>
    </div>
  );
}

export default Card;


