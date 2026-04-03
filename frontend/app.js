const form = document.getElementById('analyzeForm');
const reportInput = document.getElementById('reportInput');
const imageInput = document.getElementById('imageInput');
const imageInfo = document.getElementById('imageInfo');
const locationInput = document.getElementById('locationInput');
const checkAiBtn = document.getElementById('checkAiBtn');
const aiStatusText = document.getElementById('aiStatusText');
const resultCard = document.getElementById('resultCard');
const disasterTypeEl = document.getElementById('disasterType');
const riskLevelEl = document.getElementById('riskLevel');
const confidenceEl = document.getElementById('confidence');
const summaryEl = document.getElementById('summary');
const mappedLocationEl = document.getElementById('mappedLocation');
const alertBanner = document.getElementById('alertBanner');
const reportsTableBody = document.getElementById('reportsTableBody');

const map = L.map('map').setView([20.5937, 78.9629], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
let marker = null;

function applyRiskStyle(riskLevel) {
  riskLevelEl.classList.remove('risk-low', 'risk-medium', 'risk-high');
  riskLevelEl.classList.add(`risk-${riskLevel.toLowerCase()}`);
}

function renderReports(reports) {
  if (!reports.length) {
    reportsTableBody.innerHTML = '<tr><td colspan="7" class="empty">No reports yet.</td></tr>';
    return;
  }

  reportsTableBody.innerHTML = reports
    .map((report) => {
      const riskClass = `risk-${report.risk_level.toLowerCase()}`;
      return `
      <tr>
        <td>${new Date(report.timestamp).toLocaleString()}</td>
        <td>${report.text}</td>
        <td>${report.disaster_type}</td>
        <td><span class="badge ${riskClass}">${report.risk_level}</span></td>
        <td>${report.confidence}</td>
        <td>${report.location || '-'}</td>
        <td>${report.image_name || '-'}</td>
      </tr>`;
    })
    .join('');
}

async function geocodeLocation(location) {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
  if (!response.ok) {
    throw new Error('Unable to geocode location');
  }

  const data = await response.json();
  if (!data.length) {
    throw new Error('Location not found. Please be more specific.');
  }

  return {
    display_name: data[0].display_name,
    lat: Number(data[0].lat),
    lon: Number(data[0].lon)
  };
}

async function loadReports() {
  const response = await fetch('/api/reports');
  const reports = await response.json();
  renderReports(reports);
}

async function checkAIConnection() {
  aiStatusText.textContent = 'Checking AI connection...';
  const response = await fetch('/api/ai-status');
  const data = await response.json();

  if (data.ok) {
    aiStatusText.textContent = `✅ ${data.reason}`;
  } else {
    aiStatusText.textContent = `⚠️ ${data.reason}`;
  }
}

imageInput.addEventListener('change', () => {
  imageInfo.textContent = imageInput.files[0] ? `Selected image: ${imageInput.files[0].name}` : '';
});

checkAiBtn.addEventListener('click', checkAIConnection);

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const text = reportInput.value.trim();
  const locationQuery = locationInput.value.trim();
  if (!text || !locationQuery) return;

  let geo = null;
  try {
    geo = await geocodeLocation(locationQuery);
  } catch (error) {
    alert(error.message);
    return;
  }

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      location: geo.display_name,
      latitude: geo.lat,
      longitude: geo.lon,
      image_name: imageInput.files[0] ? imageInput.files[0].name : null
    })
  });

  const result = await response.json();

  disasterTypeEl.textContent = result.disaster_type;
  riskLevelEl.textContent = result.risk_level;
  confidenceEl.textContent = result.confidence;
  summaryEl.textContent = result.summary;
  mappedLocationEl.textContent = geo.display_name;

  applyRiskStyle(result.risk_level);
  resultCard.hidden = false;
  alertBanner.hidden = result.risk_level !== 'High';

  if (marker) marker.remove();
  marker = L.marker([geo.lat, geo.lon]).addTo(map).bindPopup(geo.display_name).openPopup();
  map.setView([geo.lat, geo.lon], 10);

  form.reset();
  imageInfo.textContent = '';
  await loadReports();
});

loadReports();
checkAIConnection();
