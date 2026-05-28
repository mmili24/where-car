// ================================================
//  STORAGE - Persistència amb localStorage
// ================================================

const STORAGE_KEY  = 'parking_history';
const CURRENT_KEY  = 'parking_current';

// -----------------------------------------------
// HISTORIAL (llista de tots els aparcaments)
// -----------------------------------------------
export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveToHistory(parking) {
  const history = getHistory();
  history.unshift(parking); // Nou primer
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function deleteFromHistory(id) {
  const history = getHistory().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

// -----------------------------------------------
// APARCAMENT ACTUAL (el més recent, destacat al mapa)
// -----------------------------------------------
export function getCurrentParking() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_KEY) ?? 'null');
  } catch {
    return null;
  }
}

export function saveCurrentParking(parking) {
  localStorage.setItem(CURRENT_KEY, JSON.stringify(parking));
}

export function clearCurrentParking() {
  localStorage.removeItem(CURRENT_KEY);
}