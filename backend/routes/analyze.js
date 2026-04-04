/**
 * backend/routes/analyze.js
 *
 * POST /api/analyze  — classify a disaster report via ML model
 * GET  /api/ai-status — check if the Python API is reachable
 */

const express = require("express");
const router = express.Router();
const { analyzeText, checkStatus } = require("../services/ai");

// In-memory report store (replace with DB for persistence)
const reports = [];

// POST /api/analyze
router.post("/analyze", async (req, res) => {
  const { text, location, imageName } = req.body;

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Field 'text' is required." });
  }

  try {
    const analysis = await analyzeText(text.trim());

    const report = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      text: text.trim(),
      location: location || null,
      imageName: imageName || null,
      ...analysis,
    };

    reports.push(report);

    return res.json(report);
  } catch (err) {
    console.error("[analyze route] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error during analysis." });
  }
});

// GET /api/reports
router.get("/reports", (_req, res) => {
  // Return newest first
  res.json([...reports].reverse());
});

// GET /api/ai-status
router.get("/ai-status", async (_req, res) => {
  const status = await checkStatus();
  res.json(status);
});

module.exports = router;
