window.toast = function(msg, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', info: '✦', warning: '⚠' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type] || '✦'}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'fadeOutToast 0.3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, duration);
};
