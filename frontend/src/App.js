// import React, { useEffect, useState } from "react";
// import axios from "axios";

// function App() {
//   const [tasks, setTasks] = useState([]);

//   useEffect(() => {
//     axios
//       .get("http://127.0.0.1:8000/api/tasks/")
//       .then((response) => {
//         setTasks(response.data);
//       })
//       .catch((error) => {
//         console.error("Error fetching data:", error);
//       });
//   }, []);

//   return (
//     <div style={{ padding: "20px" }}>
//       <h1>Django + React Task List</h1>

//       {tasks.length === 0 ? (
//         <p>No tasks available</p>
//       ) : (
//         tasks.map((task) => (
//           <div
//             key={task.id}
//             style={{
//               border: "1px solid black",
//               margin: "10px",
//               padding: "10px",
//               borderRadius: "8px",
//             }}
//           >
//             <h3>{task.title}</h3>
//             <p>
//               Status: {task.completed ? "Completed" : "Pending"}
//             </p>
//           </div>
//         ))
//       )}
//     </div>
//   );
// }

// export default App;

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Landing from "./pages/Landing";
import MainCome from "./pages/MainCome";
import Feedback from "./pages/Feedback";
import Profile from "./pages/ProfilePage";
import TestScores from "./pages/TestScores";
import ImageTest from "./pages/tests/ImageTest";
import Result from "./pages/tests/Result";
import NumberMemoryTest from "./pages/tests/NumberMemoryTest";
import FindTargetTest from "./pages/tests/FindTargetTest";
import CDRTest from "./pages/tests/CDRTest";
import PatternCompletionTest from "./pages/tests/PatternCompletionTest";
import StroopTest from "./pages/tests/StroopTest";
import MindAnalysis from "./pages/MindAnalysis";

function App() {
  return (
    <Router>
      <div className="animated-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>
      <Routes>
        <Route path="/" element={<MainCome />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/ImageTest" element={<ImageTest />}/>
        <Route path="/NumberMemoryTest" element={<NumberMemoryTest />} />
        <Route path="/FindTargetTest" element={<FindTargetTest />} />
        <Route path="/CDRTest" element={<CDRTest />} />
        <Route path="/StroopTest" element={<StroopTest />} />
        <Route path="/PatternCompletionTest" element={<PatternCompletionTest />} />
        <Route path="/MindAnalysis" element={<MindAnalysis />} />

        <Route path="/result" element={<Result />} />
        <Route path="/test-scores" element={<TestScores />} />

      </Routes>
    </Router>
  );
}

export default App;