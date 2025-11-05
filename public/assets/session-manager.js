// Session Manager: controla expiración por inactividad y cierre al cerrar la ventana
(function(){
  var INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos
  var timer = null;
  var lastActivity = Date.now();

  function clearSessionStorage() {
    try { sessionStorage.removeItem('ls_session'); } catch {}
    try { sessionStorage.removeItem('ledroitAuth'); } catch {}
  }

  function clearLocalSessionFallback() {
    // Por compatibilidad: aseguramos que no quede rastro en localStorage
    try { localStorage.removeItem('ls_session'); } catch {}
    try { localStorage.removeItem('ledroitAuth'); } catch {}
  }

  function doLogout(reason, redirectToLogin) {
    clearSessionStorage();
    clearLocalSessionFallback();
    try { window.ledroitAuth = null; } catch {}
    try { window.dispatchEvent(new CustomEvent('sessionChanged', { detail: null })); } catch {}
    // Si se solicita redirección, llevar al login
    if (redirectToLogin) {
      try { window.location.replace('login.html'); } catch {}
    }
  }

  function resetTimer() {
    lastActivity = Date.now();
    if (timer) { clearTimeout(timer); }
    timer = setTimeout(function(){
      var idleFor = Date.now() - lastActivity;
      if (idleFor >= INACTIVITY_TIMEOUT_MS) {
        doLogout('inactivity', true);
      } else {
        resetTimer();
      }
    }, INACTIVITY_TIMEOUT_MS);
  }

  function start() {
    resetTimer();
    ['mousemove','mousedown','keydown','scroll','touchstart','click'].forEach(function(evt){
      window.addEventListener(evt, resetTimer, { passive: true });
    });
    // Al cerrar la pestaña/ventana, limpiar la sesión SOLO si está habilitado explícitamente.
    // Por defecto queda deshabilitado para permitir navegación interna entre páginas del mismo sistema
    // manteniendo la sesión en sessionStorage.
    try {
      var shouldClearOnUnload = !!window.SESSION_CLEAR_ON_UNLOAD;
      if (shouldClearOnUnload) {
        window.addEventListener('unload', function(){
          // Nota: unload no garantiza ejecuciones largas; operaciones sincronas de storage son suficientes
          clearSessionStorage();
          clearLocalSessionFallback();
        });
      }
    } catch {}
  }

  // Exponer API global
  window.SessionManager = {
    start: start,
    reset: resetTimer,
    logout: function(reason, redirectToLogin){ doLogout(reason, !!redirectToLogin); },
    INACTIVITY_TIMEOUT_MS: INACTIVITY_TIMEOUT_MS
  };

  // Arrancar automáticamente si hay sesión en sessionStorage
  try {
    var hasSession = !!sessionStorage.getItem('ls_session');
    if (hasSession) { start(); }
  } catch {}
})();