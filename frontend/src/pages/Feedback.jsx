import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/feedback.css";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../i18n/translations";

const API_BASE = "http://127.0.0.1:8000/api";

export default function Feedback() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  const questions = [
    t.overallSatisfaction,
    t.uiDesign,
    t.testsQuality,
    t.easeNavigation,
    t.platformSpeed,
    t.accessibilityEase,
    t.likelihoodRecommend,
  ];
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({
    ui: "",
    tests: "",
    ux: "",
    suggestions: "",
  });
  const [loading, setLoading] = useState(false);

  const handleRating = (qIndex, value) => {
    setRatings({ ...ratings, [qIndex]: value });
  };

  const handleSubmit = async () => {
    // Check if all questions are rated
    const unanswered = questions.filter((_, i) => ratings[i] === undefined);
    if (unanswered.length > 0) {
      alert(`Please rate all questions. Missing: ${unanswered.length}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/feedback/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ratings,
          comments,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Feedback submitted successfully!");
        // Reset form
        setRatings({});
        setComments({ ui: "", tests: "", ux: "", suggestions: "" });
      } else {
        alert("Error: " + JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/landing");
  };

  return (
    <div className="feedback-page">
      <div className="feedback-card">
        <div className="feedback-header">
          <h2>{t.platformFeedback}</h2>
          <p>{t.feedbackHelp}</p>
        </div>

        <div className="feedback-body">
          {/* QUESTIONS */}
          {questions.map((q, index) => (
            <div className="question-row" key={index}>
              <h4>{q}</h4>

              <div className="radio-group">
                {[1, 2, 3, 4, 5].map((num) => (
                  <label
                    key={num}
                    className={ratings[index] === num ? "selected" : ""}
                  >
                    <input
                      type="radio"
                      name={`q${index}`}
                      onChange={() => handleRating(index, num)}
                      checked={ratings[index] === num}
                    />
                    <span>{num}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* COMMENTS */}
          <div className="comments-section">
            <h4>{t.additionalComments}</h4>

            <textarea
              placeholder={t.uiFeedback}
              value={comments.ui}
              onChange={(e) =>
                setComments({ ...comments, ui: e.target.value })
              }
            />

            <textarea
              placeholder={t.testFeedback}
              value={comments.tests}
              onChange={(e) =>
                setComments({ ...comments, tests: e.target.value })
              }
            />

            <textarea
              placeholder={t.userExperience}
              value={comments.ux}
              onChange={(e) =>
                setComments({ ...comments, ux: e.target.value })
              }
            />

            <textarea
              placeholder={t.suggestions}
              value={comments.suggestions}
              onChange={(e) =>
                setComments({ ...comments, suggestions: e.target.value })
              }
            />
          </div>

          {/* ACTIONS */}
          <div className="feedback-actions">
            <button className="cancel-btn" onClick={handleCancel}>
              {t.cancel}
            </button>
            <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? t.submitting : t.submitFeedback}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

