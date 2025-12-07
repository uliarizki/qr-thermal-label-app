// src/utils/history.js
// Utility untuk manage history di localStorage

const HISTORY_KEY = 'qr:history';
const MAX_HISTORY = 100; // maksimal 100 item history

/**
 * Tambah history baru
 * @param {string} action - 'ADD', 'SEARCH', atau 'SCAN'
 * @param {object} details - detail action
 */
export function addHistory(action, details = {}) {
  if (typeof window === 'undefined') return;

  try {
    const history = getHistory();
    const newItem = {
      timestamp: new Date().toISOString(),
      action,
      details,
    };

    // Tambah di awal array (terbaru di atas)
    history.unshift(newItem);

    // Batasi jumlah history
    if (history.length > MAX_HISTORY) {
      history.splice(MAX_HISTORY);
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving history:', error);
  }
}

/**
 * Ambil semua history
 * @returns {Array}
 */
export function getHistory() {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading history:', error);
    return [];
  }
}

/**
 * Filter history berdasarkan action
 * @param {string} action - 'ADD', 'SEARCH', 'SCAN', atau 'ALL'
 * @returns {Array}
 */
export function filterHistoryByAction(action) {
  const history = getHistory();
  if (action === 'ALL') return history;
  return history.filter(item => item.action === action);
}

/**
 * Clear semua history
 */
export function clearHistory() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}

/**
 * Format timestamp untuk display
 * @param {string} isoString
 * @returns {string}
 */
export function formatTimestamp(isoString) {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;

    // Format lengkap untuk lebih dari 7 hari
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return isoString;
  }
}


