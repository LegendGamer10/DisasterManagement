const express = require('express');
const { addClient, removeClient, getAlertHistory } = require('../services/monitor');

const router = express.Router();

/**
 * GET /api/alerts/stream
 * Server-Sent Events (SSE) endpoint — browser can subscribe for live alerts.
 *
 * Events emitted:
 *   event: alert  → new critical/warning disaster detected
 *   event: stats  → periodic heartbeat with global stats
 *   event: error  → live data fetch failure
 */
router.get('/alerts/stream', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send a welcome event immediately
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Disaster Watch monitor connected', ts: new Date().toISOString() })}\n\n`);

  // Keep-alive ping every 25 s (prevents proxy/browser timeout)
  const ping = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { clearInterval(ping); }
  }, 25_000);

  addClient(res);

  req.on('close', () => {
    clearInterval(ping);
    removeClient(res);
  });
});

/**
 * GET /api/alerts
 * Returns in-memory alert history (last 100 alerts).
 */
router.get('/alerts', (req, res) => {
  res.json(getAlertHistory());
});

module.exports = router;
