import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ;

export const startSession = async (userId) => {
    const res = await axios.post(`${BASE_URL}/session/start`, { userId });
    return res.data.sessionId;
};

export const sendEmotion = async (sessionId, emotion) => {
    await axios.post(`${BASE_URL}/session/${sessionId}/emotion`, { emotion, ts: Date.now() });
};

export const sendEvent = async (sessionId, type, detail) => {
    await axios.post(`${BASE_URL}/session/${sessionId}/event`, { type, detail });
};

export const endSession = async (sessionId) => {
    const res = await axios.post(`${BASE_URL}/session/${sessionId}/end`);
    return res.data.session;
};

export const getSessionSummary = async (sessionId) => {
    const res = await axios.get(`${BASE_URL}/session/${sessionId}/summary`);
    return res.data.session;
};

export const detectEmotion = async (imageBlob) => {
    const formData = new FormData();
    formData.append("image", imageBlob);
    const res = await axios.post(`${BASE_URL}/detect-emotion`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.emotion;
};
