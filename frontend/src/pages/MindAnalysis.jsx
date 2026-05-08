import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/mindAnalysis.css';

const questions = [
  "Hello! I'm here to help you analyze your mind states and emotions. How are you feeling today?",
  "Can you describe any emotions you've been experiencing lately? For example, happiness, sadness, anxiety, etc.",
  "What situations or thoughts tend to trigger strong emotions for you?",
  "How do you typically cope with negative emotions?",
  "Are there any areas in your life where you feel you need improvement, such as stress management, relationships, or self-confidence?",
  "What are your goals for emotional well-being in the next few months?",
  "Is there anything specific you'd like to discuss about your mental health or emotional state?"
];

function MindAnalysis() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('mindAnalysisMessages');
    return saved ? JSON.parse(saved) : [
      { text: "Welcome to Mind State Analysis. This tool provides general insights based on your responses. It is not a substitute for professional mental health advice. Please consult a qualified professional for personalized guidance.\n\n" + questions[0], sender: 'bot' }
    ];
  });
  const [currentQuestion, setCurrentQuestion] = useState(() => {
    const saved = localStorage.getItem('mindAnalysisQuestion');
    return saved ? parseInt(saved) : 0;
  });
  const [userInput, setUserInput] = useState('');
  const [isComplete, setIsComplete] = useState(() => {
    const saved = localStorage.getItem('mindAnalysisComplete');
    return saved ? JSON.parse(saved) : false;
  });
  const [responses, setResponses] = useState(() => {
    const saved = localStorage.getItem('mindAnalysisResponses');
    return saved ? JSON.parse(saved) : [];
  });
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    localStorage.setItem('mindAnalysisMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('mindAnalysisQuestion', currentQuestion.toString());
  }, [currentQuestion]);

  useEffect(() => {
    localStorage.setItem('mindAnalysisComplete', JSON.stringify(isComplete));
  }, [isComplete]);

  useEffect(() => {
    localStorage.setItem('mindAnalysisResponses', JSON.stringify(responses));
  }, [responses]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearConversation = () => {
    setMessages([{ text: "Welcome to Mind State Analysis. This tool provides general insights based on your responses. It is not a substitute for professional mental health advice. Please consult a qualified professional for personalized guidance.\n\n" + questions[0], sender: 'bot' }]);
    setCurrentQuestion(0);
    setIsComplete(false);
    setResponses([]);
    localStorage.removeItem('mindAnalysisMessages');
    localStorage.removeItem('mindAnalysisQuestion');
    localStorage.removeItem('mindAnalysisComplete');
    localStorage.removeItem('mindAnalysisResponses');
  };

  const handleSend = () => {
    if (!userInput.trim()) return;

    const newMessages = [...messages, { text: userInput, sender: 'user' }];
    setMessages(newMessages);
    setResponses([...responses, userInput]);

    if (userInput.toLowerCase().includes('give the report') || userInput.toLowerCase().includes('report')) {
      generateReport();
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setMessages([...newMessages, { text: questions[currentQuestion + 1], sender: 'bot' }]);
        setCurrentQuestion(currentQuestion + 1);
      }, 1000);
    } else {
      setIsComplete(true);
      setTimeout(() => {
        setMessages([...newMessages, {
          text: "Thank you for sharing! I've gathered enough information. If you'd like your personalized report, just type 'give the report'.",
          sender: 'bot'
        }]);
      }, 1000);
    }

    setUserInput('');
  };

  const generateReport = () => {
    const analysis = analyzeResponses(responses);
    const report = `
Mind State and Emotional Analysis Report
=======================================

Date: ${new Date().toLocaleDateString()}

Your Responses:
${responses.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Analysis:
${analysis}

Recommendations:
${getRecommendations(analysis)}

Disclaimer: This is a general analysis based on your responses. For professional mental health advice, please consult a qualified therapist or counselor.
    `;

    // Create and download the file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mind_analysis_report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setMessages([...messages, { text: 'Your report has been downloaded!', sender: 'bot' }]);
  };

  const analyzeResponses = (responses) => {
    const text = responses.join(' ').toLowerCase();
    let analysis = '';

    if (text.includes('stress') || text.includes('anxious') || text.includes('worried')) {
      analysis += 'You seem to be experiencing stress or anxiety. ';
    }
    if (text.includes('sad') || text.includes('depressed') || text.includes('unhappy')) {
      analysis += 'There are indications of sadness or low mood. ';
    }
    if (text.includes('happy') || text.includes('joy') || text.includes('positive')) {
      analysis += 'You have positive emotions and experiences. ';
    }
    if (text.includes('anger') || text.includes('frustrated') || text.includes('angry')) {
      analysis += 'Anger or frustration appears in your responses. ';
    }
    if (text.includes('work') || text.includes('job')) {
      analysis += 'Work-related issues may be affecting your emotional state. ';
    }
    if (text.includes('relationship') || text.includes('family') || text.includes('friends')) {
      analysis += 'Relationships seem to play a role in your emotional experiences. ';
    }

    if (!analysis) {
      analysis = 'Your responses indicate a generally balanced emotional state, but there may be areas for growth.';
    }

    return analysis;
  };

  const getRecommendations = (analysis) => {
    let recs = '';

    if (analysis.includes('stress') || analysis.includes('anxiety')) {
      recs += '- Practice mindfulness or meditation daily\n- Consider regular exercise\n- Maintain a consistent sleep schedule\n';
    }
    if (analysis.includes('sad') || analysis.includes('depressed')) {
      recs += '- Engage in activities you enjoy\n- Stay connected with supportive friends/family\n- Consider professional counseling if feelings persist\n';
    }
    if (analysis.includes('anger') || analysis.includes('frustrated')) {
      recs += '- Practice deep breathing when feeling angry\n- Journal your thoughts and feelings\n- Consider anger management techniques\n';
    }
    if (analysis.includes('work') || analysis.includes('job')) {
      recs += '- Set boundaries between work and personal life\n- Take regular breaks during work hours\n- Discuss concerns with supervisor if appropriate\n';
    }
    if (analysis.includes('relationship')) {
      recs += '- Communicate openly with loved ones\n- Consider couples/family counseling if needed\n- Focus on building positive connections\n';
    }

    recs += '- Maintain a healthy lifestyle with balanced diet and exercise\n- Practice gratitude daily\n- Seek professional help if emotional issues persist or worsen\n';

    return recs;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="mind-analysis">
      <Navbar />
      <div className="chat-container">
        <div className="chat-header">
          <h2>Mind State Analysis</h2>
          <p>Let's discuss your emotions and well-being</p>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-content">{msg.text}</div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {!isComplete && (
          <div className="chat-input">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
              disabled={isComplete}
            />
            <button onClick={handleSend} disabled={!userInput.trim() || isComplete}>
              Send
            </button>
          </div>
        )}

        <div className="chat-footer">
          <button onClick={clearConversation} className="clear-btn">
            Start New Conversation
          </button>
          <button onClick={() => navigate('/landing')} className="back-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default MindAnalysis;