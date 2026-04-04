// ── Map & layers ──────────────────────────────────────────────────────────
const map          = L.map('map').setView([20.5937, 78.9629], 4);
const markersLayer = L.layerGroup().addTo(map);
let   heatLayer    = null;
let   heatVisible  = true;
let   markersVisible = true;

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap © CARTO'
}).addTo(map);

// ── Toast ─────────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  const colorMap = { success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)', info: 'var(--accent)' };
  toast.style.cssText = `
    padding:0.8rem 1rem;border-radius:var(--radius-md);
    background:rgba(10,20,40,0.95);backdrop-filter:blur(20px);
    border:1px solid ${colorMap[type] || 'var(--glass-border)'};
    border-left:3px solid ${colorMap[type] || 'var(--accent)'};
    font-size:0.83rem;animation:fadeIn 0.3s ease both;
    color:var(--text-primary);cursor:pointer;
  `;
  toast.textContent = message;
  toast.addEventListener('click', () => toast.remove());
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 7000);
}

// ── SSE for real-time alerts ───────────────────────────────────────────────
const sse = new EventSource('/api/alerts/stream');
sse.addEventListener('alert', (e) => {
  const a = JSON.parse(e.data);
  showToast(`🚨 ${a.title}`, a.severity === 'critical' ? 'danger' : 'warning');
});

// ── Render table ──────────────────────────────────────────────────────────
let allReports = [];

function renderTable(reports) {
  const tbody = document.getElementById('reportsTableBody');
  if (!reports.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">No reports yet — <a href="report.html">submit one →</a></td></tr>';
    return;
  }

  tbody.innerHTML = reports.map((r) => {
    const safe = String(r.text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const excerpt = safe.length > 80 ? safe.slice(0, 80) + '…' : safe;
    const riskClass = `badge badge-${(r.risk_level || 'low').toLowerCase()}`;
    const sourceLabel = r.source === 'rule-based-fallback' ? '📊' : '🤖';
    return `
      <tr>
        <td style="white-space:nowrap;">${new Date(r.timestamp).toLocaleString()}</td>
        <td title="${safe}">${excerpt}</td>
        <td>${r.disaster_type || '—'}</td>
        <td><span class="${riskClass}">${r.risk_level || '—'}</span></td>
        <td>${r.confidence || '—'}</td>
        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${r.location||''}">${(r.location || '—').slice(0,60)}</td>
        <td title="${r.source||''}">${sourceLabel}</td>
      </tr>`;
  }).join('');
}

// ── Stats row ─────────────────────────────────────────────────────────────
function updateStats(reports) {
  document.getElementById('stat-total').textContent  = reports.length;
  document.getElementById('stat-high').textContent   = reports.filter(r => r.risk_level === 'High').length;
  document.getElementById('stat-medium').textContent = reports.filter(r => r.risk_level === 'Medium').length;

  const types = [...new Set(reports.map(r => r.disaster_type).filter(Boolean))];
  document.getElementById('stat-types').textContent = types.length || '—';
}

// ── Map rendering ─────────────────────────────────────────────────────────
function plotReports(reports) {
  markersLayer.clearLayers();
  if (heatLayer) { map.removeLayer(heatLayer); heatLayer = null; }

  const withCoords = reports.filter((r) =>
    typeof r.latitude === 'number' && typeof r.longitude === 'number'
  );

  // Markers
  withCoords.forEach((r) => {
    const color = r.risk_level === 'High' ? '#ff3d71' : r.risk_level === 'Medium' ? '#ffaa00' : '#00e096';
    const icon  = L.divIcon({
      className: '',
      html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.7);box-shadow:0 0 8px ${color};"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 7]
    });
    const popup = `<strong>${r.disaster_type}</strong> — ${r.risk_level}<br/>${(r.location||'').slice(0,80)}`;
    L.marker([r.latitude, r.longitude], { icon }).addTo(markersLayer).bindPopup(popup);
  });

  // Heatmap
  if (withCoords.length > 0) {
    const heatPoints = withCoords.map((r) => {
      const weight = r.risk_level === 'High' ? 1.0 : r.risk_level === 'Medium' ? 0.6 : 0.3;
      return [r.latitude, r.longitude, weight];
    });
    heatLayer = L.heatLayer(heatPoints, { radius: 35, blur: 25, maxZoom: 12 });
    if (heatVisible) heatLayer.addTo(map);
  }

  // Fit bounds
  if (withCoords.length === 1) {
    map.setView([withCoords[0].latitude, withCoords[0].longitude], 8);
  } else if (withCoords.length > 1) {
    map.fitBounds(L.latLngBounds(withCoords.map(r => [r.latitude, r.longitude])).pad(0.15));
  }
}

// ── Filter ────────────────────────────────────────────────────────────────
function applyFilters() {
  const type = document.getElementById('filterType').value;
  const risk = document.getElementById('filterRisk').value;
  let filtered = allReports;
  if (type) filtered = filtered.filter(r => r.disaster_type === type);
  if (risk) filtered = filtered.filter(r => r.risk_level === risk);
  renderTable(filtered);
  plotReports(filtered);
}

document.getElementById('filterType').addEventListener('change', applyFilters);
document.getElementById('filterRisk').addEventListener('change', applyFilters);

// ── Toggle buttons ────────────────────────────────────────────────────────
document.getElementById('toggleHeatmap').addEventListener('click', () => {
  heatVisible = !heatVisible;
  if (heatLayer) {
    if (heatVisible) heatLayer.addTo(map); else map.removeLayer(heatLayer);
    document.getElementById('toggleHeatmap').style.borderColor = heatVisible ? 'var(--accent)' : 'var(--glass-border)';
  }
});

document.getElementById('toggleHeatmap').style.borderColor = 'var(--accent)';

// ── Load reports ──────────────────────────────────────────────────────────
async function loadReports() {
  try {
    const res = await fetch('/api/reports');
    allReports = await res.json();
    updateStats(allReports);
    applyFilters();
    document.getElementById('lastUpdated').textContent = `Updated ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    showToast('Failed to load reports.', 'danger');
  }
}

document.getElementById('refreshBtn').addEventListener('click', loadReports);
loadReports();
