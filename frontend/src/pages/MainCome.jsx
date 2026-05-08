import React, { useMemo, useState } from "react";
import Signup from "./Signup";
import Login from "./Login";
import AdminLogin from "./AdminLogin";
import "../styles/maincome.css";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../i18n/translations";

/**
 * Main landing (split layout)
 * Left: branding + background effects
 * Right: auth panel (Signup/Login/Admin Login)
 */
export default function MainCome() {
  const [mode, setMode] = useState("login"); // login | signup | admin
  const { language } = useLanguage();
  const t = translations[language];

  const activeTitle = useMemo(() => {
    if (mode === "signup") return "Create your account";
    if (mode === "admin") return "Admin Login";
    return "Welcome back";
  }, [mode]);

  return (
    <div className="maincome-wrapper">
      <div className="maincome-bg">
        <div className="maincome-orb maincome-orb-1" />
        <div className="maincome-orb maincome-orb-2" />
        <div className="maincome-orb maincome-orb-3" />
        <div className="maincome-grid" />
      </div>

      <div className="maincome-shell">
        <section className="maincome-left">
          <div className="maincome-brand">
            <div className="maincome-logo">MindSaathi</div>
            <div className="maincome-tagline">
              {t.mainTagline}
            </div>
            <div className="maincome-bullets">
            </div>
          </div>

          <div className="maincome-left-cta">
            <button
              className="maincome-chip"
              onClick={() => setMode("login")}
              type="button"
            >
              {t.login}
            </button>
            <button
              className="maincome-chip"
              onClick={() => setMode("signup")}
              type="button"
            >
              {t.signup}
            </button>
            <button
              className="maincome-chip maincome-chip-admin"
              onClick={() => setMode("admin")}
              type="button"
            >
              {t.adminLogin}
            </button>
          </div>

          <div className="maincome-left-footer">
            © 2025 <span className="maincome-left-footer-gradient">MindSaathi.</span>
            . All rights reserved.
          </div>
        </section>

        <section className="maincome-right">
          <div className="maincome-panel">
            <div className="maincome-panel-content">
              {mode === "signup" && <Signup />}
              {mode === "login" && <Login />}
              {mode === "admin" && <AdminLogin />}
            </div>

            {/* Compact mode switch (mobile) */}
            <div className="maincome-mobile-switch">
              <button className={mode === "login" ? "maincome-mobile-btn active" : "maincome-mobile-btn"}
                onClick={() => setMode("login")} type="button">
                {t.login}
              </button>
              <button className={mode === "signup" ? "maincome-mobile-btn active" : "maincome-mobile-btn"}
                onClick={() => setMode("signup")} type="button">
                {t.signup}
              </button>
              <button className={mode === "admin" ? "maincome-mobile-btn active" : "maincome-mobile-btn"}
                onClick={() => setMode("admin")} type="button">
                {t.admin}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

