import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./imageTest.css";

function ImageTest() {
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selected, setSelected] = useState([]);
  const [usedIds, setUsedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth check
  useEffect(() => {
    if (!localStorage.getItem("user")) {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch question from backend
  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://127.0.0.1:8000/api/image-test/");
      const data = await res.json();

      if (usedIds.includes(data.id)) {
        fetchQuestion(); // retry
        return;
      }

      setUsedIds((prev) => [...prev, data.id]);
      setQuestion(data);
      setSelected([]);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching question:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleNext();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Handle image click
  const handleSelect = (index) => {
    if (selected.includes(index)) return;

    const updated = [...selected, index];
    setSelected(updated);

    // Only count once per question
    if (question.correct.includes(index) && selected.length === 0) {
      setScore((prev) => prev + 1);
    }
  };

  // Next question
  const handleNext = () => {
    if (round === 10) {
      navigate("/result", { state: { score } });
    } else {
      setRound((prev) => prev + 1);
      setTimeLeft(60);
    }
  };

  if (loading) {
    return <div className="loading">Loading test...</div>;
  }

  if (!question) {
    return (
      <div className="loading" style={{ flexDirection: "column", gap: "16px" }}>
        <span>No question found</span>
        <button className="next-btn" onClick={() => navigate("/landing")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="test-container">
      {/* HEADER */}
      <div className="test-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>

        <div className="timer">{timeLeft}s</div>
      </div>

      {/* QUESTION */}
      <h2 className="question">
        Find: <span>{question.target}</span>
      </h2>

      {/* GRID */}
      <div className="grid">
        {question.images.map((img, index) => (
          <div
            key={index}
            className={`grid-item ${
              selected.includes(index) ? "selected" : ""
            }`}
            onClick={() => handleSelect(index)}
          >
            <img
              src={`http://127.0.0.1:8000${img}`}
              alt="option"
            />
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="test-footer">
        <p>Round: {round}/10</p>
        <p>Score: {score}</p>

        <button onClick={handleNext} className="next-btn">
          {round === 10 ? "Finish →" : "Next →"}
        </button>
      </div>
    </div>
  );
}

export default ImageTest;

