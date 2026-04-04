// ── Map init ──────────────────────────────────────────────────────────────
const map = L.map('map').setView([20.5937, 78.9629], 4);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap © CARTO'
}).addTo(map);

let marker = null;

// ── AI status ─────────────────────────────────────────────────────────────
async function checkAI() {
  const dot  = document.getElementById('aiDot');
  const text = document.getElementById('aiStatusText');
  try {
    const res  = await fetch('/api/ai-status');
    const data = await res.json();
    dot.className  = 'ai-dot ' + (data.ok ? 'ok' : 'err');
    text.textContent = data.reason;
    text.style.color = data.ok ? 'var(--success)' : 'var(--warning)';
  } catch {
    dot.className  = 'ai-dot err';
    text.textContent = 'Cannot reach server.';
  }
}

document.getElementById('checkAiBtn').addEventListener('click', checkAI);
checkAI();

// Auto-recheck every 30 s until model is ready
const aiRecheckInterval = setInterval(async () => {
  try {
    const res  = await fetch('/api/ai-status');
    const data = await res.json();
    if (data.status === 'ready') {
      showToast('🤖 Local AI model is now ready!', 'success');
      document.getElementById('aiDot').className = 'ai-dot ok';
      document.getElementById('aiStatusText').textContent = data.reason;
      document.getElementById('aiStatusText').style.color = 'var(--success)';
      clearInterval(aiRecheckInterval);
    }
  } catch { /* ignore */ }
}, 30_000);

// ── Toast notifications ────────────────────────────────────────────────────
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
sse.addEventListener('error', () => { /* silent — will reconnect */ });

// ── Form submission ────────────────────────────────────────────────────────
const form        = document.getElementById('analyzeForm');
const submitBtn   = document.getElementById('submitBtn');
const submitLabel = document.getElementById('submitLabel');
const submitSpinner = document.getElementById('submitSpinner');

// Image drag-drop / preview
const imageInput  = document.getElementById('imageInput');
const fileDrop    = document.getElementById('fileDrop');
const fileDisplay = document.getElementById('fileNameDisplay');
const previewWrap = document.getElementById('imagePreviewWrap');
const previewImg  = document.getElementById('imagePreview');

imageInput.addEventListener('change', () => {
  const f = imageInput.files[0];
  if (!f) return;
  fileDisplay.textContent = f.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src    = e.target.result;
    previewWrap.style.display = 'block';
  };
  reader.readAsDataURL(f);
});

['dragover','dragenter'].forEach((ev) => {
  fileDrop.addEventListener(ev, (e) => { e.preventDefault(); fileDrop.classList.add('drag-over'); });
});
['dragleave','drop'].forEach((ev) => {
  fileDrop.addEventListener(ev, () => fileDrop.classList.remove('drag-over'));
});
fileDrop.addEventListener('drop', (e) => {
  e.preventDefault();
  const f = e.dataTransfer.files[0];
  if (f && f.type.startsWith('image/')) {
    const dt = new DataTransfer();
    dt.items.add(f);
    imageInput.files = dt.files;
    imageInput.dispatchEvent(new Event('change'));
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const text        = document.getElementById('reportInput').value.trim();
  const locationStr = document.getElementById('locationInput').value.trim();
  if (!text || !locationStr) return;

  // Loading state
  submitBtn.disabled  = true;
  submitLabel.style.display  = 'none';
  submitSpinner.style.display = 'inline-block';

  try {
    // Geocode
    let geo;
    try {
      geo = await geocodeLocation(locationStr);
    } catch (err) {
      showToast(`📍 ${err.message}`, 'warning');
      return;
    }

    // Call backend
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        location:  geo.display_name,
        latitude:  geo.lat,
        longitude: geo.lon,
        image_name: imageInput.files[0] ? imageInput.files[0].name : null
      })
    });

    const result = await res.json();
    if (!res.ok || result.error) {
      showToast(result.error || 'Analysis failed.', 'danger');
      return;
    }

    // Show results
    renderResult(result, geo);

    // Fetch nearby events
    loadNearbyEvents(geo.lat, geo.lon);

    // Map
    if (marker) marker.remove();
    const color = result.risk_level === 'High' ? '#ff3d71' : result.risk_level === 'Medium' ? '#ffaa00' : '#00e096';
    const icon  = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 8px ${color};"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    marker = L.marker([geo.lat, geo.lon], { icon })
      .addTo(map)
      .bindPopup(`<strong>${result.disaster_type}</strong><br/>Risk: ${result.risk_level}<br/>${geo.display_name.slice(0, 80)}`)
      .openPopup();
    map.setView([geo.lat, geo.lon], 10);

    form.reset();
    fileDisplay.textContent      = '';
    previewWrap.style.display    = 'none';

  } finally {
    submitBtn.disabled          = false;
    submitLabel.style.display   = 'inline';
    submitSpinner.style.display = 'none';
  }
});

// ── Render result ─────────────────────────────────────────────────────────
function renderResult(result, geo) {
  document.getElementById('emptyState').style.display  = 'none';
  document.getElementById('resultCard').style.display  = 'flex';
  document.getElementById('resultCard').style.flexDirection = 'column';

  const riskEl   = document.getElementById('riskLevel');
  riskEl.textContent = result.risk_level;
  riskEl.className   = `badge badge-${result.risk_level.toLowerCase()}`;

  document.getElementById('disasterType').textContent = result.disaster_type;
  document.getElementById('confidence').textContent   = result.confidence;
  document.getElementById('affectedRadius').textContent = `~${result.affected_radius_km} km`;
  document.getElementById('summary').textContent      = result.summary;
  document.getElementById('sourceTag').textContent    = result.source === 'rule-based-fallback'
    ? '📊 Rule-based' : '🤖 Local AI';

  // Severity bar
  const score = Math.min(10, Math.max(0, result.severity_score || 0));
  document.getElementById('severityVal').textContent    = `${score}/10`;
  document.getElementById('severityBar').style.width    = `${score * 10}%`;

  // Alert banner
  document.getElementById('alertBanner').style.display = result.risk_level === 'High' ? 'flex' : 'none';
  if (result.risk_level === 'High') showToast(`🚨 High risk: ${result.disaster_type} — take immediate action!`, 'danger');

  // Actions
  const list    = document.getElementById('actionsList');
  list.innerHTML = '';
  (result.recommended_actions || []).forEach((action) => {
    const li = document.createElement('li');
    li.textContent = action;
    list.appendChild(li);
  });

  // Scroll to result
  document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Nearby events ─────────────────────────────────────────────────────────
async function loadNearbyEvents(lat, lon) {
  try {
    const res    = await fetch(`/api/live-events?lat=${lat}&lon=${lon}&radius=8`);
    const events = await res.json();

    const card = document.getElementById('nearbyCard');
    const list = document.getElementById('nearbyEventsList');

    if (!events.length) { card.style.display = 'none'; return; }

    card.style.display = 'block';
    list.innerHTML = events.slice(0, 8).map((e) => `
      <div class="nearby-event-item">
        <div class="nearby-event-dot" style="background:${e.color || typeColor(e.type)};"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:0.82rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${e.title}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);">${e.source} · ${fmtDate(e.date)}</div>
        </div>
        <span class="badge ${severityClass(e.severity)}">${e.severity}</span>
      </div>
    `).join('');
  } catch { /* silent */ }
}
