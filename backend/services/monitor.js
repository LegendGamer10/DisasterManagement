/**
 * Background disaster monitoring service.
 *
 * Polls NASA EONET + USGS every 5 minutes.
 * Detects NEW critical/warning events since last check.
 * Broadcasts alerts to all connected SSE clients.
 */

const { getLiveEvents } = require('./liveData');

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const SEVERITY_RANK    = { watch: 1, warning: 2, critical: 3 };

// ── SSE client registry ───────────────────────────────────────────────────

const clients = new Set();

function addClient(res) {
  clients.add(res);
  console.log(`[Monitor] SSE client connected. Total: ${clients.size}`);
}

function removeClient(res) {
  clients.delete(res);
  console.log(`[Monitor] SSE client disconnected. Total: ${clients.size}`);
}

function broadcast(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try { res.write(payload); } catch { /* client gone */ }
  }
}

// ── Alert history (in-memory, max 100) ────────────────────────────────────

const alertHistory = [];

function pushAlert(alert) {
  alertHistory.unshift(alert);
  if (alertHistory.length > 100) alertHistory.splice(100);
  broadcast('alert', alert);
  console.log(`[Monitor] 🚨 Alert: ${alert.title} [${alert.severity}]`);
}

function getAlertHistory() { return alertHistory; }

// ── Event tracking (detect NEW events) ────────────────────────────────────

const seenIds = new Set();
let   isFirstPoll = true;

async function poll() {
  try {
    const events = await getLiveEvents();

    // On first poll, just seed seenIds without alerting
    if (isFirstPoll) {
      events.forEach((e) => seenIds.add(e.id));
      isFirstPoll = false;

      // Broadcast a "heartbeat" with current stats
      const criticalCount = events.filter((e) => e.severity === 'critical').length;
      const warningCount  = events.filter((e) => e.severity === 'warning').length;

      broadcast('stats', {
        total:    events.length,
        critical: criticalCount,
        warning:  warningCount,
        sources:  ['NASA EONET', 'USGS'],
        ts:       new Date().toISOString()
      });

      console.log(`[Monitor] Initial poll: ${events.length} events (${criticalCount} critical, ${warningCount} warning)`);
      return;
    }

    // Find new events
    const newEvents = events.filter((e) => !seenIds.has(e.id));
    newEvents.forEach((e) => seenIds.add(e.id));

    // Alert on new warning/critical events
    for (const event of newEvents) {
      if ((SEVERITY_RANK[event.severity] || 0) >= 2) { // warning or critical
        pushAlert({
          id:       event.id,
          title:    event.title,
          type:     event.type,
          severity: event.severity,
          lat:      event.lat,
          lon:      event.lon,
          source:   event.source,
          link:     event.link,
          ts:       new Date().toISOString()
        });
      }
    }

    // Always broadcast a stats heartbeat
    const criticalCount = events.filter((e) => e.severity === 'critical').length;
    const warningCount  = events.filter((e) => e.severity === 'warning').length;

    broadcast('stats', {
      total:     events.length,
      critical:  criticalCount,
      warning:   warningCount,
      new_events: newEvents.length,
      ts:        new Date().toISOString()
    });

    if (newEvents.length > 0) {
      console.log(`[Monitor] ${newEvents.length} new events detected.`);
    }
  } catch (err) {
    console.error('[Monitor] Poll error:', err.message);
    broadcast('error', { message: 'Live data fetch failed.', ts: new Date().toISOString() });
  }
}

// ── Start the monitor ─────────────────────────────────────────────────────

function startMonitor() {
  // Initial poll after a short delay (let server fully start)
  setTimeout(poll, 3000);
  setInterval(poll, POLL_INTERVAL_MS);
  console.log(`[Monitor] Background monitor started (interval: ${POLL_INTERVAL_MS / 60000} min)`);
}

module.exports = { startMonitor, addClient, removeClient, getAlertHistory };
