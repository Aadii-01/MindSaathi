import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./patternCompletionTest.css";
import { useLanguage } from "../../context/LanguageContext";
import { translations } from "../../i18n/translations";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const TEST_CONFIG = {
  questionCount: 10,
  timeLimitPerQuestionSeconds: 25,

  // Each question is one of these pattern groups.
  // We'll create 3 groups across the 10 questions.
  difficultyOrder: ["easy", "easy", "easy", "medium", "medium", "medium", "hard", "hard", "hard", "hard"],
  patternOrder: [
    "number_sequence",
    "shape_pattern",
    "symbol_sequence",
    "number_sequence",
    "shape_pattern",
    "symbol_sequence",
    "number_sequence",
    "shape_pattern",
    "symbol_sequence",
    "number_sequence"
  ],
};

function buildPatternQuestion(index0) {
  const difficulty = TEST_CONFIG.difficultyOrder[index0] ?? "easy";
  const patternType = TEST_CONFIG.patternOrder[index0] ?? "number_sequence";

  // We generate deterministic-ish content per question index.
  const seed = 1000 + index0 * 17;

  if (patternType === "number_sequence") {
    // Simple arithmetic progression with varying step.
    const base = (seed % 7) + 2;
    const stepBase = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
    const step = stepBase + (seed % 3); // 1-3, 2-4, 3-5 depending on difficulty

    // Length varies by difficulty to feel different.
    const length = difficulty === "easy" ? 5 : difficulty === "medium" ? 6 : 7;
    const seq = new Array(length).fill(0).map((_, i) => base + i * step);
    const answer = base + length * step;

    return {
      patternType,
      difficulty,
      prompt: `Complete the sequence: ${seq.join(", ")} , ?`,
      expected: String(answer),
      help: "Enter the next number.",
    };
  }

  if (patternType === "shape_pattern") {
    // We show an ASCII shape cycling pattern.
    // Easy: circle -> square -> triangle
    // Medium: square -> triangle -> diamond -> square...
    // Hard: circle -> diamond -> square -> triangle...
    const easyCycle = ["●", "■", "▲"];
    const mediumCycle = ["■", "▲", "◆", "■"];
    const hardCycle = ["●", "◆", "■", "▲"];

    const cycle = difficulty === "easy" ? easyCycle : difficulty === "medium" ? mediumCycle : hardCycle;

    const length = difficulty === "easy" ? 5 : difficulty === "medium" ? 6 : 7;
    const shown = new Array(length).fill(0).map((_, i) => cycle[(seed + i) % cycle.length]);
    const expectedShape = cycle[(seed + length) % cycle.length];

    return {
      patternType,
      difficulty,
      prompt: `Complete the shape pattern: ${shown.join(" ")}  ...  ?`,
      expected: expectedShape,
      help: "Enter the next shape symbol exactly as shown.",
      accept: [expectedShape],
    };
  }

  // symbol_sequence
  const easySymbols = ["@", "#", "$", "%", "&"]; // use for easy/medium/hard by step
  const mediumSymbols = ["*", "@", "#", "$", "%", "&"];
  const hardSymbols = ["&", "*", "@", "#", "$", "%", "!", "?" ];

  const alphabet = difficulty === "easy" ? easySymbols : difficulty === "medium" ? mediumSymbols : hardSymbols;

  const step = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
  const length = difficulty === "easy" ? 5 : difficulty === "medium" ? 6 : 7;

  const startIdx = seed % alphabet.length;
  const seq = new Array(length).fill(0).map((_, i) => alphabet[(startIdx + i * step) % alphabet.length]);
  const expected = alphabet[(startIdx + length * step) % alphabet.length];

  return {
    patternType,
    difficulty,
    prompt: `Complete the symbol sequence: ${seq.join(" ")}  ?`,
    expected: expected,
    help: "Enter the next symbol.",
  };
}

function toClassification(scoreOutOf100) {
  if (scoreOutOf100 >= 90) return { label: "Excellent Reasoning", color: "#22c55e" };
  if (scoreOutOf100 >= 75) return { label: "Good Reasoning", color: "#60a5fa" };
  if (scoreOutOf100 >= 60) return { label: "Average Reasoning", color: "#f59e0b" };
  if (scoreOutOf100 >= 40) return { label: "Below Average", color: "#fb7185" };
  return { label: "Needs Improvement", color: "#ef4444" };
}

