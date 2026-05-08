import React, { useState } from "react";
import "./auth.css";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../i18n/translations";

const API_BASE = "http://127.0.0.1:8000/api";

function Login() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleLogin = async () => {
    const newErrors = {};
    if (!form.username.trim()) newErrors.username = "Username is required";
    if (!form.password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const userPayload = data.user || { username: form.username.trim() };
        localStorage.setItem("user", JSON.stringify(userPayload));
        localStorage.setItem("token", data.token);
        if (data.jwt) {
          localStorage.setItem("jwt", data.jwt);
        }
        alert("Login successful!");
        navigate("/landing");
      } else {
        setErrors({ general: data.error || "Invalid credentials" });
        alert(data.error || "Invalid credentials");
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
      <div className="auth-box auth-box-elevated">
        <div className="logo">स</div>
        <div className="auth-pill">Secure Access</div>

        <h2>{t.participantLogin}</h2>

        <p className="link-text">
          {t.newHere}{" "}
          <Link to="/signup">
            <span>{t.createAccount}</span>
          </Link>
        </p>

        {errors.general && <div className="error-banner">{errors.general}</div>}

        <div className="input-group" style={{ textAlign: "left" }}>
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

        <div className="input-group" style={{ textAlign: "left" }}>
          <label>{t.password}</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={errors.password ? "input-error" : ""}
          />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        <button className="primary-btn" onClick={handleLogin} disabled={loading}>
          {loading ? t.signingIn : t.signIn}
        </button>

        <p className="bottom-link" style={{ marginTop: "20px" }}>
          <Link to="/admin-login">
            <span>{t.adminLogin}</span>
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

