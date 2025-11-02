import React, { useEffect, useRef, useState } from "react";
import { detectEmotion, sendEmotion } from "../api";

const emotionColors = {
  happy: "from-yellow-400 to-yellow-600",
  sad: "from-blue-400 to-blue-600",
  angry: "from-red-500 to-red-700",
  surprised: "from-purple-400 to-purple-600",
  neutral: "from-gray-400 to-gray-600",
  fear: "from-green-400 to-green-600",
  disgust: "from-lime-400 to-lime-600",
  no_face_detected: "from-gray-300 to-gray-500",
};

const EmotionTracker = ({ sessionId, onEmotionDetected }) => {
  const videoRef = useRef();
  const [currentEmotion, setCurrentEmotion] = useState("neutral");

  useEffect(() => {
    startCamera();
    const interval = setInterval(captureAndDetect, 5000);
    return () => clearInterval(interval);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const captureAndDetect = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg")
    );

    try {
      const emotion = await detectEmotion(blob);
      setCurrentEmotion(emotion);
      onEmotionDetected(emotion);
      sendEmotion(sessionId, emotion);
    } catch (error) {
      console.error("Emotion detection failed:", error);
    }
  };

  const emotionGradient = emotionColors[currentEmotion] || emotionColors.neutral;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl shadow-xl backdrop-blur-lg border border-white/10 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-gray-200 mb-4">
        Emotion Tracker 🎥
      </h2>

      <div
        className={`relative p-1 rounded-xl bg-gradient-to-br ${emotionGradient} shadow-lg transition-all duration-500`}
      >
        <video
          ref={videoRef}
          autoPlay
          width="320"
          height="240"
          className="rounded-lg shadow-md border-2 border-white/20"
        />
      </div>

      <p
        className={`mt-4 text-lg font-medium px-4 py-2 rounded-lg text-white bg-gradient-to-r ${emotionGradient} shadow-md transition-all duration-500`}
      >
        🧠 Current Emotion: <b className="capitalize">{currentEmotion}</b>
      </p>
    </div>
  );
};

export default EmotionTracker;
