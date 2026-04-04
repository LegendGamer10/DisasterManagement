/* ================================================================
   ANTIGRAVITY — Real-Time Disaster Intelligence Dashboard
   Single-file React 18 App (JSX via Babel standalone)
   ================================================================ */

const { useState, useEffect, useRef, useCallback, useMemo } = React;
const L_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

// ─── PREVENTION LOOKUP ─────────────────────────────────────────────
const PREVENTION_DATA = {
  Flood: {
    icon: '🌊',
    color: '#38bdf8',
    steps: [
      { icon: '🏔️', text: 'Move to higher ground immediately' },
      { icon: '🚫', text: 'Avoid walking or driving through flood waters' },
      { icon: '📻', text: 'Monitor weather alerts and emergency broadcasts' },
      { icon: '🔌', text: 'Disconnect electrical appliances if safe to do so' },
      { icon: '🎒', text: 'Prepare emergency go-bag with essentials' },
    ],
    contacts: ['National Flood Helpline: 1-800-FLOOD', 'Local Emergency: 911', 'Red Cross Shelter Locator'],
    evacuation: 'Evacuate vertically if trapped. Signal for rescue from rooftops. Do NOT attempt to swim through moving water.'
  },
  Fire: {
    icon: '🔥',
    color: '#f97316',
    steps: [
      { icon: '🚪', text: 'Evacuate building using nearest exit — do NOT use elevators' },
      { icon: '🧯', text: 'Use fire extinguisher only on small, contained fires' },
      { icon: '🤧', text: 'Stay low to avoid smoke inhalation' },
      { icon: '📞', text: 'Call fire department immediately' },
      { icon: '🚗', text: 'Move vehicles away from affected structures' },
    ],
    contacts: ['Fire Department: 911', 'Burn Injury Hotline', 'Hazmat Response Team'],
    evacuation: 'Close doors behind you to slow fire spread. Crawl under smoke. Meet at designated assembly point.'
  },
  Wildfire: {
    icon: '🌲',
    color: '#ef4444',
    steps: [
      { icon: '🏃', text: 'Follow official evacuation routes immediately' },
      { icon: '😷', text: 'Wear N95 mask to protect from smoke' },
      { icon: '🪟', text: 'Close all windows, vents, and doors before leaving' },
      { icon: '💧', text: 'Wet down structures and vegetation near home if time permits' },
      { icon: '📍', text: 'Register with emergency services for headcount' },
    ],
    contacts: ['Wildfire Hotline: 1-800-FIRE', 'Forest Service: 911', 'Air Quality Index Monitor'],
    evacuation: 'Drive with headlights on in smoky conditions. Take a route away from the fire front. Monitor wind direction.'
  },
  Earthquake: {
    icon: '🏚️',
    color: '#a78bfa',
    steps: [
      { icon: '🛡️', text: 'DROP, COVER, and HOLD ON under sturdy furniture' },
      { icon: '🚪', text: 'Stay away from windows and exterior walls' },
      { icon: '⚡', text: 'Shut off gas and electricity if you smell gas' },
      { icon: '🔍', text: 'Check for structural damage before re-entering buildings' },
      { icon: '📻', text: 'Listen for aftershock warnings on emergency radio' },
    ],
    contacts: ['USGS Earthquake Center', 'Emergency Services: 911', 'Structural Assessment Team'],
    evacuation: 'Move to open ground away from buildings, power lines, and trees. Watch for fallen debris.'
  },
  Cyclone: {
    icon: '🌀',
    color: '#06b6d4',
    steps: [
      { icon: '🏠', text: 'Shelter in an interior room away from windows' },
      { icon: '📦', text: 'Stock 72 hours of water, food, and medicine' },
      { icon: '🔋', text: 'Charge devices and prepare battery-powered radio' },
      { icon: '🪵', text: 'Board up windows and secure outdoor objects' },
      { icon: '🚗', text: 'Fill vehicle tank and identify evacuation routes' },
    ],
    contacts: ['National Hurricane Center', 'Coast Guard: 1-800-COAST', 'Emergency Management Agency'],
    evacuation: 'Evacuate coastal and flood-prone areas. Move inland and to higher ground. Follow mandatory orders.'
  },
  Tornado: {
    icon: '🌪️',
    color: '#facc15',
    steps: [
      { icon: '🏚️', text: 'Move to basement or lowest floor interior room' },
      { icon: '🛏️', text: 'Cover yourself with a mattress or heavy blankets' },
      { icon: '🚫', text: 'Stay away from windows, doors, and outside walls' },
      { icon: '🚗', text: 'If in a vehicle, abandon it and lie in a low ditch' },
      { icon: '📻', text: 'Listen for tornado watch/warning updates' },
    ],
    contacts: ['National Weather Service', 'Storm Prediction Center', 'Emergency Services: 911'],
    evacuation: 'Do not try to outrun a tornado in a vehicle. Seek shelter in a sturdy building immediately.'
  },
  Deforestation: {
    icon: '🪓',
    color: '#22c55e',
    steps: [
      { icon: '📸', text: 'Document evidence with geo-tagged photos' },
      { icon: '📞', text: 'Report to forest department and environmental authorities' },
      { icon: '🗺️', text: 'Mark affected coordinates for satellite verification' },
      { icon: '🌱', text: 'Initiate community reforestation response' },
      { icon: '⚖️', text: 'File complaint with environmental protection agency' },
    ],
    contacts: ['Forest Department Hotline', 'Environmental Police', 'NGO Green Response Network'],
    evacuation: 'N/A — Focus on documentation, reporting, and long-term restoration planning.'
  },
  Unknown: {
    icon: '⚠️',
    color: '#94a3b8',
    steps: [
      { icon: '📍', text: 'Stay alert and monitor your surroundings' },
      { icon: '📻', text: 'Tune into local emergency broadcasts' },
      { icon: '🎒', text: 'Prepare an emergency kit with essentials' },
      { icon: '📞', text: 'Contact local emergency services for guidance' },
      { icon: '🏠', text: 'Stay indoors until situation is clarified' },
    ],
    contacts: ['Emergency Services: 911', 'Local Government Hotline', 'Red Cross Information Line'],
    evacuation: 'Follow instructions from local authorities. Do not take unnecessary risks.'
  },
  Tsunami: {
    icon: '🌊',
    color: '#0ea5e9',
    steps: [
      { icon: '🏔️', text: 'Move immediately to high ground or inland' },
      { icon: '🚫', text: 'Do NOT stay to watch the wave — run uphill' },
      { icon: '📻', text: 'Monitor official tsunami warnings continuously' },
      { icon: '⏰', text: 'Do not return until official all-clear is given' },
      { icon: '🆘', text: 'If trapped, signal rescuers from highest point' },
    ],
    contacts: ['Tsunami Warning Center', 'Coast Guard', 'Emergency Services: 911'],
    evacuation: 'Head to elevation 100+ feet or 2+ miles inland. If you feel a strong coastal earthquake, evacuate immediately without waiting for an alert.'
  },
  Landslide: {
    icon: '⛰️',
    color: '#b45309',
    steps: [
      { icon: '👀', text: 'Watch for signs: tilting trees, unusual sounds, shifting ground' },
      { icon: '🏃', text: 'Move away from the path of the slide immediately' },
      { icon: '🚫', text: 'Avoid river valleys and low-lying areas' },
      { icon: '📞', text: 'Report to geological survey and local authorities' },
      { icon: '🏠', text: 'Do not return to damaged areas until inspected' },
    ],
    contacts: ['Geological Survey', 'Disaster Management Authority', 'Emergency Services: 911'],
    evacuation: 'Move perpendicular to the slide path. Stay away from the slide deposit area. Watch for additional slides.'
  }
};

