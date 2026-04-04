// ── Shared geocoding helper ────────────────────────────────────────────────
async function geocodeLocation(locationQuery) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(locationQuery)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('Unable to reach geocoding service.');
  const data = await res.json();
  if (!data.length) throw new Error(`Location not found: "${locationQuery}". Try a city name or landmark.`);
  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
    display_name: data[0].display_name
  };
}

// ── Type → color map (must match backend/services/liveData.js) ──────────────
const TYPE_COLORS = {
  'Wildfire':          '#ff6b35',
  'Flood':             '#00d4ff',
  'Earthquake':        '#ffaa00',
  'Cyclone':           '#7b61ff',
  'Landslide':         '#8b6914',
  'Drought':           '#f4a261',
  'Volcanic Activity': '#ff3d71',
  'Seismic Activity':  '#ffaa00',
  'Ice Event':         '#a0d8ef',
  'Dust/Haze':         '#e9c46a',
  'General Incident':  '#aaaaaa',
  'Deforestation':     '#4caf50'
};

function typeColor(type) {
  return TYPE_COLORS[type] || '#aaaaaa';
}

// ── Severity → badge class ────────────────────────────────────────────────
function severityClass(severity) {
  if (severity === 'critical') return 'badge-critical';
  if (severity === 'warning') return 'badge-warning';
  return 'badge-watch';
}

// ── Format date nicely ────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}
