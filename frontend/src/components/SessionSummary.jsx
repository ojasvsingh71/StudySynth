import React, { useEffect, useState } from "react";
import { getSessionSummary } from "../api";

const SessionSummary = ({ sessionId }) => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getSessionSummary(sessionId).then(setSummary);
  }, [sessionId]);

  if (!summary)
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div>
        <p className="ml-3 text-gray-500 text-sm">Loading session summary...</p>
      </div>
    );

  const totalTime = ((summary.endAt - summary.startAt) / 1000).toFixed(1);

  return (
    <div className="max-w-xl mx-auto mt-8 bg-gradient-to-br from-white to-indigo-50 shadow-lg rounded-2xl p-6 border border-gray-200">
      <h3 className="text-2xl font-semibold text-indigo-700 mb-4 flex items-center">
        📈 Session Summary
      </h3>

      {/* Duration */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-4 border border-gray-100">
        <p className="text-gray-700 text-sm font-medium">🕒 Duration</p>
        <p className="text-lg font-semibold text-gray-800">{totalTime} seconds</p>
      </div>

      {/* Emotion Stats */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-4 border border-gray-100">
        <p className="text-gray-700 text-sm font-medium mb-2">😊 Emotion Counts</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(summary.emotionCounts).map(([emotion, count]) => (
            <div
              key={emotion}
              className="flex justify-between bg-indigo-50 px-3 py-2 rounded-lg text-gray-700 font-medium"
            >
              <span className="capitalize">{emotion}</span>
              <span className="font-semibold text-indigo-700">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Total Events */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-4 border border-gray-100">
        <p className="text-gray-700 text-sm font-medium">🎯 Total Events</p>
        <p className="text-lg font-semibold text-gray-800">{summary.events.length}</p>
      </div>

      {/* Emotion Distribution Bar */}
      <div className="mt-5">
        <p className="text-gray-700 text-sm font-medium mb-2">📊 Emotion Distribution</p>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-indigo-600 h-3 rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(
                (Object.values(summary.emotionCounts).reduce((a, b) => a + b, 0) /
                  summary.events.length) *
                  100,
                100
              )}%`,
            }}
          ></div>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500 text-center">
        📚 Great job staying engaged throughout the session!
      </p>
    </div>
  );
};

export default SessionSummary;