function getPreventionData(disasterType) {
  const key = Object.keys(PREVENTION_DATA).find(k => 
    disasterType && disasterType.toLowerCase().includes(k.toLowerCase())
  );
  return PREVENTION_DATA[key] || PREVENTION_DATA.Unknown;
}

// ─── DEMO / FALLBACK REPORTS ───────────────────────────────────────
const DEMO_REPORTS = [
  { text: 'Massive flooding reported in downtown area. River banks overflowing causing severe damage to infrastructure.', disaster_type: 'Flood', risk_level: 'High', confidence: '92%', summary: 'Critical flood event with infrastructure damage', location: 'Mumbai, Maharashtra, India', latitude: 19.076, longitude: 72.8777, timestamp: new Date(Date.now() - 120000).toISOString() },
  { text: 'Forest fire spreading rapidly in northern sector. Smoke visible for miles.', disaster_type: 'Wildfire', risk_level: 'High', confidence: '88%', summary: 'Active wildfire with rapid spread pattern', location: 'Uttarakhand, India', latitude: 30.0668, longitude: 79.0193, timestamp: new Date(Date.now() - 300000).toISOString() },
  { text: 'Minor earthquake tremors felt across the region. No significant damage reported yet.', disaster_type: 'Earthquake', risk_level: 'Medium', confidence: '75%', summary: 'Moderate seismic activity detected', location: 'Delhi, India', latitude: 28.7041, longitude: 77.1025, timestamp: new Date(Date.now() - 480000).toISOString() },
  { text: 'Cyclone warning issued for eastern coastline. Storm surge expected in 12 hours.', disaster_type: 'Cyclone', risk_level: 'High', confidence: '95%', summary: 'Severe cyclone approaching eastern coast', location: 'Odisha, India', latitude: 20.9517, longitude: 85.0985, timestamp: new Date(Date.now() - 600000).toISOString() },
  { text: 'Illegal deforestation activity detected in protected forest area.', disaster_type: 'Deforestation', risk_level: 'Medium', confidence: '81%', summary: 'Unauthorized tree cutting in protected zone', location: 'Western Ghats, India', latitude: 14.75, longitude: 75.35, timestamp: new Date(Date.now() - 800000).toISOString() },
  { text: 'Moderate flooding in low-lying agricultural areas. Crops damaged but no casualties.', disaster_type: 'Flood', risk_level: 'Medium', confidence: '70%', summary: 'Agricultural flood damage in low areas', location: 'Patna, Bihar, India', latitude: 25.6093, longitude: 85.1376, timestamp: new Date(Date.now() - 1000000).toISOString() },
  { text: 'Small fire contained in industrial district. Fire brigade on scene.', disaster_type: 'Fire', risk_level: 'Low', confidence: '65%', summary: 'Contained industrial fire incident', location: 'Surat, Gujarat, India', latitude: 21.1702, longitude: 72.8311, timestamp: new Date(Date.now() - 1200000).toISOString() },
  { text: 'Tornado touchdown spotted near rural community. Immediate evacuation underway.', disaster_type: 'Tornado', risk_level: 'High', confidence: '90%', summary: 'Tornado confirmed with active evacuation', location: 'Rajasthan, India', latitude: 27.0238, longitude: 74.2179, timestamp: new Date(Date.now() - 1500000).toISOString() },
];


