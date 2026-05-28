// ================================================
//  UI - Tabs, Toasts, GPS Status
// ================================================

// -----------------------------------------------
// TABS
// -----------------------------------------------
export function initTabs(onTabChange) {
  const buttons = document.querySelectorAll('.tab-btn');
  const sections = document.querySelectorAll('.tab-content');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;

      buttons.forEach(b  => b.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`tab-${tabId}`)?.classList.add('active');

      onTabChange?.(tabId);
    });
  });
}

// -----------------------------------------------
// TOASTS
// -----------------------------------------------
export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icons[type] ?? 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 3000);
}

// -----------------------------------------------
// GPS STATUS BADGE
// -----------------------------------------------
export function updateGpsStatus(online) {
  const badge = document.getElementById('gps-status');
  if (!badge) return;
  badge.className = `gps-badge ${online ? 'online' : 'offline'}`;
  badge.querySelector('span:last-child').textContent = online ? 'GPS actiu' : 'GPS';
}