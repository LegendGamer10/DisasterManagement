const express = require('express');
const { getLiveEvents, filterNearby } = require('../services/liveData');

const router = express.Router();

/**
 * GET /api/live-events
 * Optional query params: lat, lon, radius (degrees, default 8)
 * Returns live disaster events from NASA EONET + USGS, optionally filtered by location.
 */
router.get('/live-events', async (req, res) => {
  try {
    const events = await getLiveEvents();

    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const radius = parseFloat(req.query.radius) || 8;

    if (!isNaN(lat) && !isNaN(lon)) {
      return res.json(filterNearby(events, lat, lon, radius));
    }

    res.json(events);
  } catch (err) {
    console.error('[/api/live-events]', err.message);
    res.status(502).json({ error: 'Failed to fetch live event data.', detail: err.message });
  }
});

/**
 * GET /api/live-events/stats
 * Returns summary statistics for the current live event cache.
 */
router.get('/live-events/stats', async (req, res) => {
  try {
    const events = await getLiveEvents();

    const byType = {};
    const bySeverity = { watch: 0, warning: 0, critical: 0 };

    for (const e of events) {
      byType[e.type] = (byType[e.type] || 0) + 1;
      if (bySeverity[e.severity] !== undefined) bySeverity[e.severity]++;
    }

    res.json({
      total: events.length,
      by_type: byType,
      by_severity: bySeverity,
      sources: ['NASA EONET', 'USGS']
    });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;
