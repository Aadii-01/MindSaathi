import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./stroopTest.css";
import "./patternCompletionTest.css";
import { useLanguage } from "../../context/LanguageContext";
import { translations } from "../../i18n/translations";


const TEST_CONFIG = {
  questionCount: 10,
  timeLimitPerQuestionSeconds: 5,
  buttons: ["RED", "GREEN", "BLUE", "YELLOW"],
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const COLOR_MAP = {
  RED: "#ef4444",
  GREEN: "#22c55e",
  BLUE: "#3b82f6",
  YELLOW: "#facc15",
};

function generateStroopQuestions() {
  // Fixed size, deterministic-ish per session by shuffling with Math.random.
  const colors = [...TEST_CONFIG.buttons];

  const questions = [];
  for (let i = 0; i < TEST_CONFIG.questionCount; i++) {
    // The word text and the actual display color should conflict sometimes.
    // 70% conflict, 30% match.
    const word = colors[Math.floor(Math.random() * colors.length)];
    const conflict = Math.random() < 0.7;

    let textColor = colors[Math.floor(Math.random() * colors.length)];
    if (!conflict) textColor = word;
    if (conflict) {
      // ensure different when possible
      if (textColor === word) {
        const alt = colors.filter((c) => c !== word);
        textColor = alt[Math.floor(Math.random() * alt.length)];
      }
    }

    questions.push({
      displayedWord: word,
      textColorKey: textColor,
      correctAnswer: textColor, // user must identify TEXT COLOR
    });
  }

  return questions;
}

function getUserName() {
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
  return username;
}

function StroopTest() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const questions = useMemo(() => generateStroopQuestions(), []);
  // questionCount is set to 10 in TEST_CONFIG (already enforced). 


  const [loading, setLoading] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0); // 0..9

  const [phase, setPhase] = useState("playing"); // playing | finished
  const [timeLeft, setTimeLeft] = useState(TEST_CONFIG.timeLimitPerQuestionSeconds);

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const questionStartRef = useRef(null);
  const startTimeRef = useRef(null);

  const current = questions[questionIndex];
  // Important: never reveal correctness before user answers.


  useEffect(() => {
    if (!localStorage.getItem("user")) {
      navigate("/login");
      return;
    }
    setLoading(false);
    questionStartRef.current = Date.now();
    startTimeRef.current = Date.now();
  }, [navigate]);

  // Reset per question
  useEffect(() => {
    if (loading) return;
    setPhase("playing");
    setTimeLeft(TEST_CONFIG.timeLimitPerQuestionSeconds);
    questionStartRef.current = Date.now();
  }, [questionIndex, loading]);

  useEffect(() => {
    if (loading) return;
    if (phase !== "playing") return;

    if (timeLeft <= 0) {
      // timeout counts as wrong
      setWrongCount((p) => p + 1);
      setPhase("finished");
      return;
    }

    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase, loading]);

  useEffect(() => {
    if (loading) return;
    if (phase !== "finished") return;

    if (questionIndex >= TEST_CONFIG.questionCount - 1) {
      finish();
      return;
    }

    setQuestionIndex((p) => p + 1);
  }, [phase, questionIndex, loading]);

  const chooseAnswer = (choice) => {
    if (phase !== "playing") return;

    const isCorrect = choice === current.correctAnswer;
    if (isCorrect) setCorrectCount((p) => p + 1);
    else setWrongCount((p) => p + 1);

    setPhase("finished");
  };


  const finish = async () => {
    const totalTimeSeconds = Math.max(0, Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000));
    const scoreOutOf100 = clamp(correctCount * 10, 0, 100);

    const payload = {
      score: scoreOutOf100,
      total: 100,
      test_type: "stroop",
      username: getUserName(),
      attempts: TEST_CONFIG.questionCount,
      correctCount,
      wrongCount,
      totalTimeSeconds,
      cognitive_metrics: {
        logical_reasoning: 0,
        pattern_recognition: 0,
        problem_solving_ability: 0,
        decision_accuracy: clamp(Math.round((correctCount / TEST_CONFIG.questionCount) * 100), 0, 100),
        cognitive_flexibility: 0,
        processing_speed: clamp(Math.round((correctCount / TEST_CONFIG.questionCount) * 100), 0, 100),
      },
      final_score_overall: clamp(scoreOutOf100, 0, 100),
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
        correctCount,
        wrongCount,
        test_type: "stroop",
        totalTimeSeconds,
      },
    });
  };

  if (loading) return <div className="loading">{t.loadingTest}</div>;

  return (
    <div className="st-container">
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
        <div className="pct-instruction">{t.stroopInstruction}</div>


        <div className="pct-question-card">
          <div className="pct-question-text">{current.displayedWord}</div>
          <div className="pct-help">{t.stroopHelp}</div>


          <div className="st-word" style={{ color: COLOR_MAP[current.textColorKey] }}>
            {current.displayedWord}
          </div>



          <div className="st-options">
            {TEST_CONFIG.buttons.map((b) => (
              <button
                type="button"
                key={b}
                className="st-option"
                onClick={() => chooseAnswer(b)}
                disabled={phase !== "playing"}
              >
                {b}
              </button>
            ))}
          </div>




        </div>

        <div className="pct-progress" style={{ marginTop: 6, marginBottom: 22 }}>
          <div>
            {t.correct}: <b>{correctCount}</b>
          </div>
          <div>
            {t.wrong}: <b>{wrongCount}</b>
          </div>
          <div>
            {t.score}: <b>{clamp(correctCount * 10, 0, 100)}</b>/100
          </div>
        </div>

      </div>
    </div>
  );
}

export default StroopTest;

