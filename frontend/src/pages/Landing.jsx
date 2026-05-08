import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Card from "../components/Card";
import "../styles/landing.css";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../i18n/translations";

const assessments = [
  {
    title: "Number Memory Test",
    desc: "Remember a sequence of numbers, increasing difficulty as you get correct answers"
  },

  {
    title: "Find the Target",
    desc: "Locate the target character in increasing grid sizes under time limits"
  },
  {
    title: "Pattern Completion Test",
    desc: "Tests logical reasoning and pattern recognition."
  },
  {
    title: "Typing Test",
    desc: "Test typing speed, accuracy, and processing efficiency under timed conditions."
  },
  {
    title: "Stroop Test",
    desc: "Test cognitive control and selective attention by identifying the color of a word while ignoring the written text."
  },
  {
    title: "Mind State Analysis",
    desc: "Discuss your emotions and mind states to get personalized improvement suggestions."
  }
];

function Dashboard() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="dashboard">
      <Navbar />
      <Hero />

      <div className="assessment-section">
        <h2>{t.availableAssessments}</h2>
        <p>{t.chooseAssessment}</p>

        <div className="card-grid">
          {assessments.map((item, index) => {
            let to;
            if (item.title === "Number Memory Test") to = "/NumberMemoryTest";
            else if (item.title === "Find the Target") to = "/FindTargetTest";
            else if (item.title === "Pattern Completion Test") to = "/PatternCompletionTest";
            else if (item.title === "Typing Test") to = "/CDRTest";
            else if (item.title === "Stroop Test") to = "/StroopTest";
            else if (item.title === "Mind State Analysis") to = "/MindAnalysis";
            else to = undefined;


            return (

              <Card
                key={index}
                title={item.title}
                desc={item.desc}
                to={to}
              />
            );
          })}
        </div>

      </div>

      <footer className="footer">
        © 2026 <span>SaiSam.</span>. All rights reserved.
      </footer>
    </div>
  );
}

export default Dashboard;