// ─── STYLES ─────────────────────────────────────────────────────────
const S = {
  app: {
    position: 'relative', zIndex: 1,
    width: '100vw', height: '100vh',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 24px',
    background: 'rgba(255,255,255,0.03)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    zIndex: 10, flexShrink: 0,
  },
  headerLeft: {
    display: 'flex', alignItems: 'center', gap: '16px',
  },
  logo: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '20px', fontWeight: 800,
    letterSpacing: '3px', color: '#e8f4ff',
    textShadow: '0 0 30px rgba(125,211,252,0.3)',
  },
  tagline: {
    fontSize: '12px', color: 'rgba(232,244,255,0.5)',
    fontWeight: 400, letterSpacing: '1px',
  },
  headerRight: {
    display: 'flex', alignItems: 'center', gap: '20px',
  },
  liveBadge: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '4px 12px',
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: '20px', fontSize: '11px',
    fontWeight: 600, letterSpacing: '1px',
    color: '#22c55e',
  },
  liveDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: '#22c55e',
    animation: 'livePulse 2s ease-in-out infinite',
    boxShadow: '0 0 8px rgba(34,197,94,0.6)',
  },
  clock: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px', color: 'rgba(232,244,255,0.5)',
    letterSpacing: '1px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1.5fr 1.5fr',
    gap: '12px', padding: '12px',
    flex: 1, minHeight: 0,
  },
  panel: (delay = 0) => ({
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
    animation: `panelEnter 0.6s ease-out ${delay}ms both`,
  }),
  panelHeader: {
    padding: '16px 20px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', gap: '10px',
    flexShrink: 0,
  },
  panelTitle: {
    fontSize: '13px', fontWeight: 700,
    letterSpacing: '2px', textTransform: 'uppercase',
    color: 'rgba(232,244,255,0.7)',
  },
  panelIcon: {
    fontSize: '16px',
  },
  panelBody: {
    flex: 1, overflow: 'auto', minHeight: 0,
  },
  // Map specific
  mapContainer: {
    width: '100%', height: '100%', borderRadius: '0 0 20px 20px',
  },
  // Report panel
  statsBar: {
    display: 'flex', gap: '2px', padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  statItem: {
    flex: 1, textAlign: 'center',
    padding: '8px 4px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  statValue: {
    fontSize: '22px', fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    color: '#7dd3fc',
    animation: 'countFadeIn 0.5s ease-out',
  },
  statLabel: {
    fontSize: '9px', fontWeight: 600,
    letterSpacing: '1.5px', textTransform: 'uppercase',
    color: 'rgba(232,244,255,0.4)',
    marginTop: '4px',
  },
  reportList: {
    padding: '8px 12px',
  },
  reportCard: (isActive, riskLevel) => ({
    padding: '12px 14px',
    marginBottom: '8px',
    background: isActive ? 'rgba(125,211,252,0.08)' : 'rgba(255,255,255,0.03)',
    border: isActive ? '1px solid rgba(125,211,252,0.4)' : '1px solid rgba(255,255,255,0.06)',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative', overflow: 'hidden',
    boxShadow: isActive ? '0 0 20px rgba(125,211,252,0.15), inset 0 0 20px rgba(125,211,252,0.03)' : 'none',
  }),
  alertStripe: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
    background: 'repeating-linear-gradient(90deg, #ef4444 0px, #ef4444 8px, transparent 8px, transparent 16px)',
    backgroundSize: '40px 3px',
    animation: 'alertStripe 1s linear infinite',
  },
  reportMeta: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginBottom: '6px',
  },
  reportType: {
    fontSize: '13px', fontWeight: 600, color: '#e8f4ff',
  },
  reportTime: {
    fontSize: '10px', color: 'rgba(232,244,255,0.4)',
    fontFamily: "'JetBrains Mono', monospace",
  },
  reportLocation: {
    fontSize: '11px', color: 'rgba(232,244,255,0.5)',
    marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px',
  },
  reportConfidence: {
    fontSize: '10px', color: 'rgba(232,244,255,0.4)',
    marginTop: '4px',
    fontFamily: "'JetBrains Mono', monospace",
  },
  riskBadge: (level) => {
    const colors = {
      High: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#f87171', shadow: '0 0 12px rgba(239,68,68,0.2)' },
      Medium: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#fbbf24', shadow: '0 0 12px rgba(245,158,11,0.2)' },
      Low: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)', text: '#4ade80', shadow: '0 0 12px rgba(34,197,94,0.2)' },
    };
    const c = colors[level] || colors.Low;
    return {
      padding: '2px 10px', borderRadius: '20px',
      fontSize: '10px', fontWeight: 700,
      letterSpacing: '1px', textTransform: 'uppercase',
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.text, boxShadow: c.shadow,
      display: 'inline-block',
    };
  },
  // Prevention panel
  preventionContent: {
    padding: '16px 20px',
  },
  preventionAnimWrap: (key) => ({
    animation: 'fadeSlideIn 0.4s ease-out',
  }),
  severityGauge: {
    marginBottom: '20px',
  },
  gaugeLabel: {
    fontSize: '10px', fontWeight: 600,
    letterSpacing: '1.5px', textTransform: 'uppercase',
    color: 'rgba(232,244,255,0.5)',
    marginBottom: '8px',
  },
  gaugeTrack: {
    width: '100%', height: '8px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '4px', overflow: 'hidden',
  },
  gaugeFill: (level, color) => {
    const widths = { Low: '25%', Medium: '55%', High: '90%' };
    return {
      height: '100%', borderRadius: '4px',
      background: `linear-gradient(90deg, ${color}88, ${color})`,
      width: widths[level] || '50%',
      animation: 'gaugeGrow 0.8s ease-out',
      boxShadow: `0 0 12px ${color}44`,
    };
  },
  gaugeText: (color) => ({
    fontSize: '11px', fontWeight: 600, color,
    marginTop: '6px', display: 'flex',
    justifyContent: 'space-between',
  }),
  sectionTitle: {
    fontSize: '11px', fontWeight: 700,
    letterSpacing: '1.5px', textTransform: 'uppercase',
    color: 'rgba(232,244,255,0.5)',
    marginBottom: '10px', marginTop: '16px',
  },
  stepItem: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '12px',
    marginBottom: '6px',
  },
  stepIcon: {
    fontSize: '18px', flexShrink: 0, marginTop: '1px',
  },
  stepText: {
    fontSize: '12px', color: 'rgba(232,244,255,0.8)',
    lineHeight: '1.5',
  },
  contactItem: {
    fontSize: '11px', color: 'rgba(232,244,255,0.6)',
    padding: '6px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    display: 'flex', alignItems: 'center', gap: '6px',
  },
  evacuationBox: {
    padding: '12px 14px',
    background: 'rgba(239,68,68,0.06)',
    border: '1px solid rgba(239,68,68,0.15)',
    borderRadius: '12px',
    fontSize: '12px', color: 'rgba(232,244,255,0.7)',
    lineHeight: '1.6',
  },
  disasterHeader: {
    display: 'flex', alignItems: 'center', gap: '12px',
    marginBottom: '16px',
  },
  disasterIcon: {
    fontSize: '32px',
    width: '56px', height: '56px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  disasterName: {
    fontSize: '18px', fontWeight: 700, color: '#e8f4ff',
  },
  disasterSummary: {
    fontSize: '12px', color: 'rgba(232,244,255,0.5)',
    marginTop: '2px',
  },
  emptyState: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '100%', gap: '12px',
    color: 'rgba(232,244,255,0.3)',
  },
  emptyIcon: {
    fontSize: '48px', opacity: 0.3,
  },
  emptyText: {
    fontSize: '13px', letterSpacing: '1px',
  },
};

