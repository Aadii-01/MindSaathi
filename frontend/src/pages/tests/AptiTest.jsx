import React from "react";
import { Link } from "react-router-dom";
import "./imageTest.css";

function AptiTest() {
  return (
    <div className="test-container" style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "24px",
          padding: "48px",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            background: "linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(124, 58, 237, 0.2))",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "28px",
            border: "1px solid rgba(37, 99, 235, 0.15)",
          }}
        >
          🧩
        </div>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", color: "#f8fafc", marginBottom: "12px" }}>
          Aptitude Test
        </h2>
        <p style={{ color: "#64748b", fontSize: "15px", lineHeight: 1.7, marginBottom: "28px" }}>
          This section is under development. Check back soon for cognitive aptitude assessments.
        </p>
        <Link to="/landing">
          <button className="next-btn">Back to Dashboard</button>
        </Link>
      </div>
    </div>
  );
}

export default AptiTest;

