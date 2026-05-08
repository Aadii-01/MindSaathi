import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/landing.css";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../i18n/translations";

function ProfilePage() {
  const [mode, setMode] = useState("details"); // details | scores
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const rawUser = localStorage.getItem("user");
  const jwt = localStorage.getItem("jwt") || localStorage.getItem("admin_jwt");
  const parsedUser = useMemo(() => {
    try {
      return rawUser ? JSON.parse(rawUser) : {};
    } catch {
      return { username: rawUser || "" };
    }
  }, [rawUser]);
  const [profile, setProfile] = useState({
    username: parsedUser?.username || "",
    email: parsedUser?.email || "",
    role: "participant",
    created_at: "",
    last_login: "",
  });
  const username = profile?.username || parsedUser?.username || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!jwt) return;
    let cancelled = false;
    setProfileLoading(true);
    fetch("http://127.0.0.1:8000/api/profile/me/", {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const p = data?.profile;
        if (p?.username) {
          setProfile({
            username: p.username || "",
            email: p.email || "",
            role: p.role || "participant",
            created_at: p.created_at || "",
            last_login: p.last_login || "",
          });
          localStorage.setItem("user", JSON.stringify(p));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [jwt]);

  useEffect(() => {
    if (mode !== "scores") return;
    if (!username) return;

    let cancelled = false;
    setLoading(true);

    fetch(
      `http://127.0.0.1:8000/api/results/me/?username=${encodeURIComponent(username)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setResults(data.results || []);
      })
      .catch(() => {
        if (cancelled) return;
        setResults([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, username]);

  const getComparisonBand = (scoreOutOf100) => {
    const s = Number(scoreOutOf100) || 0;
    if (s > 80) return "— Excellent (>80%)";
    if (s > 60) return "— Good (>60%)";
    if (s >= 40) return "— Average (≥40%)";
    return "— Needs Practice (<40%)";
  };

  const getTestLabel = (testType) => {
    if (testType === "number_memory") return "Number Memory Test";
    if (testType === "find_target") return "Find the Target";
    return testType || "Test";
  };

  return (
    <div className="auth-container">
      <div className="auth-box large" style={{ textAlign: "center", maxWidth: "920px" }}>
        <div className="logo">👤</div>
        <h2>{t.profile}</h2>
        <p className="subtitle">{t.accountInformation}</p>

        <div
          style={{
            marginTop: "16px",
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap"
          }}
        >
          <button
            type="button"
            className={mode === "details" ? "primary-btn" : "next-btn"}
            onClick={() => setMode("details")}
          >
            Change details
          </button>
          <button
            type="button"
            className={mode === "scores" ? "primary-btn" : "next-btn"}
            onClick={() => navigate("/test-scores")}
          >
            {t.viewTestScores}
          </button>
        </div>

        {mode === "details" && (
          <div style={{ marginTop: "24px", textAlign: "left" }}>
            <div className="input-group">
              <label>{t.username}</label>
              <input
                type="text"
                value={username}
                readOnly
                style={{ cursor: "default" }}
              />
            </div>
            <div className="input-group">
              <label>{t.emailAddress}</label>
              <input type="text" value={profile.email || "—"} readOnly style={{ cursor: "default" }} />
            </div>
            <div className="input-group">
              <label>{t.role}</label>
              <input type="text" value={profile.role === "admin" ? "Admin" : t.participant} readOnly style={{ cursor: "default" }} />
            </div>
            <div className="input-group">
              <label>{t.memberSince}</label>
              <input
                type="text"
                value={profile.created_at ? new Date(profile.created_at).toLocaleString() : "—"}
                readOnly
                style={{ cursor: "default" }}
              />
            </div>
            <div className="input-group">
              <label>{t.lastLogin}</label>
              <input
                type="text"
                value={profileLoading ? "Loading..." : (profile.last_login ? new Date(profile.last_login).toLocaleString() : "—")}
                readOnly
                style={{ cursor: "default" }}
              />
            </div>
          </div>
        )}

        {mode === "scores" && (
          <div style={{ marginTop: "24px" }}>
            <div style={{ textAlign: "left", color: "#cbd5e1", marginBottom: "12px" }}>
              Saved attempts for <b>{username}</b>
            </div>

            {loading ? (
              <div style={{ color: "#94a3b8" }}>Loading...</div>
            ) : results.length === 0 ? (
              <div style={{ color: "#94a3b8" }}>No test scores found.</div>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  overflowX: "auto",
                  paddingBottom: "10px"
                }}
              >
                {results
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
                  )
                  .map((r) => {
                    const score = Number(r.score) || 0;
                    const total = Number(r.total) || 100;
                    const percent = total ? Math.round((score / total) * 100) : 0;
                    const time = r.totalTimeSeconds ?? 0;

                    return (
                      <div
                        key={r.id}
                        style={{
                          minWidth: 320,
                          background: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: 16,
                          padding: 14,
                          color: "#e2e8f0"
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>
                          {getTestLabel(r.test_type)}
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: 13 }}>
                          Date: {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"}
                        </div>

                        <div style={{ marginTop: 10 }}>
                          <div>
                            Score: <b>{score}</b>/100
                          </div>
                          <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>
                            Performance: {percent}% {getComparisonBand(percent)}
                          </div>
                          <div style={{ marginTop: 8 }}>
                            Correct: <b>{r.correctCount ?? 0}</b>
                          </div>
                          <div>
                            Wrong: <b>{r.wrongCount ?? 0}</b>
                          </div>
                          <div style={{ marginTop: 8, color: "#94a3b8" }}>
                            Total time: {time} sec
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        <Link to="/landing">
          <button className="primary-btn" style={{ marginTop: "24px" }}>
            Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}

export default ProfilePage;

