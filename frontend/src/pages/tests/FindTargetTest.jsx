import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./findTargetTest.css";
import { useLanguage } from "../../context/LanguageContext";
import { translations } from "../../i18n/translations";

// Find target test spec
const TEST_CONFIG = {

  targetChar: "A",
  nonTargetChars: ["B", "C", "D", "E", "F", "G", "H"],
  gridSizeMin: 5,
  gridSizeMax: 9,
  timeLimitPerQuestionSeconds: 20,
  questionCount: 10 // exactly 10 questions
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function makeGrid(size, targetIndex, targetChar, nonTargetChars) {
  const totalCells = size * size;
  const grid = new Array(totalCells).fill("");

  // Fill non-target cells with values guaranteed != targetChar
  const available = nonTargetChars.filter((c) => c !== targetChar);
  for (let i = 0; i < totalCells; i++) {
    if (i === targetIndex) continue;
    grid[i] = available[i % available.length];
  }

  grid[targetIndex] = targetChar;
  return grid;
}


function FindTargetTest() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const [loading, setLoading] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0); // 0..9

  const [gridSize, setGridSize] = useState(TEST_CONFIG.gridSizeMin);
  const [grid, setGrid] = useState([]);
  const [targetIndex, setTargetIndex] = useState(null);

  const [selectedWrongCount, setSelectedWrongCount] = useState(0);
  const [missedTargets, setMissedTargets] = useState(0);
  const [correctSelections, setCorrectSelections] = useState(0);

  const [timeLeft, setTimeLeft] = useState(TEST_CONFIG.timeLimitPerQuestionSeconds);
  const [phase, setPhase] = useState("playing"); // playing | finished

  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem("user")) {
      navigate("/login");
      return;
    }
    startTimeRef.current = Date.now();
    setLoading(false);
  }, [navigate]);

  // Update grid size (difficulty) for each question
  useEffect(() => {
    if (loading) return;

    const t = TEST_CONFIG.questionCount <= 1 ? 1 : questionIndex / (TEST_CONFIG.questionCount - 1);
    const size = Math.round(TEST_CONFIG.gridSizeMin + t * (TEST_CONFIG.gridSizeMax - TEST_CONFIG.gridSizeMin));
    setGridSize(clamp(size, TEST_CONFIG.gridSizeMin, TEST_CONFIG.gridSizeMax));
  }, [questionIndex, loading]);

  // Start a question: create grid and countdown
  useEffect(() => {
    if (loading) return;

    const size = gridSize;
    const totalCells = size * size;
    const idx = Math.floor(Math.random() * totalCells);

    setTargetIndex(idx);
    setGrid(makeGrid(size, idx, TEST_CONFIG.targetChar, TEST_CONFIG.nonTargetChars));

    setPhase("playing");
    setTimeLeft(TEST_CONFIG.timeLimitPerQuestionSeconds);
  }, [gridSize, questionIndex, loading]);

  // Countdown
  useEffect(() => {
    if (loading) return;
    if (phase !== "playing") return;

    if (timeLeft <= 0) {
      setMissedTargets((prev) => prev + 1);
      setPhase("finished");
      return;
    }

    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase, loading]);

  const finish = async () => {
    const totalTimeSeconds = Math.max(
      0,
      Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000)
    );

    const finalScoreOutOf100 = correctSelections * 10; // each correct = 10 marks

    let username = "anonymous";
    const userRaw = localStorage.getItem("user");
    try {
      const parsed = JSON.parse(userRaw);
      username = parsed?.username || parsed?.email || "anonymous";
    } catch {
      // ignore
    }

    const payload = {
      score: finalScoreOutOf100,
      total: 100,
      test_type: "find_target",
      username,
      attempts: TEST_CONFIG.questionCount,
      correctCount: correctSelections,
      wrongCount: selectedWrongCount,
      missedTargets,
      totalTimeSeconds,
      cognitive_metrics: {},
      final_score_overall: clamp(finalScoreOutOf100, 0, 100)
    };

    try {
      await fetch("http://127.0.0.1:8000/api/result/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error("Failed saving find target result", e);
    }

    navigate("/result", {
      state: {
        score: finalScoreOutOf100,
        total: 100,
        correctCount: correctSelections,
        wrongCount: selectedWrongCount,
        test_type: "find_target",
        missedTargets,
        totalTimeSeconds
      }
    });
  };

  // Advance/finish when question ends
  useEffect(() => {
    if (phase !== "finished") return;

    if (questionIndex >= TEST_CONFIG.questionCount - 1) {
      finish();
      return;
    }

    setQuestionIndex((p) => p + 1);
  }, [phase, questionIndex]);


  const onCellClick = (index) => {
    if (phase !== "playing") return;
    if (index === targetIndex) {
      setCorrectSelections((prev) => prev + 1);
      setPhase("finished");
    } else {
      setSelectedWrongCount((prev) => prev + 1);
    }
  };

  if (loading) {
    return <div className="loading">{t.loadingTest}</div>;
  }

  return (
    <div className="ft-container">
      <div className="ft-header">
        <button className="back-btn" onClick={() => navigate("/landing")} type="button">
          {t.back}
        </button>
        <div className="ft-meta">
          <div className="ft-timer">
            {t.timeLeft}: <span className="ft-timer-value">{timeLeft}s</span>
          </div>
          <div className="ft-round">
            {t.question}: {questionIndex + 1}/{TEST_CONFIG.questionCount}
          </div>
        </div>
      </div>

      <div className="ft-body">
        <div className="ft-instruction">
          {t.findTargetSymbol}: <span className="ft-target">{TEST_CONFIG.targetChar}</span>
        </div>

        <div className="ft-grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
          {grid.map((cell, idx) => {
            const isTarget = idx === targetIndex;
            return (
              <button
                type="button"
                key={idx}
                className={`ft-cell ${isTarget ? "ft-cell-target" : ""}`}
                onClick={() => onCellClick(idx)}
                aria-label={isTarget ? "Target" : "Cell"}
              >
                {cell.trim() ? cell : ""}
              </button>
            );
          })}
        </div>

        <div className="ft-progress">
          <div>
            {t.correct}: <b>{correctSelections}</b>
          </div>
          <div>
            {t.wrong}: <b>{selectedWrongCount}</b>
          </div>
          <div>
            {t.missed}: <b>{missedTargets}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FindTargetTest;