function PatternCompletionTest() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const [loading, setLoading] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0); // 0..9
  const [phase, setPhase] = useState("playing"); // playing | finished

  const [timeLeft, setTimeLeft] = useState(TEST_CONFIG.timeLimitPerQuestionSeconds);
  const [answer, setAnswer] = useState("");

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  // Track per-question response time
  const questionStartRef = useRef(null);
  const questionTimeMsRef = useRef([]); // ms per question

  const currentQuestion = useMemo(() => buildPatternQuestion(questionIndex), [questionIndex]);

  useEffect(() => {
    if (!localStorage.getItem("user")) {
      navigate("/login");
      return;
    }
    setLoading(false);
    questionStartRef.current = Date.now();
  }, [navigate]);

  useEffect(() => {
    if (loading) return;
    // reset on new question
    setPhase("playing");
    setTimeLeft(TEST_CONFIG.timeLimitPerQuestionSeconds);
    setAnswer("");
    questionStartRef.current = Date.now();
  }, [questionIndex, loading]);

  useEffect(() => {
    if (loading) return;
    if (phase !== "playing") return;

    if (timeLeft <= 0) {
      // timeout -> wrong
      const dt = Date.now() - (questionStartRef.current || Date.now());
      questionTimeMsRef.current[questionIndex] = dt;
      setWrongCount((p) => p + 1);
      setPhase("finished");
      return;
    }

    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase, loading, questionIndex]);

  useEffect(() => {
    if (loading) return;
    if (phase !== "finished") return;

    if (questionIndex >= TEST_CONFIG.questionCount - 1) {
      finish();
      return;
    }

    setQuestionIndex((p) => p + 1);
  }, [phase, questionIndex, loading]);

  const finish = async () => {
    const totalTimeSeconds = Math.max(
      0,
      Math.round(
        (questionTimeMsRef.current.reduce((a, b) => a + (b || 0), 0)) / 1000
      )
    );

    const scoreOutOf100 = correctCount * 10;
    const total = 100;

    let username = "anonymous";
    const userRaw = localStorage.getItem("user");
    try {
      const parsed = JSON.parse(userRaw);
      username = parsed?.username || parsed?.email || "anonymous";
    } catch {
      // ignore
    }

    const payload = {
      score: scoreOutOf100,
      total,
      test_type: "pattern_completion",
      username,
      attempts: TEST_CONFIG.questionCount,
      correctCount,
      wrongCount,
      totalTimeSeconds,
      cognitive_metrics: {
        logical_reasoning: clamp(55 + correctCount * 4, 0, 100),
        pattern_recognition: clamp(50 + correctCount * 4, 0, 100),
        problem_solving_ability: clamp(45 + correctCount * 4, 0, 100),
        decision_accuracy: clamp(40 + Math.round((correctCount / TEST_CONFIG.questionCount) * 100), 0, 100),
        cognitive_flexibility: clamp(35 + Math.round((correctCount / TEST_CONFIG.questionCount) * 100), 0, 100),
      },
      final_score_overall: clamp(scoreOutOf100, 0, 100),
    };

    try {
      await fetch("http://127.0.0.1:8000/api/result/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error("Failed saving pattern completion result", e);
    }

    navigate("/result", {
      state: {
        score: scoreOutOf100,
        total,
        correctCount,
        wrongCount,
        test_type: "pattern_completion",
        totalTimeSeconds,
        cognitive_metrics: payload.cognitive_metrics,
      },
    });
  };

  const submit = () => {
    if (phase !== "playing") return;
    const dt = Date.now() - (questionStartRef.current || Date.now());
    questionTimeMsRef.current[questionIndex] = dt;

    const user = String(answer ?? "").trim();
    const expected = String(currentQuestion.expected).trim();
    const isCorrect = user === expected;

    if (isCorrect) setCorrectCount((p) => p + 1);
    else setWrongCount((p) => p + 1);

    setPhase("finished");
  };

  if (loading) {
    return <div className="loading">{t.loadingTest}</div>;
  }

  const classification = toClassification(correctCount * 10);

  return (
    <div className="pct-container">
      <div className="pct-header">
        <button className="back-btn" onClick={() => navigate("/landing")} type="button">
          {t.back}
        </button>

        <div className="pct-meta">
          <div className="pct-timer">
            {t.timeLeft}: <span className="pct-timer-value">{timeLeft}s</span>
          </div>
          <div className="pct-round">
            {t.question}: {questionIndex + 1}/{TEST_CONFIG.questionCount}
          </div>
        </div>
      </div>

      <div className="pct-body">
        <div className="pct-instruction">{t.patternCompletion} ({currentQuestion.difficulty})</div>

        <div className="pct-question-card">
          <div className="pct-question-text">{currentQuestion.prompt}</div>
          <div className="pct-help">{currentQuestion.help}</div>

          <label className="pct-label">{t.yourAnswer}</label>
          <input
            className="pct-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={currentQuestion.expected}
            disabled={phase !== "playing"}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            autoComplete="off"
          />

          <button
            className="next-btn"
            onClick={submit}
            disabled={phase !== "playing"}
            type="button"
          >
            {t.submit}
          </button>
        </div>

        <div className="pct-progress">
          <div>
            {t.correct}: <b>{correctCount}</b>
          </div>
          <div>
            {t.wrong}: <b>{wrongCount}</b>
          </div>
          <div>
            {t.currentStatus}: <b style={{ color: classification.color }}>{classification.label}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatternCompletionTest;

