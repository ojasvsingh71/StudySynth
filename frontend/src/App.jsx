import React, { useState } from "react";
import { startSession, endSession } from "./api.js";
import EmotionTracker from "./components/EmotionTracker.jsx";
import VideoPlayer from "./components/VideoPlayer.jsx";
import Quiz from "./components/Quiz.jsx";
import SessionSummary from "./components/SessionSummary.jsx";


function App() {
  const [sessionId, setSessionId] = useState(null);
  const [ended, setEnded] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState("neutral");

  const start = async () => {
    const id = await startSession("student-1");
    setSessionId(id);
  };

  const stop = async () => {
    await endSession(sessionId);
    setEnded(true);
  };

  if (!sessionId)
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 text-center p-6">
        <h1 className="text-5xl font-extrabold text-indigo-700 mb-4 drop-shadow-md">
          StudySynth
        </h1>
        <p className="text-gray-600 text-sm mb-10 max-w-md">
          An emotion-aware adaptive learning platform that tailors video lectures and quizzes based on your mood 🎓
        </p>

        <button
          onClick={start}
          className="relative inline-flex items-center justify-center px-8 py-4 overflow-hidden text-lg font-semibold text-white transition-all duration-300 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-2xl hover:scale-105 group"
        >
          <span className="absolute inset-0 w-full h-full transition-all duration-500 ease-out transform translate-x-full bg-white opacity-10 group-hover:translate-x-0"></span>
          🚀 Start Learning Session
        </button>

        <p className="text-xs text-gray-400 mt-8">
          © {new Date().getFullYear()} StudySynth – Smart Learning, Smarter You 💡
        </p>
      </div>
    );

  if (ended) return <SessionSummary sessionId={sessionId} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center p-6 font-sans transition-all duration-500">

      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-indigo-700 mb-2 drop-shadow-sm">
          StudySynth – Adaptive Learning Platform
        </h1>
        <p className="text-gray-600 text-sm">
          Emotion-aware video lectures and adaptive quizzes 🎓
        </p>
      </header>

      {/* Emotion Tracker Section */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Live Emotion Tracking</h2>
        <EmotionTracker sessionId={sessionId} onEmotionDetected={setCurrentEmotion} />
        <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
          <span className="font-medium">Current Emotion:</span>
          <span
            className={`px-3 py-1 rounded-full text-white text-xs ${currentEmotion === "happy"
              ? "bg-green-500"
              : currentEmotion === "sad"
                ? "bg-blue-400"
                : currentEmotion === "angry"
                  ? "bg-red-500"
                  : "bg-gray-400"
              }`}
          >
            {currentEmotion || "Detecting..."}
          </span>
        </div>
      </div>

      {/* Video Player Section */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Lecture Module</h2>
        <VideoPlayer currentEmotion={currentEmotion} />
      </div>

      {/* Quiz Section */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Adaptive Quiz</h2>
        <Quiz sessionId={sessionId} currentEmotion={currentEmotion} />
      </div>

      {/* End Session Button */}
      <button
        onClick={stop}
        className="mt-4 mb-8 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl shadow-md transition-all duration-300"
      >
        End Session
      </button>

      {/* Footer */}
      <footer className="text-xs text-gray-400 mt-auto pb-4">
        © {new Date().getFullYear()} StudySynth. Adaptive Learning powered by AI.
      </footer>
    </div>
  );
}

export default App;