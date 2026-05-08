import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./numberMemoryTest.css";
import { useLanguage } from "../../context/LanguageContext";
import { translations } from "../../i18n/translations";

const TEST_CONFIG = {
  totalQuestions: 10,
  timeLimitPerQuestionSeconds: 25
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function generateNumberString(length) {
  // For short lengths, allow leading zeros for difficulty consistency.
  let s = "";
  for (let i = 0; i < length; i++) {
    s += Math.floor(Math.random() * 10);
  }
  return s;
}

function NumberMemoryTest() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const QUESTION_COUNT = TEST_CONFIG.totalQuestions; // 10
  const INITIAL_DIGIT_LENGTH = 3;
  const MAX_DIGIT_LENGTH = 10;
  const MIN_DISPLAY_SECONDS = 3;
  const MAX_DISPLAY_SECONDS = 5;

  const [loading, setLoading] = useState(true);
  const [digitLength, setDigitLength] = useState(INITIAL_DIGIT_LENGTH);

  const [phase, setPhase] = useState("show"); // show -> hide -> input
  const [displayValue, setDisplayValue] = useState("");
  const [answer, setAnswer] = useState("");

  // Per-question timings are not shown in UI here, but kept for report consistency.
  // We use the existing overall totalTimeSeconds for scoring/report.


  const [attempt, setAttempt] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const expectedRef = useRef(null);
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null);

  const displaySeconds = useMemo(() => {
    // Randomize display time each question between 3–5 seconds.
    return (
      Math.floor(Math.random() * (MAX_DISPLAY_SECONDS - MIN_DISPLAY_SECONDS + 1)) +
      MIN_DISPLAY_SECONDS
    );
  }, []);

  useEffect(() => {
    // Auth check like ImageTest
    if (!localStorage.getItem("user")) {
      navigate("/login");
      return;
    }
    setLoading(false);
    startTimeRef.current = Date.now();
  }, [navigate]);

  const startQuestion = () => {
    const v = generateNumberString(digitLength);
    expectedRef.current = v;
    setDisplayValue(v);
    setAnswer("");
    setPhase("show");

    const seconds = displaySeconds;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setPhase("hide");
      // hide for a tiny moment then allow input
      timeoutRef.current = setTimeout(() => {
        setPhase("input");
        setDisplayValue("");
      }, 200);
    }, seconds * 1000);
  };

  useEffect(() => {
    if (loading) return;
    startQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, digitLength, loading]);

  const finish = async (finalCorrect, finalWrong) => {
    const scoreOutOf100 = finalCorrect * 10; // each correct = 10 marks out of 100
    const totalTimeSeconds = Math.max(
      0,
      Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000)
    );

    const userRaw = localStorage.getItem("user");
    let username = "anonymous";
    try {
      const parsed = JSON.parse(userRaw);
      username = parsed?.username || parsed?.email || "anonymous";
    } catch {
      // ignore
    }

    const payload = {
      score: scoreOutOf100,
      total: 100,
      test_type: "number_memory",
      username,
      attempts: QUESTION_COUNT,
      correctCount: finalCorrect,
      wrongCount: finalWrong,
      totalTimeSeconds,
      // max digit length reached as a useful metric
      digit_span_max: Math.min(MAX_DIGIT_LENGTH, INITIAL_DIGIT_LENGTH + finalCorrect)
    };

    try {
      await fetch("http://127.0.0.1:8000/api/result/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      // Even if backend fails, still show report.
      console.error("Failed saving number memory result", e);
    }

    navigate("/result", {
      state: {
        score: scoreOutOf100,
        total: 100,
        correctCount: finalCorrect,
        wrongCount: finalWrong,
        test_type: "number_memory",
        totalTimeSeconds
      }
    });
  };

  const submitAnswer = () => {
    if (phase !== "input") return;

    const expected = expectedRef.current;
    const isCorrect = String(answer).trim() === String(expected);

    if (isCorrect) {
      const nextCorrect = correctCount + 1;
      setCorrectCount(nextCorrect);

      const nextLen = clamp(digitLength + 1, INITIAL_DIGIT_LENGTH, MAX_DIGIT_LENGTH);
      setDigitLength(nextLen);

      if (attempt === QUESTION_COUNT) {
        finish(nextCorrect, wrongCount);
      } else {
        setAttempt((prev) => prev + 1);
      }
    } else {
      const nextWrong = wrongCount + 1;
      setWrongCount(nextWrong);

      if (attempt === QUESTION_COUNT) {
        finish(correctCount, nextWrong);
      } else {
        // As per spec: increase digit length after every correct answer.
        setAttempt((prev) => prev + 1);
      }
    }
  };

  if (loading) {
    return <div className="loading">{t.loadingTest}</div>;
  }

  const showOrHideLabel =
    phase === "show" ? t.memorize : phase === "hide" ? t.hidden : t.enter;

  return (
    <div className="nmt-container">
      <div className="nmt-header">
        <button
          className="back-btn"
          onClick={() => navigate("/landing")}
          type="button"
        >
          {t.back}
        </button>

      <div className="nmt-meta">
          <div className="nmt-timer">
            {t.timeLimit}: <span className="nmt-timer-value">25s</span>
          </div>
          <div className="nmt-round">
            {t.question}: {attempt}/{QUESTION_COUNT}
          </div>
        </div>
      </div>

      <div className="nmt-body">
        <div className="nmt-instruction">
          {showOrHideLabel} — {t.nmtInstruction}
        </div>

        {phase === "show" && (
          <div className="nmt-number" aria-label="number">
            {displayValue}
          </div>
        )}

        {phase !== "show" && (
          <div className="nmt-input-card">
            <label className="nmt-label">
              {t.enterDigitNumber.replace("{digits}", String(digitLength))}
            </label>
            <input
              className="nmt-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              autoComplete="off"
              placeholder={t.typeNumber}
              disabled={phase === "hide"}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitAnswer();
              }}
            />
            <button
              className="next-btn"
              onClick={submitAnswer}
              disabled={phase === "hide"}
              type="button"
            >
              {t.submit}
            </button>
          </div>
        )}

        <div className="nmt-progress">
          <div className="nmt-progress-item">
            {t.correct}: <b>{correctCount}</b>
          </div>
          <div className="nmt-progress-item">
            {t.wrong}: <b>{wrongCount}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NumberMemoryTest;

