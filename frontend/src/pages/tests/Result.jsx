import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./result.css";
import { useLanguage } from "../../context/LanguageContext";
import { translations } from "../../i18n/translations";

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const score = location.state?.score ?? 0;
  const total = location.state?.total ?? 100;
  const totalTimeSeconds = location.state?.totalTimeSeconds ?? 0;
  const correctCount = location.state?.correctCount ?? score;
  const wrongCount = location.state?.wrongCount ?? Math.max(0, total - correctCount);
  const testType = location.state?.test_type ?? "";


  const getMessage = () => {
    if (score >= 8) return t.excellentPerformance;
    if (score >= 5) return t.goodJob;
    return t.keepPracticing;
  };

  const getDesc = () => {
    if (score >= 8) return "You demonstrated exceptional cognitive abilities. Your memory, attention, and processing skills are outstanding.";
    if (score >= 5) return "You showed solid cognitive performance. With regular practice, you can further enhance your mental abilities.";
    return "Cognitive skills improve with practice. Consider taking the assessment again after some mental exercises.";
  };

  return (
    <div className="result-container">
      <div className="result-card">
        <div className="result-badge">{t.testCompleted}</div>

        <h1>{t.yourResults}</h1>

        <p className="result-subtitle">{t.performedSummary}</p>

        <div className="score-circle">
          <div className="score-circle-bg" />
          <div className="score-circle-inner">
            <span className="score-number">{score}</span>
            <span className="score-total">/ {total}</span>
          </div>
        </div>

        {(testType === "number_memory" || testType === "find_target" || testType === "stroop") && (
          <div style={{ marginTop: "8px", color: "#94a3b8", fontSize: "14px" }}>

            <div>{t.score}: <b style={{ color: "#e2e8f0" }}>{score} / {total}</b></div>
            <div>{t.correct}: <b style={{ color: "#e2e8f0" }}>{correctCount}</b></div>
            <div>{t.wrong}: <b style={{ color: "#e2e8f0" }}>{wrongCount}</b></div>
            <div>{t.totalTime}: <b style={{ color: "#e2e8f0" }}>{totalTimeSeconds}</b> sec</div>
            {testType === "find_target" && (
              <>
                <div>Missed Targets: <b style={{ color: "#e2e8f0" }}>{location.state?.missedTargets ?? 0}</b></div>
              </>
            )}
          </div>
        )}

        {(testType === "pattern_completion" || testType === "cdr" || testType === "stroop") && (
          <div style={{ marginTop: "14px", color: "#94a3b8", fontSize: "14px" }}>

            <div style={{ marginBottom: "10px" }}>

              <div>
                {t.score}: <b style={{ color: "#e2e8f0" }}>{score} / {total}</b>
              </div>
              <div>
                {t.correct}: <b style={{ color: "#e2e8f0" }}>{correctCount}</b>
              </div>
              <div>
                {t.wrong}: <b style={{ color: "#e2e8f0" }}>{wrongCount}</b>
              </div>
              <div>
                {t.totalTime}: <b style={{ color: "#e2e8f0" }}>{totalTimeSeconds}</b> sec
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
              {(() => {
                const m = location.state?.cognitive_metrics ?? {};
                const rows = [
                  { key: "logical_reasoning", label: "Logical Reasoning" },
                  { key: "pattern_recognition", label: "Pattern Recognition" },
                  { key: "problem_solving_ability", label: "Problem Solving Ability" },
                  { key: "decision_accuracy", label: "Decision Accuracy" },
                  { key: "cognitive_flexibility", label: "Cognitive Flexibility" },
                ];

                return rows.map((r) => (
                  <div key={r.key} style={{ padding: "8px 10px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "13px" }}>{r.label}</div>
                    <div style={{ marginTop: "4px" }}>
                      {typeof m[r.key] === "number" ? <b style={{ color: "#e2e8f0" }}>{m[r.key]}%</b> : <b style={{ color: "#94a3b8" }}>—</b>}
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontWeight: 800, color: "#f8fafc", fontSize: "16px" }}>
                Overall Pattern Completion Score
              </div>
              <div style={{ marginTop: "6px" }}>
                Final Score: <b style={{ color: "#e2e8f0" }}>{score}</b>/100
              </div>
            </div>

            <div style={{ lineHeight: 1.6 }}>
              {t.recommendation}:
              <div>• Practice advanced reasoning puzzles</div>
              <div>• Improve analytical speed under timed conditions</div>
              <div>• Engage in IQ and pattern-recognition exercises regularly</div>
            </div>
          </div>
        )}



        <p className="result-message">{getMessage()}</p>
        <p className="result-desc">{getDesc()}</p>

        <div className="result-buttons">
          <button className="result-btn primary" onClick={() => navigate("/landing")}>
            {t.goToDashboard}
          </button>
          <button
            className="result-btn secondary"
            onClick={() => {
              const type = location.state?.test_type ?? "";
              const retryRoute =
                type === "number_memory"
                  ? "/NumberMemoryTest"

                  : type === "find_target"
                    ? "/FindTargetTest"
                    : type === "stroop"
                      ? "/StroopTest"
                      : "/landing";
              navigate(retryRoute);
            }}

            type="button"
          >
            {t.retryTest}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Result;

