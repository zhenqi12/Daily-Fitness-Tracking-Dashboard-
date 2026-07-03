const dashboard = document.getElementById('dashboard');
const toastContainer = document.getElementById('toast-container');
const orderForm = document.getElementById('order-form');
const alertBanner = document.getElementById('alert-banner');
const dashboardSummary = document.getElementById('dashboard-summary');
const submitButton = orderForm.querySelector('button[type="submit"]');
let isSubmittingOrder = false;

const ICONS = {
  calories: '🔥',
  protein: '🥩',
  carbs: '🥖',
  fats: '💧',
};

const META = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fats', label: 'Fats', unit: 'g' },
];

function getBadgeText(tier) {
  if (tier === 'red') return 'Exceeded';
  if (tier === 'yellow') return 'Almost there';
  return 'On track';
}

function renderDashboard(data) {
  const onTrackCount = META.reduce((count, macro) => {
    const tier = data[macro.key]?.tier;
    return count + (tier === 'green' ? 1 : 0);
  }, 0);

  dashboardSummary.textContent = `${onTrackCount} of 4 macros on track`;
  dashboard.innerHTML = META.map((macro) => {
    const macroData = data[macro.key];
    const tier = ['green', 'yellow', 'red'].includes(macroData.tier) ? macroData.tier : 'green';
    const percent = Math.min(100, macroData.percent);
    const fillColor = tier === 'red' ? '#ef4444' : tier === 'yellow' ? '#f59e0b' : '#22c55e';
    const delta = macroData.target - macroData.consumed;
    const remainder = delta >= 0
      ? `${delta}${macro.unit} left`
      : `+${-delta}${macro.unit} over`;

    return `
      <article class="macro-card">
        <h3>
          <span class="macro-label">${ICONS[macro.key]} ${macro.label}</span>
          <span class="status-badge ${tier}">${getBadgeText(tier)}</span>
        </h3>
        <div class="macro-stats">
          <span>${macroData.consumed}${macro.unit}</span>
          <span>${macroData.target}${macro.unit}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${tier}" style="width: ${percent}%; background-color: ${fillColor};"></div>
        </div>
        <div class="macro-remaining">${remainder}</div>
      </article>
    `;
  }).join('');
}

function showToast(alert) {
  const toast = document.createElement('div');
  toast.className = `toast ${alert.tier}`;
  toast.textContent = alert.message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3800);
}

async function fetchDashboard(userId, date) {
  const params = new URLSearchParams({ user_id: userId, date });
  const response = await fetch(`/api/daily-log?${params.toString()}`);
  if (!response.ok) {
    console.error('Failed to load dashboard', await response.text());
    return;
  }
  const data = await response.json();
  renderDashboard(data);
  clearAlertBanner();
}

function clearAlertBanner() {
  alertBanner.hidden = true;
  alertBanner.textContent = '';
}

function renderAlertBanner(data, newAlerts) {
  const alertMessages = [];

  META.forEach((macro) => {
    const value = data[macro.key];
    if (!value) return;
    if (value.tier === 'red') {
      const over = value.consumed - value.target;
      alertMessages.push(`${macro.label} exceeded by ${over}${macro.unit} after your last order.`);
    } else if (value.tier === 'yellow') {
      alertMessages.push(`${macro.label} is almost there at ${value.percent}% of target.`);
    }
  });

  if (alertMessages.length > 0) {
    alertBanner.hidden = false;
    alertBanner.innerHTML = alertMessages.map((message) => `<div>${message}</div>`).join('');
  } else {
    clearAlertBanner();
  }
}

async function submitOrder(event) {
  event.preventDefault();
  if (isSubmittingOrder) {
    return;
  }

  isSubmittingOrder = true;
  submitButton.disabled = true;

  const payload = {
    user_id: document.getElementById('user_id').value,
    calories: document.getElementById('calories').value,
    protein_g: document.getElementById('protein_g').value,
    carbs_g: document.getElementById('carbs_g').value,
    fats_g: document.getElementById('fats_g').value,
  };

  const response = await fetch('/api/orders/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    alert(`Failed to simulate order: ${error.error || 'unknown error'}`);
    isSubmittingOrder = false;
    submitButton.disabled = false;
    return;
  }

  const result = await response.json();
  renderDashboard(result.totals);
  renderAlertBanner(result.totals, result.new_alerts);

  if (result.new_alerts && result.new_alerts.length > 0) {
    result.new_alerts.forEach(showToast);
  } else {
    showToast({
      tier: 'green',
      message: 'Order simulated successfully — dashboard updated.',
    });
  }

  isSubmittingOrder = false;
  submitButton.disabled = false;
}

async function resetTodayLog() {
  const payload = {
    user_id: document.getElementById('user_id').value,
  };

  const response = await fetch('/api/daily-log/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    alert(`Failed to reset today's log: ${error.error || 'unknown error'}`);
    return;
  }

  await response.json();
  const today = new Date().toISOString().slice(0, 10);
  await fetchDashboard(payload.user_id, today);
  showToast({ tier: 'green', message: 'Today\'s log has been reset.' });
}

orderForm.addEventListener('submit', submitOrder);
const resetButton = document.getElementById('reset-button');
resetButton.addEventListener('click', resetTodayLog);

const today = new Date().toISOString().slice(0, 10);
fetchDashboard(1, today);
