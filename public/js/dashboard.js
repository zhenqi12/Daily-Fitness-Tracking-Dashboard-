const dashboard = document.getElementById('dashboard');
const toastContainer = document.getElementById('toast-container');
const orderForm = document.getElementById('order-form');

const META = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fats', label: 'Fats', unit: 'g' },
];

function renderDashboard(data) {
  dashboard.innerHTML = META.map((macro) => {
    const macroData = data[macro.key];
    const percent = Math.min(100, macroData.percent);
    return `
      <article class="macro-card">
        <h3>${macro.label}</h3>
        <div class="macro-stats">
          <span>${macroData.consumed}${macro.unit}</span>
          <span>${macroData.target}${macro.unit}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${macroData.tier}" style="width: ${percent}%"></div>
        </div>
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
}

async function submitOrder(event) {
  event.preventDefault();
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
    return;
  }

  const result = await response.json();
  renderDashboard(result.totals);
  result.new_alerts.forEach(showToast);
}

orderForm.addEventListener('submit', submitOrder);

const today = new Date().toISOString().slice(0, 10);
fetchDashboard(1, today);
