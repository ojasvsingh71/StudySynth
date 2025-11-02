import express from "express";
import multer from "multer";
import axios from "axios";
import fs from "fs";
import cors from "cors";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { createSession, appendEvent, updateSession, getSession } from "./sessionStore.js";
import dotenv from "dotenv"

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });
app.use(cors({
  origin: ["https://study-synth-y1po.vercel.app","http://localhost:5173"],
  credentials: true,
}));
app.use(express.json());

// Config
const FLASK_URL = process.env.PYHTON_BACKEND || "http://localhost:8000/api/detect";
const PORT = process.env.PORT || 5000;

// --- Forward image to python as base64 JSON ---
app.post("/detect-emotion", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const imageBase64 = fs.readFileSync(filePath, { encoding: "base64" });

    const response = await axios.post(FLASK_URL, { image: imageBase64 }, { timeout: 20000 });
    fs.unlinkSync(filePath);
    return res.json({ success: true, emotion: response.data.emotion });
  } catch (err) {
    console.error("Error detecting emotion:", err);
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

// --- Session endpoints ---
// Start session
app.post("/session/start", (req, res) => {
  const id = uuidv4();
  const { userId } = req.body || {};
  const session = {
    id,
    userId: userId || "anon",
    startAt: Date.now(),
    endAt: null,
    emotionCounts: {},
    events: []
  };
  createSession(session);
  res.json({ success: true, sessionId: id });
});

// Append emotion event (single or batch)
app.post("/session/:id/emotion", (req, res) => {
  const { id } = req.params;
  const body = req.body;
  // allow single or array
  const items = Array.isArray(body) ? body : [body];
  items.forEach(it => {
    const ev = {
      type: "emotion",
      emotion: it.emotion,
      ts: it.ts || Date.now()
    };
    appendEvent(id, ev);
    // update counts
    const s = getSession(id);
    s.emotionCounts = s.emotionCounts || {};
    s.emotionCounts[it.emotion] = (s.emotionCounts[it.emotion] || 0) + 1;
    updateSession(id, s);
  });
  res.json({ success: true });
});

// Append generic event
app.post("/session/:id/event", (req, res) => {
  const { id } = req.params;
  const { type, detail } = req.body;
  const ev = { type: type || "event", detail, ts: Date.now() };
  appendEvent(id, ev);
  res.json({ success: true });
});

app.post("/session/:id/end", (req, res) => {
  const { id } = req.params;
  const s = getSession(id);
  if (!s) return res.status(404).json({ error: "session not found" });
  s.endAt = Date.now();
  updateSession(id, s);
  res.json({ success: true, session: s });
});

app.get("/session/:id/summary", (req, res) => {
  const s = getSession(req.params.id);
  if (!s) return res.status(404).json({ error: "session not found" });
  res.json({ success: true, session: s });
});

// Start server
app.listen(PORT, () => console.log(`Node.js backend running on port ${PORT}`));
