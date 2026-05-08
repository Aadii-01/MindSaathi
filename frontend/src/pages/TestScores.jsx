import React, { useEffect, useMemo, useState } from "react";
import "../styles/testScores.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../i18n/translations";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const API_BASE = "http://127.0.0.1:8000/api";


function safeParseUser(userRaw) {
  try {
    return JSON.parse(userRaw);
  } catch {
    return null;
  }
}

function formatTestType(testType) {
  switch (testType) {
    case "number_memory":
      return "Number Memory Test";
    case "find_target":
      return "Find the Target";
    case "aptitude":
      return "Aptitude Test";
    case "pattern_completion":
      return "Pattern Completion";
    case "stroop":
      return "Stroop Test";
    case "cdr":
      return "CDR Test";
    case "image":
      return "Image Test";
    default:
      return testType || "Unknown";
  }
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function scorePercent(score, total) {
  const s = typeof score === "number" ? score : Number(score);
  const t = typeof total === "number" ? total : Number(total);
  if (!Number.isFinite(s) || !Number.isFinite(t) || t === 0) return null;
  return Math.round((s / t) * 100);
}

function aggregateForCategory(attempts) {
  const totalAttempts = attempts.length;

  let correctSum = 0;
  let wrongSum = 0;
  let correctHas = false;
  let wrongHas = false;

  let scorePctSum = 0;
  let scorePctCount = 0;

  let timeSum = 0;
  let timeCount = 0;

  for (const a of attempts) {
    if (typeof a?.correctCount === "number") {
      correctHas = true;
      correctSum += a.correctCount;
    }

    if (typeof a?.wrongCount === "number") {
      wrongHas = true;
      wrongSum += a.wrongCount;
    }

    const pct = scorePercent(a?.score, a?.total);
    if (typeof pct === "number") {
      scorePctSum += pct;
      scorePctCount += 1;
    }

    if (typeof a?.totalTimeSeconds === "number" && Number.isFinite(a.totalTimeSeconds)) {
      timeSum += a.totalTimeSeconds;
      timeCount += 1;
    }
  }

  return {
    totalAttempts,
    correctHas,
    wrongHas,
    correctSum,
    wrongSum,
    avgScorePercent: scorePctCount ? Math.round(scorePctSum / scorePctCount) : null,
    timeHas: timeCount > 0,
    totalTimeSeconds: timeCount ? timeSum : null,
    avgTimeSeconds: timeCount ? timeSum / timeCount : null,
  };
}

function displayMetricLabel(key) {
  switch (key) {
    case "totalTimeSeconds":
      return "Total Time";
    case "missedTargets":
      return "Missed Targets";
    default: {
      const k = String(key);
      return k
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\b\w/g, (m) => m.toUpperCase());
    }
  }
}

function extraMetricsForAttempt(r) {
  const excluded = new Set([
    "id",
    "username",
    "test_type",
    "submitted_at",
    "score",
    "total",
    "correctCount",
    "wrongCount",
    "totalTimeSeconds",
    "totalTime",
    "avgTimeSeconds",
  ]);

  const knownOrder = ["missedTargets"];

  const entries = Object.entries(r || {})
    .filter(([k, v]) => !excluded.has(k))
    .filter(([k, v]) => {
      if (v === null || v === undefined) return false;
      if (typeof v === "string" && v.trim() === "") return false;
      return true;
    });

  const ordered = [];
  for (const key of knownOrder) {
    const found = entries.find(([k]) => k === key);
    if (found) ordered.push(found);
  }
  for (const e of entries) {
    if (!ordered.some(([k]) => k === e[0])) ordered.push(e);
  }

  return ordered.map(([k, v]) => ({ label: displayMetricLabel(k), value: v }));
}

function formatTooltipDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function buildCategoryChartData(attempts) {
  // Sort oldest -> newest so x=1..N matches "number of tests taken"
  const sorted = [...attempts].sort((a, b) => {
    const da = a?.submitted_at ? new Date(a.submitted_at).getTime() : 0;
    const db = b?.submitted_at ? new Date(b.submitted_at).getTime() : 0;
    return da - db;
  });

  // Note: Chart.js Line in "category" mode wants {x,y} points and we store
  // the original submitted_at in each point for the tooltip.
  return sorted
    .map((r, idx) => {
      const pct = scorePercent(r?.score, r?.total);
      if (pct === null) return null;
      return {
        x: idx + 1,
        y: pct,
        date: r?.submitted_at || "",
        score: r?.score,
        total: r?.total,
      };
    })
    .filter(Boolean);
}



