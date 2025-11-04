// Utilities: normalization and helpers

export function normalizarIniciales(iniciales = '') {
  try {
    return String(iniciales).replace(/[a-zA-Z]/g, l => l.toUpperCase());
  } catch { return iniciales; }
}

export function limpiarFotoUrl(fotoUrl) {
  if (!fotoUrl) return null;
  return String(fotoUrl)
    .replace(/^[\s`'"]+|[\s`'"]+$/g, '')
    .replace(/[`\s]/g, '');
}

export function log(msg, type = 'info') {
  console[type === 'error' ? 'error' : 'log'](`[LC] ${msg}`);
}