// ─── RISK COLOR UTIL ────────────────────────────────────────────────
function getRiskColor(level) {
  if (level === 'High') return '#ef4444';
  if (level === 'Medium') return '#f59e0b';
  return '#22c55e';
}

function getMarkerIcon(riskLevel, isActive) {
  const color = getRiskColor(riskLevel);
  const size = isActive ? 16 : 10;
  const shadow = isActive ? `0 0 16px ${color}` : `0 0 8px ${color}88`;
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};box-shadow:${shadow};${isActive?'':'opacity:0.8;'}"></div>
        ${isActive ? `<div class="pulse-marker" style="color:${color};"></div>` : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
}

// ─── TIME FORMAT ────────────────────────────────────────────────────
function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── ANIMATED COUNTER HOOK ──────────────────────────────────────────
function useAnimatedCount(target, duration = 600) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    let start = null;
    const from = val;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.round(from + (target - from) * progress));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return val;
}

// ─── MAP PANEL COMPONENT ────────────────────────────────────────────
function MapPanel({ reports, activeIndex }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstance.current) return; // already init

    mapInstance.current = L.map(mapRef.current, {
      center: [22.5, 78.9],
      zoom: 5,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer(L_TILE, {
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(mapInstance.current);
  }, []);

  // Update markers whenever reports or activeIndex change
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    reports.forEach((r, i) => {
      if (r.latitude == null || r.longitude == null) return;
      const isActive = i === activeIndex;
      const icon = getMarkerIcon(r.risk_level, isActive);
      const marker = L.marker([r.latitude, r.longitude], { icon, zIndexOffset: isActive ? 1000 : 0 });
      marker.bindTooltip(
        `<div style="font-family:Inter,sans-serif;font-size:12px;"><strong>${r.disaster_type}</strong><br/>Confidence: ${r.confidence}<br/>Risk: ${r.risk_level}</div>`,
        { 
          direction: 'top', offset: [0, -8], className: '',
          opacity: 0.95,
        }
      );
      marker.addTo(mapInstance.current);
      markersRef.current.push(marker);
    });

    // Pan to active
    const active = reports[activeIndex];
    if (active && active.latitude != null && active.longitude != null) {
      mapInstance.current.flyTo([active.latitude, active.longitude], 8, { duration: 1.2 });
    }
  }, [reports, activeIndex]);

  return (
    <div style={S.panel(0)}>
      <div style={S.panelHeader}>
        <span style={S.panelIcon}>🗺️</span>
        <span style={S.panelTitle}>Threat Map</span>
      </div>
      <div style={{ ...S.panelBody, padding: 0 }}>
        <div ref={mapRef} style={S.mapContainer}></div>
      </div>
    </div>
  );
}

