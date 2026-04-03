const express = require('express');
const { analyzeDisasterText } = require('../services/ai');

const router = express.Router();

// In-memory report store for prototype mode.
const reports = [];

router.post('/analyze', async (req, res) => {
  const { text, location, latitude, longitude, image_name } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Field "text" is required.' });
  }

  try {
    const analysis = await analyzeDisasterText(text);

    const record = {
      text,
      disaster_type: analysis.disaster_type,
      risk_level: analysis.risk_level,
      confidence: analysis.confidence,
      summary: analysis.summary,
      location: location || null,
      latitude: typeof latitude === 'number' ? latitude : null,
      longitude: typeof longitude === 'number' ? longitude : null,
      image_name: image_name || null,
      timestamp: new Date().toISOString()
    };

    reports.unshift(record);
    return res.json(analysis);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to analyze report right now.' });
  }
});

router.get('/reports', (req, res) => {
  res.json(reports);
});

module.exports = router;
