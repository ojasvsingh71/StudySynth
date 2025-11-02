import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/detect", async (req, res) => {
  try {
    const { image } = req.body; // base64 from frontend

    // Send image to Python API
    const response = await axios.post(`${process.env.PYTHON_BACKEND}/api/detect`, {
      image,
    });

    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to detect emotion" });
  }
});

export default router;
