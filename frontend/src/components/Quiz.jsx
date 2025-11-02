import React, { useState } from "react";
import { sendEvent } from "../api";

// Emotion-based question pools
const questionSets = {
  happy: [
    {
      q: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correct: "4",
    },
    {
      q: "Which city is the capital of India?",
      options: ["Mumbai", "Delhi", "Kolkata", "Chennai"],
      correct: "Delhi",
    },
    {
      q: "Which planet is known as the Red Planet?",
      options: ["Earth", "Mars", "Jupiter", "Venus"],
      correct: "Mars",
    },
    {
      q: "What festival is known as the Festival of Lights?",
      options: ["Diwali", "Holi", "Eid", "Christmas"],
      correct: "Diwali",
    },
    {
      q: "What is the largest mammal on Earth?",
      options: ["Elephant", "Blue Whale", "Giraffe", "Shark"],
      correct: "Blue Whale",
    },
    {
      q: "Which is the smallest prime number?",
      options: ["1", "2", "3", "5"],
      correct: "2",
    },
    {
      q: "Which sport does Lionel Messi play?",
      options: ["Cricket", "Football", "Tennis", "Basketball"],
      correct: "Football",
    },
    {
      q: "Which color represents happiness?",
      options: ["Blue", "Yellow", "Black", "Gray"],
      correct: "Yellow",
    },
  ],

  sad: [
    {
      q: "What color is the sky on a clear day?",
      options: ["Red", "Green", "Blue", "Yellow"],
      correct: "Blue",
    },
    {
      q: "How many days are there in a week?",
      options: ["5", "6", "7", "8"],
      correct: "7",
    },
    {
      q: "Which of these is used to write on paper?",
      options: ["Pen", "Fork", "Brush", "Spoon"],
      correct: "Pen",
    },
    {
      q: "Which animal is known as man's best friend?",
      options: ["Cat", "Dog", "Cow", "Horse"],
      correct: "Dog",
    },
    {
      q: "What do plants need to make food?",
      options: ["Light", "Sound", "Heat", "Cold"],
      correct: "Light",
    },
    {
      q: "Which month comes after January?",
      options: ["February", "March", "April", "December"],
      correct: "February",
    },
    {
      q: "How many continents are there on Earth?",
      options: ["5", "6", "7", "8"],
      correct: "7",
    },
    {
      q: "Which shape has 3 sides?",
      options: ["Square", "Triangle", "Circle", "Rectangle"],
      correct: "Triangle",
    },
  ],

  angry: [
    {
      q: "Solve: 10 - 3 = ?",
      options: ["6", "8", "7", "9"],
      correct: "7",
    },
    {
      q: "What is the opposite of hot?",
      options: ["Cold", "Warm", "Cool", "Heat"],
      correct: "Cold",
    },
    {
      q: "What is 9 × 3?",
      options: ["27", "24", "18", "30"],
      correct: "27",
    },
    {
      q: "Which gas do humans exhale?",
      options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
      correct: "Carbon Dioxide",
    },
    {
      q: "Which device is used to measure temperature?",
      options: ["Barometer", "Thermometer", "Hygrometer", "Speedometer"],
      correct: "Thermometer",
    },
    {
      q: "How many states are there in India?",
      options: ["27", "28", "29", "30"],
      correct: "28",
    },
    {
      q: "What is the boiling point of water (°C)?",
      options: ["50", "100", "80", "120"],
      correct: "100",
    },
    {
      q: "Which metal is liquid at room temperature?",
      options: ["Mercury", "Iron", "Silver", "Gold"],
      correct: "Mercury",
    },
  ],

  neutral: [
    {
      q: "Who wrote the Ramayana?",
      options: ["Valmiki", "Tulsidas", "Ved Vyasa", "Kalidas"],
      correct: "Valmiki",
    },
    {
      q: "What is H₂O commonly known as?",
      options: ["Oxygen", "Hydrogen", "Water", "Salt"],
      correct: "Water",
    },
    {
      q: "Who was the first Prime Minister of India?",
      options: ["Jawaharlal Nehru", "Mahatma Gandhi", "Rajendra Prasad", "Sardar Patel"],
      correct: "Jawaharlal Nehru",
    },
    {
      q: "Which planet is closest to the Sun?",
      options: ["Venus", "Mercury", "Earth", "Mars"],
      correct: "Mercury",
    },
    {
      q: "What is the national animal of India?",
      options: ["Tiger", "Lion", "Elephant", "Peacock"],
      correct: "Tiger",
    },
    {
      q: "Which of these is a programming language?",
      options: ["Python", "Snake", "Cobra", "Viper"],
      correct: "Python",
    },
    {
      q: "Which part of the plant conducts photosynthesis?",
      options: ["Leaf", "Root", "Stem", "Flower"],
      correct: "Leaf",
    },
    {
      q: "What is the value of π (Pi) approximately?",
      options: ["2.14", "3.14", "4.14", "5.14"],
      correct: "3.14",
    },
  ],
};


const Quiz = ({ sessionId, currentEmotion }) => {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState("");
  
  const questions = questionSets[currentEmotion] || questionSets.neutral;
  const question = questions[index];

  const handleSelect = (option) => {
    if (answered) return;
    setSelected(option);
  };

  const handleSubmit = async () => {
    if (!selected) return;

    const correct = selected === question.correct;
    if (correct) {
      setScore(score + 1);
      setFeedback("✅ Correct!");
    } else {
      setFeedback(`❌ Incorrect! Correct answer: ${question.correct}`);
    }

    setAnswered(true);
    await sendEvent(sessionId, "quiz_attempt", { q: question.q, correct });

    setTimeout(() => {
      setFeedback("");
      setAnswered(false);
      setSelected(null);
      if (index + 1 < questions.length) {
        setIndex(index + 1);
      }
    }, 1500);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 shadow-md border border-gray-100">
      <h3 className="text-xl font-semibold text-gray-800 mb-3">
        🧩 Mood-Adaptive Quiz
      </h3>

      <p className="text-lg text-gray-700 mb-4">{question.q}</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(opt)}
            className={`py-2 px-4 rounded-xl border transition-all duration-300
              ${
                selected === opt
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white hover:bg-indigo-50 border-gray-300 text-gray-700"
              }`}
            disabled={answered}
          >
            {opt}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selected || answered}
        className="bg-indigo-600 text-white py-2 px-5 rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md disabled:opacity-60"
      >
        Submit
      </button>

      {feedback && (
        <p
          className={`mt-4 font-medium ${
            feedback.includes("Correct") ? "text-green-600" : "text-red-500"
          }`}
        >
          {feedback}
        </p>
      )}

      <div className="mt-5 flex justify-between text-gray-600 text-sm">
        <p>Question {index + 1} / {questions.length}</p>
        <p>Score: {score}</p>
      </div>
    </div>
  );
};

export default Quiz;