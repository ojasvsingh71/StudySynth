import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const videos = {
  happy: "https://www.youtube.com/embed/j0L4kOLEJa0?autoplay=1",
  sad: "https://www.youtube.com/embed/1pYcSC8Uz6g?autoplay=1",
  neutral: "https://www.youtube.com/embed/jZaT703cyRA?autoplay=1",
  angry: "https://www.youtube.com/embed/2i5fPZ3Uk-8?autoplay=1",
};

const emotionColors = {
  happy: "from-green-100 to-green-50 border-green-200",
  sad: "from-blue-100 to-blue-50 border-blue-200",
  angry: "from-red-100 to-red-50 border-red-200",
  neutral: "from-gray-100 to-gray-50 border-gray-200",
};

const VideoPlayer = ({ currentEmotion }) => {
  const [videoSrc, setVideoSrc] = useState(videos.neutral);

  useEffect(() => {
    if (videos[currentEmotion]) setVideoSrc(videos[currentEmotion]);
  }, [currentEmotion]);

  return (
    <motion.div
      key={currentEmotion}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`w-full bg-gradient-to-br ${emotionColors[currentEmotion] || emotionColors.neutral
        } rounded-2xl border shadow-lg p-4 flex flex-col items-center transition-all duration-500`}
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        🎬 Lecture (Adaptive to Emotion)
      </h3>

      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md">
        <iframe
          src={videoSrc}
          title="Adaptive Lecture"
          className="w-full h-full rounded-xl"
          allow="autoplay; encrypted-media"
          allowFullScreen
        ></iframe>
      </div>

      <p className="mt-3 text-sm text-gray-600">
        Current mood:{" "}
        <span className="font-medium capitalize text-gray-800">
          {currentEmotion}
        </span>
      </p>
    </motion.div>
  );
};

export default VideoPlayer;