export default function TestScores() {
  const { language, setLanguage } = useLanguage();
  const t = translations[language];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);


  const username = useMemo(() => {
    const userRaw = localStorage.getItem("user");
    if (!userRaw) return null;

    // In this repo, Login() stores a plain string (username) in localStorage.
    // Some older flows may store a JSON object.
    if (typeof userRaw === "string" && userRaw.trim() && !userRaw.trim().startsWith("{")) {
      return userRaw.trim();
    }

    const parsed = safeParseUser(userRaw);
    return parsed?.username || parsed?.email || null;
  }, []);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        if (!username) {
          if (!alive) return;
          setError("User not found. Please login again.");
          setResults([]);
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/results/me/?username=${encodeURIComponent(username)}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to fetch results");
        }

        if (!alive) return;
        setResults(Array.isArray(data?.results) ? data.results : []);
        setLoading(false);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load results");
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [username]);

  // Refresh data periodically so the charts update in realtime without page reload.
  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger re-fetch by re-using the existing load effect: easiest way is to
      // update state via a new request.
      // We keep it lightweight and reuse the same URL.
      (async () => {
        if (!username) return;
        try {
          const res = await fetch(`${API_BASE}/results/me/?username=${encodeURIComponent(username)}`);
          const data = await res.json();
          if (res.ok) {
            setResults(Array.isArray(data?.results) ? data.results : []);
          }
        } catch {
          // ignore network errors; next tick may succeed
        }
      })();
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, [username]);

  const grouped = useMemo(() => {
    const byType = new Map();


    const sortedAttempts = [...results].sort((a, b) => {
      const da = a?.submitted_at ? new Date(a.submitted_at).getTime() : 0;
      const db = b?.submitted_at ? new Date(b.submitted_at).getTime() : 0;
      return db - da;
    });

    for (const r of sortedAttempts) {
      const type = r?.test_type || "unknown";
      if (!byType.has(type)) byType.set(type, []);
      byType.get(type).push(r);
    }

    const categories = [...byType.entries()].map(([type, attempts]) => {
      const agg = aggregateForCategory(attempts);
      return { type, attempts, agg };
    });

    // Sort categories by most recent attempt
    categories.sort((a, b) => {
      const ar = a.attempts[0]?.submitted_at ? new Date(a.attempts[0].submitted_at).getTime() : 0;
      const br = b.attempts[0]?.submitted_at ? new Date(b.attempts[0].submitted_at).getTime() : 0;
      return br - ar;
    });

    return categories;
  }, [results]);

  const progressReport = useMemo(() => {
    if (!results.length) return null;
    const totalAttempts = results.length;
    let sumPct = 0;
    let pctCount = 0;
    let bestPct = 0;
    let totalTime = 0;
    let timeCount = 0;

    for (const r of results) {
      const pct = scorePercent(r?.score, r?.total);
      if (typeof pct === "number") {
        sumPct += pct;
        pctCount += 1;
        if (pct > bestPct) bestPct = pct;
      }
      if (typeof r?.totalTimeSeconds === "number" && Number.isFinite(r.totalTimeSeconds)) {
        totalTime += r.totalTimeSeconds;
        timeCount += 1;
      }
    }

    const avgPct = pctCount ? Math.round(sumPct / pctCount) : 0;
    const avgTime = timeCount ? Math.round(totalTime / timeCount) : null;
    const generatedOn = new Date().toLocaleString();
    const strongestArea = grouped[0]?.type ? formatTestType(grouped[0].type) : "—";
    const summary =
      avgPct >= 80
        ? "Overall performance is strong with consistent outcomes across tests."
        : avgPct >= 60
          ? "Performance is stable with room for targeted improvements in weaker sections."
          : "Baseline performance indicates improvement potential with regular practice.";

    return { totalAttempts, avgPct, bestPct, avgTime, generatedOn, strongestArea, summary };
  }, [results, grouped]);

  if (loading) {
    return (
      <div className="testScores-loading">
        <div className="testScores-loading-card">{t.loadingTestScores}</div>
      </div>
    );
  }

  const navigateLanding = () => {
    // Keep it simple + consistent with other pages
    window.location.href = "/landing";
  };

  return (
    <div className="testScores-container">
      <div className="testScores-headerRow">
        <button className="testScores-back-btn" type="button" onClick={navigateLanding}>
          {t.back}
        </button>
        <div className="testScores-header">{t.viewTestScoresHeading}</div>
        <label className="testScores-language-switch" htmlFor="testScores-language-select">
          <span>{t.language}</span>
          <select
            id="testScores-language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Language selection"
          >
            <option value="en">{t.english}</option>
            <option value="hi">{t.hindi}</option>
          </select>
        </label>
      </div>


      {error && <div className="testScores-error">{error}</div>}

      {!error && grouped.length === 0 && <div className="testScores-empty">{t.noTestAttempts}</div>}

      {!error && (
        <div className="testScores-reportCard">
          <div className="testScores-reportTitle">{t.progressReport}</div>
          {progressReport ? (
            <>
              <div className="testScores-reportMeta">{t.reportGeneratedOn}: {progressReport.generatedOn}</div>
              <div className="testScores-reportGrid">
                <div><span>{t.totalAttemptsLabel}:</span> <b>{progressReport.totalAttempts}</b></div>
                <div><span>{t.averageScoreLabel}:</span> <b>{progressReport.avgPct}%</b></div>
                <div><span>{t.bestScoreLabel}:</span> <b>{progressReport.bestPct}%</b></div>
                <div><span>{t.averageTimeLabel}:</span> <b>{progressReport.avgTime !== null ? `${progressReport.avgTime}s` : "—"}</b></div>
              </div>
              <div className="testScores-reportSummary">
                <div className="testScores-reportSummaryTitle">{t.reportSummaryTitle}</div>
                <p>{progressReport.summary}</p>
                <p><b>Strongest recent area:</b> {progressReport.strongestArea}</p>
              </div>
            </>
          ) : (
            <div className="testScores-reportMeta">{t.reportSummaryEmpty}</div>
          )}
        </div>
      )}

      <div className="testScores-categoryGrid">
        {grouped.map((cat) => {
          const categoryName = formatTestType(cat.type);
          const { agg } = cat;
          const chartPoints = buildCategoryChartData(cat.attempts);

          return (
            <div className="testScores-categoryCard" key={cat.type}>
                <div className="testScores-categoryTop">
                  <div className="testScores-categoryTitle">{categoryName}</div>
                  <div className="testScores-categoryMeta">
                    {agg.totalAttempts} {agg.totalAttempts === 1 ? t.attempt : t.attempts}
                  </div>
                </div>

                {cat.attempts?.length > 0 && (
                  <div className="testScores-chartWrap">
                    <div className="testScores-chartTitle">{t.performanceOverAttempts}</div>
                    <Line
                      key={`${cat.type}-${cat.attempts.length}`}
                      data={{
                        labels: chartPoints.map((point) => String(point.x)),
                        datasets: [
                          {
                            label: "Score %",
                            data: chartPoints.map((point) => point.y),
                            pointData: chartPoints,
                            showLine: true,
                            borderColor: "rgba(96, 165, 250, 0.95)",
                            backgroundColor: "rgba(96, 165, 250, 0.18)",
                            pointBackgroundColor: "rgba(96, 165, 250, 1)",
                            pointBorderColor: "rgba(99, 102, 241, 0.65)",
                            pointRadius: 4,
                            pointHoverRadius: 7,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            callbacks: {
                              label: (ctx) => {
                                const pointMeta = ctx.dataset.pointData?.[ctx.dataIndex];
                                const v = pointMeta || {};
                                if (!v) return "";
                                const pct = Number(v.y);
                                const score = v.score;
                                const total = v.total;
                                const scoreStr =
                                  score !== undefined && total !== undefined
                                    ? `${score} / ${total}`
                                    : "";

                                const pctStr = Number.isFinite(pct) ? `${Math.round(pct)}%` : "—";
                                return scoreStr ? `${pctStr} (${scoreStr})` : pctStr;
                              },
                              afterLabel: (ctx) => {
                                const pointMeta = ctx.dataset.pointData?.[ctx.dataIndex];
                                const v = pointMeta || {};
                                if (!v?.date) return "";
                                return formatTooltipDateTime(v.date);
                              },
                            },
                          },
                        },
                        animation: {
                          duration: 650,
                          easing: "easeOutQuart",
                        },
                        animations: {
                          tension: {
                            duration: 650,
                            easing: "easeOutQuart",
                          },
                        },
                        scales: {
                          x: {
                            title: {
                              display: true,
                              text: "# of tests taken",
                            },
                            ticks: {
                              color: "rgba(148, 163, 184, 0.95)",
                            },
                            grid: {
                              color: "rgba(255,255,255,0.05)",
                            },
                          },
                          y: {
                            min: 0,
                            max: 100,
                            title: {
                              display: true,
                              text: "Performance %",
                            },
                            ticks: {
                              color: "rgba(148, 163, 184, 0.95)",
                              callback: (val) => `${val}%`,
                            },
                            grid: {
                              color: "rgba(255,255,255,0.05)",
                            },
                          },
                        },
                      }}
                    />
                  </div>
                )}

              <div className="testScores-categorySummary">

                <div className="testScores-summaryItem">
                  <div className="testScores-summaryLabel">{t.avgScore}</div>
                  <div className="testScores-summaryValue">{agg.avgScorePercent !== null ? `${agg.avgScorePercent}%` : "—"}</div>
                </div>

                <div className="testScores-summaryItem">
                  <div className="testScores-summaryLabel">{t.totalCorrect}</div>
                  <div className="testScores-summaryValue">{agg.correctHas ? agg.correctSum : "—"}</div>
                </div>

                <div className="testScores-summaryItem">
                  <div className="testScores-summaryLabel">{t.totalWrong}</div>
                  <div className="testScores-summaryValue">{agg.wrongHas ? agg.wrongSum : "—"}</div>
                </div>

                {agg.timeHas && (
                  <div className="testScores-summaryItem">
                    <div className="testScores-summaryLabel">{t.time}</div>
                    <div className="testScores-summaryValue">
                      {agg.totalTimeSeconds !== null ? `${Math.round(agg.totalTimeSeconds)}s` : "—"}
                      <span className="testScores-summarySub">Avg {agg.avgTimeSeconds !== null ? `${Math.round(agg.avgTimeSeconds)}s` : "—"}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="testScores-attemptList">
                {cat.attempts.map((r) => {
                  const score = r?.score ?? 0;
                  const total = r?.total ?? 100;
                  const correctCount = r?.correctCount;
                  const wrongCount = r?.wrongCount;
                  const pct = scorePercent(r?.score, r?.total);
                  const extra = extraMetricsForAttempt(r);

                  return (
                    <div className="testScores-attemptRow" key={r?.id || `${r?.test_type}-${r?.submitted_at}`}
                    >
                      <div className="testScores-attemptTop">
                        <div className="testScores-attemptDate">{formatDate(r?.submitted_at)}</div>
                        <div className="testScores-attemptScore">
                          {score} / {total}
                          {pct !== null && <span className="testScores-attemptPct">({pct}%)</span>}
                        </div>
                      </div>

                      <div className="testScores-attemptMetrics">
                        <div>
                          {t.correct}: <b>{typeof correctCount === "number" ? correctCount : "—"}</b>
                        </div>
                        <div>
                          {t.wrong}: <b>{typeof wrongCount === "number" ? wrongCount : "—"}</b>
                        </div>
                        {typeof r?.totalTimeSeconds === "number" && (
                          <div style={{ gridColumn: "1 / -1" }}>
                            {t.totalTime}: <b>{r.totalTimeSeconds}</b> sec
                          </div>
                        )}
                      </div>

                      {extra.length > 0 && (
                        <div className="testScores-attemptExtras">
                          {extra.map((m) => (
                            <div key={m.label}>
                              {m.label}: <b>{m.value}</b>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

