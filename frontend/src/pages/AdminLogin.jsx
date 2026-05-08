import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../i18n/translations";

const API_BASE = "http://127.0.0.1:8000/api";

function AdminLogin() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const [form, setForm] = useState({
    username: "admin",
    password: "awdx1234",
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
      const res = await fetch(`${API_BASE}/admin-login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("admin_user", JSON.stringify({ username: form.username.trim(), role: "admin" }));
        localStorage.setItem("admin_token", data.token);
        if (data.jwt) {
          localStorage.setItem("admin_jwt", data.jwt);
        }
        alert("Admin login successful!");
        navigate("/landing");
      } else {
        setErrors({ general: data.error || "Invalid admin credentials" });
        alert(data.error || "Invalid admin credentials");
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
      <div className="admin-box auth-box-elevated">
        <div className="logo" style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}>
          ⚡
        </div>
        <div className="auth-pill">Admin Panel Access</div>

        <h2>{t.adminLogin}</h2>
        <p className="link-text">
          <Link to="/login">
            <span>{t.participantLogin}</span>
          </Link>
        </p>

        {errors.general && <div className="error-banner">{errors.general}</div>}

        <div className="input-group" style={{ textAlign: "left", marginTop: "20px" }}>
          <label>{t.username}</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="admin"
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

        <button className="gradient-btn" onClick={handleLogin} disabled={loading}>
          {loading ? t.signingIn : t.signIn}
        </button>
      </div>
    </div>
  );
}

export default AdminLogin;

