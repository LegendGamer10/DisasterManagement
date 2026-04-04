/**
 * Live disaster data service — NO API KEY REQUIRED.
 *
 * Sources:
 *   - NASA EONET  (https://eonet.gsfc.nasa.gov) — open fires, storms, floods, etc.
 *   - USGS        (https://earthquake.usgs.gov) — significant earthquakes
 *
 * Results are cached for CACHE_TTL_MS milliseconds to avoid hammering APIs.
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let _cache = null;
let _cacheTime = 0;

// ─── Colour/severity map ─────────────────────────────────────────────────────

const EONET_CATEGORY_MAP = {
  'Wildfires': { type: 'Wildfire', severity: 'warning', color: '#ff6b35' },
  'Severe Storms': { type: 'Cyclone', severity: 'warning', color: '#7b61ff' },
  'Floods': { type: 'Flood', severity: 'warning', color: '#00d4ff' },
  'Sea and Lake Ice': { type: 'Ice Event', severity: 'watch', color: '#a0d8ef' },
  'Volcanoes': { type: 'Volcanic Activity', severity: 'critical', color: '#ff3d71' },
  'Earthquakes': { type: 'Earthquake', severity: 'warning', color: '#ffaa00' },
  'Landslides': { type: 'Landslide', severity: 'warning', color: '#8b6914' },
  'Drought': { type: 'Drought', severity: 'watch', color: '#f4a261' },
  'Dust and Haze': { type: 'Dust/Haze', severity: 'watch', color: '#e9c46a' },
  'Manmade': { type: 'Manmade Incident', severity: 'watch', color: '#6c757d' }
};

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function fetchNASAEONET() {
  const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=150&days=30';
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`EONET HTTP ${res.status}`);
  const data = await res.json();

  const events = [];
  for (const event of (data.events || [])) {
    const geomArr = event.geometry || [];
    if (!geomArr.length) continue;

    // Use the most recent geometry point
    const geom = geomArr[geomArr.length - 1];
    const coords = geom.coordinates;
    if (!coords) continue;

    let lat, lon;
    if (Array.isArray(coords[0])) {
      // Polygon/line — use first point
      lon = coords[0][0];
      lat = coords[0][1];
    } else {
      lon = coords[0];
      lat = coords[1];
    }

    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) continue;

    const cat = event.categories?.[0]?.title || 'Unknown';
    const meta = EONET_CATEGORY_MAP[cat] || { type: cat, severity: 'watch', color: '#aaaaaa' };

    events.push({
      id: event.id,
      title: event.title,
      type: meta.type,
      category: cat,
      source: 'NASA EONET',
      date: geom.date || new Date().toISOString(),
      lat,
      lon,
      severity: meta.severity,
      color: meta.color,
      link: event.sources?.[0]?.url || `https://eonet.gsfc.nasa.gov/api/v3/events/${event.id}`,
      magnitude: null
    });
  }

  return events;
}

async function fetchUSGSEarthquakes() {
  const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson';
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`USGS HTTP ${res.status}`);
  const data = await res.json();

  return (data.features || []).map((f) => {
    const mag = f.properties.mag;
    const severity = mag >= 7 ? 'critical' : mag >= 5.5 ? 'warning' : 'watch';
    return {
      id: f.id,
      title: f.properties.title,
      type: 'Earthquake',
      category: 'Earthquakes',
      source: 'USGS',
      date: new Date(f.properties.time).toISOString(),
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      severity,
      color: '#ffaa00',
      link: f.properties.url,
      magnitude: mag
    };
  }).filter((e) => e.lat != null && e.lon != null);
}

// ─── Public API ──────────────────────────────────────────────────────────────

async function getLiveEvents() {
  const now = Date.now();
  if (_cache && (now - _cacheTime) < CACHE_TTL_MS) {
    return _cache;
  }

  const [eonet, usgs] = await Promise.allSettled([fetchNASAEONET(), fetchUSGSEarthquakes()]);

  if (eonet.status === 'rejected') console.warn('[LiveData] NASA EONET failed:', eonet.reason?.message);
  if (usgs.status === 'rejected') console.warn('[LiveData] USGS failed:', usgs.reason?.message);

  const events = [
    ...(eonet.status === 'fulfilled' ? eonet.value : []),
    ...(usgs.status === 'fulfilled' ? usgs.value : [])
  ];

  // Sort by date descending
  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  _cache = events;
  _cacheTime = now;
  console.log(`[LiveData] Refreshed: ${events.length} events (EONET: ${eonet.value?.length ?? 'err'}, USGS: ${usgs.value?.length ?? 'err'})`);
  return events;
}

/**
 * Filter events within `radiusDeg` degrees of (lat, lon).
 * 1 degree ≈ 111 km, so default 8 deg ≈ ~900 km radius.
 */
function filterNearby(events, lat, lon, radiusDeg = 8) {
  return events.filter((e) => {
    const dlat = Math.abs(e.lat - lat);
    const dlon = Math.abs(e.lon - lon);
    return dlat <= radiusDeg && dlon <= radiusDeg;
  });
}

module.exports = { getLiveEvents, filterNearby };
