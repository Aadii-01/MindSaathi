import React from "react";
import { Link } from "react-router-dom";
import "../styles/landing.css";

function ImageDesc() {
  return (
    <div className="auth-container">
      <div className="auth-box" style={{ textAlign: "center", maxWidth: "600px" }}>
        <div className="logo">🖼️</div>
        <h2>Image Description Test</h2>
        <p className="subtitle">
          Describe the image shown to you in as much detail as possible within the time limit.
        </p>

        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "16px",
            padding: "24px",
            marginTop: "20px",
            textAlign: "left",
          }}
        >
          <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.7 }}>
            <strong style={{ color: "#e2e8f0" }}>Instructions:</strong>
            <br />• You will be shown an image for 60 seconds
            <br />• Describe what you see in as much detail as possible
            <br />• Focus on objects, colors, actions, and relationships
            <br />• Speak clearly and continuously until time runs out
          </p>
        </div>

        <Link to="/ImageTest">
          <button className="primary-btn" style={{ marginTop: "24px" }}>
            Start Test
          </button>
        </Link>
      </div>
    </div>
  );
}

export default ImageDesc;

