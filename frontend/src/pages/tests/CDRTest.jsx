import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./cdrTest.css";
import { useLanguage } from "../../context/LanguageContext";
import { translations } from "../../i18n/translations";

// Replaced CDR with Typing Speed Test
const TEST_CONFIG = {
  durationSeconds: 60,
  totalWords: 50,
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const WORD_BANK = [
  "the","quick","brown","fox","jumps","over","lazy","dog",
  "learning","future","health","memory","focus","brain","typing",
  "random","words","simple","complex","patient","care","mental",
  "speed","accuracy","timing","practice","improve","today","system",
  "design","coding","frontend","backend","result","score","skill",
  "pattern","number","symbol","shape","sequence","logic","reason",
  "decision","ability","success","challenge","calm","steady","clear",
  "response","time","minute","second","word","task","test","brainpower",
  "cognitive","strength","effort","progress","confidence",
];

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateWords(totalWords) {
  // Deterministic per second
  const seed = Math.floor(Date.now() / 1000);
  const rand = mulberry32(seed);
  const words = [];
  for (let i = 0; i < totalWords; i++) {
    const idx = Math.floor(rand() * WORD_BANK.length);
    words.push(WORD_BANK[idx]);
  }
  return words;
}

function getRanking(scoreOutOf100) {
  if (scoreOutOf100 >= 90) return { label: "Outstanding", color: "#22c55e" };
  if (scoreOutOf100 >= 75) return { label: "Excellent", color: "#60a5fa" };
  if (scoreOutOf100 >= 60) return { label: "Very Good", color: "#f59e0b" };
  if (scoreOutOf100 >= 40) return { label: "Good", color: "#fb7185" };
  return { label: "Needs Improvement", color: "#ef4444" };
}

function TypingTest() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const words = useMemo(() => generateWords(TEST_CONFIG.totalWords), []);

  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(TEST_CONFIG.durationSeconds);
  const [input, setInput] = useState("");
  const [isFinished, setIsFinished] = useState(false);

  const startTimeRef = useRef(null);

  const typedWords = useMemo(() => {
    const trimmed = String(input || "").trim();
    if (!trimmed) return [];
    return trimmed.split(/\s+/).filter(Boolean);
  }, [input]);

  const { correctWords, wrongWords } = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    const maxCompare = Math.min(TEST_CONFIG.totalWords, typedWords.length);

    for (let i = 0; i < maxCompare; i++) {
      if (typedWords[i] === words[i]) correct++;
      else wrong++;
    }

    return { correctWords: correct, wrongWords: wrong };
  }, [typedWords, words]);

  const totalTimeSeconds = useMemo(() => {
    if (!startTimeRef.current) return 0;
    return Math.max(0, TEST_CONFIG.durationSeconds - timeLeft);
  }, [timeLeft]);

  useEffect(() => {
    if (!localStorage.getItem("user")) {
      navigate("/login");
      return;
    }
    setLoading(false);
    startTimeRef.current = Date.now();
  }, [navigate]);

  useEffect(() => {
    if (loading) return;
    if (isFinished) return;
    if (timeLeft <= 0) {
      setIsFinished(true);
      return;
    }

    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, isFinished, loading]);

  const finish = async () => {
    if (isFinished) return;
    setIsFinished(true);

    const correct = correctWords;
    const scoreOutOf100 = clamp(correct * 2, 0, 100); // each correct word = 2 marks

    let username = "anonymous";
    const userRaw = localStorage.getItem("user");
    try {
      if (typeof userRaw === "string" && userRaw.trim() && !userRaw.trim().startsWith("{")) {
        username = userRaw.trim();
      } else {
        const parsed = JSON.parse(userRaw);
        username = parsed?.username || parsed?.email || "anonymous";
      }
    } catch {
      // ignore
    }

    const payload = {
      score: scoreOutOf100,
      total: 100,
      test_type: "typingtest",
      username,
      attempts: TEST_CONFIG.totalWords,
      correctCount: correct,
      wrongCount: wrongWords,
      totalTimeSeconds,
      cognitive_metrics: {
        logical_reasoning: 0,
        pattern_recognition: 0,
        problem_solving_ability: 0,
        decision_accuracy: clamp(Math.round((correct / TEST_CONFIG.totalWords) * 100), 0, 100),
        cognitive_flexibility: 0,
        processing_speed: clamp(Math.round((correct / TEST_CONFIG.totalWords) * 100), 0, 100),
      },
      final_score_overall: scoreOutOf100,
    };

    try {
      await fetch("http://127.0.0.1:8000/api/result/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // ignore
    }

    navigate("/result", {
      state: {
        score: scoreOutOf100,
        total: 100,
        correctCount: correct,
        wrongCount: wrongWords,
        test_type: "typingtest",
        totalTimeSeconds,
      },
    });
  };

  useEffect(() => {
    if (!loading && isFinished) {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished]);

  const scoreOutOf100 = clamp(correctWords * 2, 0, 100);
  const ranking = getRanking(scoreOutOf100);

  if (loading) return <div className="loading">{t.loadingTest}</div>;

  return (
    <div className="cdr-container">
      <div className="cdr-header">
        <button className="back-btn" onClick={() => navigate("/landing")} type="button">
          {t.back}
        </button>

        <div className="cdr-meta">
          <div className="cdr-timer">
            {t.timeLeft}: <span className="cdr-timer-value">{timeLeft}s</span>
          </div>
          <div className="cdr-round">
            {t.words}: {Math.min(typedWords.length, TEST_CONFIG.totalWords)}/{TEST_CONFIG.totalWords}
          </div>
        </div>
      </div>

      <div className="cdr-body">
        <div className="cdr-instruction">{t.typingInstruction}</div>

        <div className="cdr-question-card">
          <div className="cdr-question-title">{t.typeWordsShown}</div>

          <div className="cdr-prompt" style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>
            {words.map((w, i) => {
              const isTyped = i < typedWords.length;
              const isCorrect = isTyped ? typedWords[i] === w : false;
              return (
                <span
                  key={`${i}-${w}`}
                  style={{
                    padding: "2px 6px",
                    borderRadius: 10,
                    margin: "2px 4px 4px 0",
                    display: "inline-block",
                    background: isTyped
                      ? isCorrect
                        ? "rgba(34,197,94,0.12)"
                        : "rgba(239,68,68,0.12)"
                      : "rgba(255,255,255,0.03)",
                    border: isTyped
                      ? isCorrect
                        ? "1px solid rgba(34,197,94,0.25)"
                        : "1px solid rgba(239,68,68,0.25)"
                      : "1px solid rgba(255,255,255,0.06)",
                    color: "#e2e8f0",
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>

          <label className="cdr-label">{t.typingInputLabel}</label>
          <input
            className="cdr-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.typeHere}
            disabled={isFinished}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <div style={{ color: "#94a3b8", fontWeight: 700 }}>
              {t.correct}: <span style={{ color: "#e2e8f0" }}>{correctWords}</span>
            </div>
            <div style={{ color: "#94a3b8", fontWeight: 700 }}>
              {t.wrong}: <span style={{ color: "#e2e8f0" }}>{wrongWords}</span>
            </div>
            <div style={{ color: ranking.color, fontWeight: 900 }}>{t.rank}: {ranking.label}</div>
          </div>

          <button className="next-btn" type="button" onClick={finish} disabled={isFinished}>
            {t.finish}
          </button>
        </div>

        <div className="cdr-progress">
          <div>
            {t.score}: <b>{scoreOutOf100}</b>/100
          </div>
          <div>
            {t.correctWords}: <b>{correctWords}</b>
          </div>
          <div>
            {t.wrongWords}: <b>{wrongWords}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TypingTest;


