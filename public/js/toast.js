// Simple toast system (no alerts) - Phase 1
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${getToastIcon(type)}</span>
      <span class="toast-message">${message}</span>
    </div>
  `;

  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 60);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 240);
  }, duration);
}

function getToastIcon(type) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  return icons[type] || icons.info;
}