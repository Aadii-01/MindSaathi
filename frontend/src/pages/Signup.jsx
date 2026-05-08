import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../i18n/translations";

const API_BASE = "http://127.0.0.1:8000/api";

function Signup() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validateFrontend = () => {
    const newErrors = {};
    const username = form.username.trim();
    const email = form.email.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!username) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (username.length > 20) {
      newErrors.username = "Username must be at most 20 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = "Only letters, numbers, and underscores allowed";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateFrontend()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Account created successfully! Please login.");
        navigate("/login");
      } else {
        setErrors(data.errors || {});
        if (data.errors) {
          const firstError = Object.values(data.errors)[0];
          alert(firstError || "Registration failed");
        } else {
          alert("Registration failed");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box large auth-box-elevated">
        <div className="logo">स</div>
        <div className="auth-pill">Create Secure Account</div>

        <h2>{t.createAccountTitle}</h2>
        <p className="subtitle">{t.signupSubtitle}</p>

        {/* BASIC INFO */}
        <div className="section">
          <h4>{t.basicInformation}</h4>

          <div className="input-group">
            <label>{t.email}</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder={t.enterEmail}
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label>{t.username}</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder={t.enterUsername}
              className={errors.username ? "input-error" : ""}
            />
            {errors.username && <span className="error-text">{errors.username}</span>}
          </div>
        </div>

        {/* SECURITY */}
        <div className="section">
          <h4>{t.security}</h4>

          <div className="row">
            <div className="input-group">
              <label>{t.password}</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder={t.enterPassword}
                className={errors.password ? "input-error" : ""}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="input-group">
              <label>{t.confirmPassword}</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder={t.confirmPassword}
                className={errors.confirmPassword ? "input-error" : ""}
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          </div>
        </div>

        {/* BUTTON */}
        <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? t.creatingAccount : t.createAccountTitle}
        </button>

        {/* LOGIN LINK */}
        <p className="bottom-link">
          {t.alreadyHaveAccount}{" "}
          <Link to="/login">
            <span>{t.login}</span>
          </Link>
        </p>

        <p className="terms">{t.termsText}</p>
      </div>
    </div>
  );
}

export default Signup;

