const form = document.getElementById('analyzeForm');
const reportInput = document.getElementById('reportInput');
const resultCard = document.getElementById('resultCard');
const disasterTypeEl = document.getElementById('disasterType');
const riskLevelEl = document.getElementById('riskLevel');
const confidenceEl = document.getElementById('confidence');
const summaryEl = document.getElementById('summary');
const alertBanner = document.getElementById('alertBanner');
const reportsTableBody = document.getElementById('reportsTableBody');

// Simple helper for badge coloring.
function applyRiskStyle(riskLevel) {
  riskLevelEl.classList.remove('risk-low', 'risk-medium', 'risk-high');
  const normalized = riskLevel.toLowerCase();
  riskLevelEl.classList.add(`risk-${normalized}`);
}

function renderReports(reports) {
  if (!reports.length) {
    reportsTableBody.innerHTML = '<tr><td colspan="5" class="empty">No reports yet.</td></tr>';
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
      </tr>`;
    })
    .join('');
}

async function loadReports() {
  const response = await fetch('/api/reports');
  const reports = await response.json();
  renderReports(reports);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const text = reportInput.value.trim();
  if (!text) return;

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  const result = await response.json();

  disasterTypeEl.textContent = result.disaster_type;
  riskLevelEl.textContent = result.risk_level;
  confidenceEl.textContent = result.confidence;
  summaryEl.textContent = result.summary;

  applyRiskStyle(result.risk_level);
  resultCard.hidden = false;
  alertBanner.hidden = result.risk_level !== 'High';

  reportInput.value = '';
  await loadReports();
});

loadReports();