// ─── REPORT PANEL COMPONENT ─────────────────────────────────────────
function ReportPanel({ reports, activeIndex, onSelectReport }) {
  const totalCount = useAnimatedCount(reports.length);
  const highCount = useAnimatedCount(reports.filter(r => r.risk_level === 'High').length);
  const listRef = useRef(null);

  // Most common disaster type
  const mostCommon = useMemo(() => {
    if (!reports.length) return '—';
    const count = {};
    reports.forEach(r => { count[r.disaster_type] = (count[r.disaster_type]||0) + 1; });
    return Object.entries(count).sort((a,b) => b[1]-a[1])[0][0];
  }, [reports]);

  // Auto-scroll to active card
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[activeIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeIndex]);

  return (
    <div style={S.panel(100)}>
      <div style={S.panelHeader}>
        <span style={S.panelIcon}>📡</span>
        <span style={S.panelTitle}>Live Reports</span>
      </div>

      {/* Stats bar */}
      <div style={S.statsBar}>
        <div style={S.statItem}>
          <div style={S.statValue}>{totalCount}</div>
          <div style={S.statLabel}>Total</div>
        </div>
        <div style={S.statItem}>
          <div style={{ ...S.statValue, color: '#f87171' }}>{highCount}</div>
          <div style={S.statLabel}>High Risk</div>
        </div>
        <div style={S.statItem}>
          <div style={{ ...S.statValue, fontSize: '13px', color: '#7dd3fc' }}>{mostCommon}</div>
          <div style={S.statLabel}>Most Common</div>
        </div>
      </div>

      {/* Report list */}
      <div style={{ ...S.panelBody, ...S.reportList }} ref={listRef}>
        {reports.length === 0 && (
          <div style={S.emptyState}>
            <div style={S.emptyIcon}>📭</div>
            <div style={S.emptyText}>Waiting for reports...</div>
          </div>
        )}
        {reports.map((r, i) => (
          <div
            key={i}
            style={S.reportCard(i === activeIndex, r.risk_level)}
            onClick={() => onSelectReport(i)}
            onMouseEnter={(e) => { if (i !== activeIndex) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { if (i !== activeIndex) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          >
            {r.risk_level === 'High' && <div style={S.alertStripe}></div>}
            <div style={S.reportMeta}>
              <span style={S.reportType}>{r.disaster_type}</span>
              <span style={S.riskBadge(r.risk_level)}>{r.risk_level}</span>
              <span style={{ flex: 1 }}></span>
              <span style={S.reportTime}>{formatTime(r.timestamp)}</span>
            </div>
            {r.summary && (
              <div style={{ fontSize: '11px', color: 'rgba(232,244,255,0.6)', marginBottom: '4px', lineHeight: '1.4' }}>
                {r.summary}
              </div>
            )}
            <div style={S.reportLocation}>
              <span>📍</span>
              <span>{r.location || 'Unknown location'}</span>
            </div>
            <div style={S.reportConfidence}>
              Confidence: {r.confidence}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PREVENTION PANEL COMPONENT ─────────────────────────────────────
function PreventionPanel({ report }) {
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setAnimKey(k => k + 1);
  }, [report]);

  if (!report) {
    return (
      <div style={S.panel(200)}>
        <div style={S.panelHeader}>
          <span style={S.panelIcon}>🛡️</span>
          <span style={S.panelTitle}>Prevention Guide</span>
        </div>
        <div style={{ ...S.panelBody, ...S.emptyState }}>
          <div style={S.emptyIcon}>🛡️</div>
          <div style={S.emptyText}>Select a report to view guide</div>
        </div>
      </div>
    );
  }

  const prev = getPreventionData(report.disaster_type);
  const riskColor = getRiskColor(report.risk_level);

  return (
    <div style={S.panel(200)}>
      <div style={S.panelHeader}>
        <span style={S.panelIcon}>🛡️</span>
        <span style={S.panelTitle}>Prevention & Response</span>
      </div>
      <div style={S.panelBody}>
        <div key={animKey} style={S.preventionAnimWrap(animKey)}>
          <div style={S.preventionContent}>
            {/* Disaster header */}
            <div style={S.disasterHeader}>
              <div style={S.disasterIcon}>
                <span>{prev.icon}</span>
              </div>
              <div>
                <div style={S.disasterName}>{report.disaster_type}</div>
                <div style={S.disasterSummary}>{report.summary || 'Active incident'}</div>
              </div>
            </div>

            {/* Alert Level Badge */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '6px 16px', borderRadius: '20px',
                background: `${riskColor}15`,
                border: `1px solid ${riskColor}40`,
                boxShadow: `0 0 16px ${riskColor}20`,
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: riskColor,
                  boxShadow: `0 0 8px ${riskColor}`,
                  animation: report.risk_level === 'High' ? 'livePulse 1.5s ease-in-out infinite' : 'none',
                }}></div>
                <span style={{
                  fontSize: '11px', fontWeight: 700,
                  letterSpacing: '1.5px', textTransform: 'uppercase',
                  color: riskColor,
                }}>
                  {report.risk_level} ALERT LEVEL
                </span>
              </div>
            </div>

            {/* Severity Gauge */}
            <div style={S.severityGauge}>
              <div style={S.gaugeLabel}>Severity Assessment</div>
              <div style={S.gaugeTrack}>
                <div style={S.gaugeFill(report.risk_level, prev.color)}></div>
              </div>
              <div style={S.gaugeText(prev.color)}>
                <span>Low</span>
                <span>{report.risk_level} — {report.confidence} confidence</span>
                <span>Critical</span>
              </div>
            </div>

            {/* Action Steps */}
            <div style={S.sectionTitle}>⚡ Immediate Actions</div>
            {prev.steps.map((step, i) => (
              <div key={i} style={S.stepItem}>
                <span style={S.stepIcon}>{step.icon}</span>
                <span style={S.stepText}>{step.text}</span>
              </div>
            ))}

            {/* Evacuation */}
            <div style={S.sectionTitle}>🚨 Evacuation Protocol</div>
            <div style={S.evacuationBox}>
              {prev.evacuation}
            </div>

            {/* Emergency Contacts */}
            <div style={S.sectionTitle}>📞 Emergency Contacts</div>
            {prev.contacts.map((c, i) => (
              <div key={i} style={S.contactItem}>
                <span>•</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── MAIN APP ───────────────────────────────────────────────────────
function App() {
  const [reports, setReports] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [utcTime, setUtcTime] = useState('');
  const rotateRef = useRef(null);
  const [useDemoData, setUseDemoData] = useState(false);

  // Fetch reports from API
  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/reports');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data && data.length > 0) {
        setReports(data);
        setUseDemoData(false);
      } else {
        // No reports from API — use demo data
        setReports(DEMO_REPORTS);
        setUseDemoData(true);
      }
    } catch {
      // API unreachable — use demo data
      setReports(DEMO_REPORTS);
      setUseDemoData(true);
    }
  }, []);

  // Initial fetch + polling every 15s
  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 15000);
    return () => clearInterval(interval);
  }, [fetchReports]);

  // Auto-rotate active report every 8s
  useEffect(() => {
    if (reports.length === 0) return;
    rotateRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % reports.length);
    }, 8000);
    return () => clearInterval(rotateRef.current);
  }, [reports.length]);

  // UTC clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', '  ').substring(0, 21) + ' UTC');
    };
    tick();
    const int = setInterval(tick, 1000);
    return () => clearInterval(int);
  }, []);

  // Click to select a report (+ restart rotation timer)
  const handleSelectReport = useCallback((i) => {
    setActiveIndex(i);
    clearInterval(rotateRef.current);
    rotateRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % reports.length);
    }, 8000);
  }, [reports.length]);

  const activeReport = reports[activeIndex] || null;

  return (
    <div style={S.app}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <span style={S.logo}>ANTIGRAVITY</span>
          <span style={S.tagline}>Real-Time Disaster Intelligence</span>
        </div>
        <div style={S.headerRight}>
          <div style={S.liveBadge}>
            <div style={S.liveDot}></div>
            LIVE
          </div>
          {useDemoData && (
            <div style={{
              padding: '4px 12px', borderRadius: '20px',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              fontSize: '10px', fontWeight: 600, letterSpacing: '1px',
              color: '#fbbf24',
            }}>
              DEMO MODE
            </div>
          )}
          <span style={S.clock}>{utcTime}</span>
        </div>
      </header>

      {/* Three-panel grid */}
      <div style={S.grid}>
        <MapPanel reports={reports} activeIndex={activeIndex} />
        <ReportPanel reports={reports} activeIndex={activeIndex} onSelectReport={handleSelectReport} />
        <PreventionPanel report={activeReport} />
      </div>
    </div>
  );
}

// ─── MOUNT ──────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
