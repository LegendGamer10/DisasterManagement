// ── Map init ──────────────────────────────────────────────────────────────
const map          = L.map('map-fullscreen').setView([20, 0], 2);
const markersLayer = L.layerGroup().addTo(map);
let   heatLayer    = null;
let   heatVisible  = true;
let   markersVisible = true;
let   allEvents    = [];
let   refreshTimer  = null;

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap © CARTO'
}).addTo(map);

// ── Utils ─────────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  const colorMap = { success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)', info: 'var(--accent)' };
  toast.style.cssText = `
    padding:0.8rem 1rem;border-radius:var(--radius-md);
    background:rgba(10,20,40,0.95);backdrop-filter:blur(20px);
    border:1px solid ${colorMap[type]||'var(--glass-border)'};
    border-left:3px solid ${colorMap[type]||'var(--accent)'};
    font-size:0.83rem;animation:fadeIn 0.3s ease both;
    color:var(--text-primary);cursor:pointer;pointer-events:auto;
  `;
  toast.textContent = message;
  toast.addEventListener('click', () => toast.remove());
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 8000);
}

// ── SSE for real-time alerts ───────────────────────────────────────────────
const sse = new EventSource('/api/alerts/stream');
sse.addEventListener('alert', (e) => {
  const a = JSON.parse(e.data);
  showToast(`🚨 ${a.title}`, a.severity === 'critical' ? 'danger' : 'warning');
});
sse.addEventListener('stats', (e) => {
  const s = JSON.parse(e.data);
  document.getElementById('sb-total').textContent    = s.total;
  document.getElementById('sb-critical').textContent = s.critical;
  document.getElementById('sb-warning').textContent  = s.warning;
  document.getElementById('sb-watch').textContent    = (s.total - s.critical - s.warning);
});

// ── Filter & render ───────────────────────────────────────────────────────
function getFilteredEvents() {
  const typeF = document.getElementById('typeFilter').value;
  const sevF  = document.getElementById('severityFilter').value;
  return allEvents.filter((e) =>
    (!typeF || e.type === typeF) &&
    (!sevF  || e.severity === sevF)
  );
}

function renderSidebar(events) {
  const list = document.getElementById('eventList');
  if (!events.length) {
    list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-dim);">No events match filters.</div>';
    return;
  }

  list.innerHTML = events.slice(0, 80).map((e) => {
    const col = e.color || typeColor(e.type);
    return `
      <div class="event-item" onclick="flyTo(${e.lat},${e.lon},'${e.title.replace(/'/g,"\\'")}')">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;">
          <div class="legend-dot" style="background:${col};flex-shrink:0;"></div>
          <div class="event-item-title">${e.title}</div>
        </div>
        <div class="event-item-meta">
          ${e.source} · ${fmtDate(e.date)}
          &nbsp;<span class="badge ${severityClass(e.severity)}" style="font-size:0.65rem;">${e.severity}</span>
        </div>
      </div>`;
  }).join('');
}

function flyTo(lat, lon, title) {
  map.flyTo([lat, lon], 7, { animate: true, duration: 1 });
  L.popup().setLatLng([lat, lon]).setContent(`<strong>${title}</strong>`).openOn(map);
}

function renderMap(events) {
  markersLayer.clearLayers();
  if (heatLayer) { map.removeLayer(heatLayer); heatLayer = null; }

  const withCoords = events.filter((e) => e.lat != null && e.lon != null);

  // Custom circle markers by severity
  withCoords.forEach((e) => {
    const col  = e.color || typeColor(e.type);
    const size = e.severity === 'critical' ? 12 : e.severity === 'warning' ? 9 : 7;
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${col};border:1px solid rgba(255,255,255,0.6);box-shadow:0 0 6px ${col};"></div>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
    const popup = `<strong>${e.title}</strong><br/>Type: ${e.type}<br/>Source: ${e.source}<br/>Date: ${fmtDate(e.date)}${e.magnitude ? `<br/>Magnitude: ${e.magnitude}` : ''}${e.link ? `<br/><a href="${e.link}" target="_blank">Details →</a>` : ''}`;
    L.marker([e.lat, e.lon], { icon }).addTo(markersLayer).bindPopup(popup);
  });

  if (!markersVisible) markersLayer.clearLayers();

  // Heatmap
  if (withCoords.length > 0) {
    const heatPoints = withCoords.map((e) => {
      const w = e.severity === 'critical' ? 1.0 : e.severity === 'warning' ? 0.6 : 0.3;
      return [e.lat, e.lon, w];
    });
    heatLayer = L.heatLayer(heatPoints, { radius: 28, blur: 22, maxZoom: 10, gradient: { 0.4: '#00d4ff', 0.65: '#ffaa00', 1.0: '#ff3d71' } });
    if (heatVisible) heatLayer.addTo(map);
  }
}

function applyFilters() {
  const filtered = getFilteredEvents();
  renderSidebar(filtered);
  renderMap(filtered);
}

document.getElementById('typeFilter').addEventListener('change', applyFilters);
document.getElementById('severityFilter').addEventListener('change', applyFilters);

// ── Toggle layers ─────────────────────────────────────────────────────────
document.getElementById('toggleHeatLayer').addEventListener('click', () => {
  heatVisible = !heatVisible;
  if (heatLayer) {
    if (heatVisible) heatLayer.addTo(map); else map.removeLayer(heatLayer);
  }
  document.getElementById('toggleHeatLayer').style.borderColor = heatVisible ? 'var(--accent)' : 'var(--glass-border)';
});

document.getElementById('toggleMarkers').addEventListener('click', () => {
  markersVisible = !markersVisible;
  if (markersVisible) applyFilters(); else markersLayer.clearLayers();
  document.getElementById('toggleMarkers').style.borderColor = markersVisible ? 'var(--accent)' : 'var(--glass-border)';
});

// Default active styles
document.getElementById('toggleHeatLayer').style.borderColor = 'var(--accent)';
document.getElementById('toggleMarkers').style.borderColor   = 'var(--accent)';

// ── Load events ───────────────────────────────────────────────────────────
async function loadEvents() {
  try {
    const res  = await fetch('/api/live-events');
    allEvents  = await res.json();

    const total    = allEvents.length;
    const critical = allEvents.filter(e => e.severity === 'critical').length;
    const warning  = allEvents.filter(e => e.severity === 'warning').length;
    const watch    = total - critical - warning;

    document.getElementById('sb-total').textContent    = total;
    document.getElementById('sb-critical').textContent = critical;
    document.getElementById('sb-warning').textContent  = warning;
    document.getElementById('sb-watch').textContent    = watch;
    document.getElementById('lastRefresh').textContent = new Date().toLocaleTimeString();

    applyFilters();
  } catch (err) {
    showToast('Failed to load live events.', 'danger');
    document.getElementById('eventList').innerHTML =
      '<div style="text-align:center;padding:2rem;color:var(--danger);">Failed to load events.</div>';
  }
}

// Auto-refresh every 60 s
loadEvents();
refreshTimer = setInterval(loadEvents, 60_000);
