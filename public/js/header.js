// Header loader for Phase 1: injects header.html and sets basic user info if available

export async function loadHeader(rootId = 'header-root') {
  try {
    const root = document.getElementById(rootId);
    if (!root) return;
    const res = await fetch('header.html', { cache: 'no-cache' });
    const html = await res.text();
    root.innerHTML = html;

    // Try to set user initials and name from local/session storage
    const ses = getLocalSession();
    const initials = ses?.iniciales || 'LC';
    const name = ses?.nombre || 'Usuario';
    const avatar = document.getElementById('avatar');
    const userName = document.getElementById('userName');
    if (avatar) avatar.textContent = (initials || 'LC').slice(0, 3).toUpperCase();
    if (userName) userName.textContent = name;
  } catch (err) {
    console.error('Header load error:', err);
  }
}

function getLocalSession() {
  try {
    // Priority: sessionStorage, then localStorage
    const s = sessionStorage.getItem('ls_session') || localStorage.getItem('ls_session');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

