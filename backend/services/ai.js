/**
 * backend/services/ai.js
 *
 * Replaces the OpenAI integration with a call to the local
 * Python Flask API wrapping the BERT Disaster Prediction Model.
 *
 * Flask server must be running at PREDICTION_API_URL (default: http://localhost:5001)
 */

const fetch = require("node-fetch"); // or use built-in fetch if Node 18+

const PREDICTION_API_URL =
  process.env.PREDICTION_API_URL || "http://localhost:5001";

const TIMEOUT_MS = 10_000; // 10 s

/**
 * Classify a disaster report text using the Python ML model.
 *
 * @param {string} text - The raw report text submitted by the user.
 * @returns {Promise<{disaster_type: string, risk_level: string, confidence: string, summary: string}>}
 */
async function analyzeText(text) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${PREDICTION_API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        `Prediction API returned ${response.status}: ${err.error || "unknown error"}`
      );
    }

    const result = await response.json();

    // Validate shape — fall back gracefully if model response is unexpected
    if (!result.disaster_type || !result.risk_level) {
      throw new Error("Prediction API returned an unexpected response shape.");
    }

    return result; // { disaster_type, risk_level, confidence, summary }
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("[ai.js] Prediction API timed out.");
    } else {
      console.error("[ai.js] Prediction API error:", err.message);
    }

    // ── Fallback rule-based classifier ──────────────────────────────────────
    return fallbackClassify(text);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Check whether the Python prediction API is reachable.
 * Used by GET /api/ai-status.
 *
 * @returns {Promise<{ok: boolean, detail: string}>}
 */
async function checkStatus() {
  try {
    const res = await fetch(`${PREDICTION_API_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    const body = await res.json();
    return {
      ok: res.ok && body.ok === true,
      detail: res.ok
        ? "✅ Disaster Prediction Model API connected successfully."
        : "⚠️ Prediction API responded but reported an error.",
    };
  } catch (e) {
    return {
      ok: false,
      detail: `❌ Cannot reach Prediction API at ${PREDICTION_API_URL}. Is the Flask server running?`,
    };
  }
}

// ── Fallback ─────────────────────────────────────────────────────────────────
const KEYWORDS = {
  Wildfire:   ["fire", "wildfire", "blaze", "burn", "smoke", "flame"],
  Floods:     ["flood", "flooding", "inundation", "overflow", "surge", "rain"],
  Earthquake: ["earthquake", "tremor", "seismic", "quake", "magnitude"],
  Hurricanes: ["hurricane", "cyclone", "typhoon", "tropical", "storm"],
  Tornadoes:  ["tornado", "twister", "funnel", "wind"],
  Drought:    ["drought", "dry", "arid", "water shortage", "desertification"],
};

function fallbackClassify(text) {
  const lower = text.toLowerCase();
  let best = { type: "Unknown", count: 0 };

  for (const [type, words] of Object.entries(KEYWORDS)) {
    const count = words.filter((w) => lower.includes(w)).length;
    if (count > best.count) best = { type, count };
  }

  const disaster_type = best.count > 0 ? best.type : "Unknown";
  const risk_level = best.count >= 2 ? "High" : best.count === 1 ? "Medium" : "Low";

  return {
    disaster_type,
    risk_level,
    confidence: "N/A (fallback)",
    summary: `[Fallback] Detected possible ${disaster_type} event. ML model unavailable — rule-based classification used.`,
  };
}

module.exports = { analyzeText, checkStatus };
