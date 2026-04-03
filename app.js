const reportForm = document.getElementById('reportForm');
const reportText = document.getElementById('reportText');
const imageUpload = document.getElementById('imageUpload');
const locationInput = document.getElementById('locationInput');
const resultCard = document.getElementById('resultCard');
const disasterTypeEl = document.getElementById('disasterType');
const riskLevelEl = document.getElementById('riskLevel');
const recommendedActionEl = document.getElementById('recommendedAction');
const alertBanner = document.getElementById('alertBanner');
const uploadInfo = document.getElementById('uploadInfo');
const reportTableBody = document.getElementById('reportTableBody');

const reports = [];

const map = L.map('map').setView([20.5937, 78.9629], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let marker = null;

const classificationRules = [
  { type: 'Flood', keywords: ['flood', 'flooded', 'water level', 'overflow', 'inundation', 'river rising'] },
  { type: 'Wildfire', keywords: ['wildfire', 'forest fire', 'smoke', 'flames', 'burning', 'ash'] },
  { type: 'Deforestation', keywords: ['deforestation', 'illegal logging', 'tree cutting', 'forest loss', 'clear-cut'] }
];

const riskWeights = {
  high: ['severe', 'critical', 'massive', 'urgent', 'evacuate', 'rapid spread', 'life-threatening'],
  medium: ['moderate', 'rising', 'warning', 'watch', 'spreading', 'damaging'],
  low: ['minor', 'small', 'contained', 'light']
};

function classifyDisaster(text) {
  const normalized = text.toLowerCase();

  for (const rule of classificationRules) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.type;
    }
  }

  return 'Other';
}

function detectRisk(text) {
  const normalized = text.toLowerCase();

  if (riskWeights.high.some((keyword) => normalized.includes(keyword))) {
    return 'High';
  }

  if (riskWeights.medium.some((keyword) => normalized.includes(keyword))) {
    return 'Medium';
  }

  if (riskWeights.low.some((keyword) => normalized.includes(keyword))) {
    return 'Low';
  }

  return 'Low';
}

function getAction(type, risk) {
  if (risk === 'High') {
    return 'Immediately notify emergency services, issue evacuation guidance, and monitor updates every 5 minutes.';
  }

  if (type === 'Flood') {
    return 'Inspect drainage and river levels, inform local response teams, and prepare shelter resources.';
  }

  if (type === 'Wildfire') {
    return 'Alert fire control teams, restrict access to affected area, and track wind direction.';
  }

  if (type === 'Deforestation') {
    return 'Notify forest authorities, verify suspected zone with imagery, and initiate compliance checks.';
  }

  return 'Monitor incoming reports and request additional evidence for validation.';
}

function applyRiskClass(level) {
  riskLevelEl.classList.remove('risk-low', 'risk-medium', 'risk-high');

  if (level === 'High') {
    riskLevelEl.classList.add('risk-high');
  } else if (level === 'Medium') {
    riskLevelEl.classList.add('risk-medium');
  } else {
    riskLevelEl.classList.add('risk-low');
  }
}

async function geocodeLocation(location) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Unable to fetch location data.');
  }

  const data = await response.json();
  if (!data.length) {
    throw new Error('Location not found. Try a more specific place name.');
  }

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
    displayName: data[0].display_name
  };
}

function renderDashboard() {
  if (!reports.length) {
    reportTableBody.innerHTML = '<tr><td colspan="4" class="empty-row">No reports submitted yet.</td></tr>';
    return;
  }

  reportTableBody.innerHTML = reports
    .map((report) => {
      const riskClass = `risk-${report.risk.toLowerCase()}`;
      const statusText = report.risk === 'High' ? 'Emergency Alert Generated' : 'Monitoring';
      return `
      <tr>
        <td>${report.text}</td>
        <td>${report.type}</td>
        <td><span class="risk-badge ${riskClass}">${report.risk}</span></td>
        <td><span class="status-pill ${riskClass}">${statusText}</span></td>
      </tr>`;
    })
    .join('');
}

reportForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const text = reportText.value.trim();
  const location = locationInput.value.trim();

  if (!text || !location) {
    return;
  }

  const type = classifyDisaster(text);
  const risk = detectRisk(text);
  const action = getAction(type, risk);

  disasterTypeEl.textContent = type;
  riskLevelEl.textContent = risk;
  applyRiskClass(risk);
  recommendedActionEl.textContent = action;
  resultCard.hidden = false;

  if (imageUpload.files.length) {
    uploadInfo.textContent = `Image attached: ${imageUpload.files[0].name}`;
  } else {
    uploadInfo.textContent = 'No image uploaded.';
  }

  if (risk === 'High') {
    alertBanner.hidden = false;
  } else {
    alertBanner.hidden = true;
  }

  try {
    const { lat, lon, displayName } = await geocodeLocation(location);
    if (marker) {
      marker.remove();
    }

    marker = L.marker([lat, lon]).addTo(map).bindPopup(`Detected at: ${displayName}`).openPopup();
    map.setView([lat, lon], 10);

    reports.unshift({
      text,
      type,
      risk,
      location: displayName
    });

    renderDashboard();
    reportForm.reset();
  } catch (error) {
    alert(`Location error: ${error.message}`);
  }
});
