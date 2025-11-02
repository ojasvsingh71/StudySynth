import { useRef, useState, useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export default function useEmotionSession({ webcamRef, sampleInterval = 5000 }) {
  const sessionIdRef = useRef(uuidv4());
  const [stableEmotion, setStableEmotion] = useState("neutral");
  const recent = useRef([]);
  const [stats, setStats] = useState({
    totalSec: 0,
    engagedSec: 0,
    focusSec: 0,
    emotionCounts: {}
  });
  const lastTsRef = useRef(Date.now());

  useEffect(() => {
    // start session on server
    (async () => {
      try {
        const res = await axios.post("http://localhost:5000/session/start", {});
        sessionIdRef.current = res.data.sessionId;
      } catch (e) {
        console.warn("Failed to start session", e.message);
      }
    })();
  }, []);

  useEffect(() => {
    let running = true;
    const focusSet = new Set(["neutral","happy","surprise"]);
    const interval = setInterval(async () => {
      if (!running) return;
      if (!webcamRef.current) return;
      const img = webcamRef.current.getScreenshot();
      if (!img) return;
      try {
        // create blob and send to Node
        const blob = await (await fetch(img)).blob();
        const form = new FormData();
        form.append("image", blob, "frame.jpg");

        const resp = await axios.post("http://localhost:5000/detect-emotion", form, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 20000
        });

        const detected = resp.data.emotion || "no_face_detected";
        const ts = Date.now();

        // smoothing: keep last 5
        recent.current.push({ emotion: detected, ts });
        if (recent.current.length > 5) recent.current.shift();
        const freq = {};
        for (const r of recent.current) freq[r.emotion] = (freq[r.emotion] || 0) + 1;
        let mode = Object.keys(freq).reduce((a,b)=> freq[a] > freq[b] ? a : b);
        const conf = freq[mode] / recent.current.length;
        // if stable for 10s adopt
        if (conf >= 0.6) {
          setStableEmotion(mode);
        }

        // stats update
        const deltaSec = (ts - lastTsRef.current) / 1000;
        lastTsRef.current = ts;
        setStats(prev => {
          const next = {...prev};
          next.totalSec += deltaSec;
          if (detected !== "no_face_detected") next.engagedSec += deltaSec;
          if (focusSet.has(detected)) next.focusSec += deltaSec;
          next.emotionCounts = {...(next.emotionCounts||{})};
          next.emotionCounts[detected] = (next.emotionCounts[detected]||0) + 1;
          return next;
        });

        // send emotion event to node backend (batch or single)
        axios.post(`http://localhost:5000/session/${sessionIdRef.current}/emotion`, {
          emotion: detected,
          ts
        }).catch(()=>{ /* ignore network hiccups for now */ });

      } catch (err) {
        console.error("capture error", err.message || err);
      }
    }, sampleInterval);

    return () => {
      running = false;
      clearInterval(interval);
      // end session
      axios.post(`http://localhost:5000/session/${sessionIdRef.current}/end`).catch(()=>{});
    };
  }, [webcamRef, sampleInterval]);

  return { sessionId: sessionIdRef.current, stableEmotion, stats };
}
