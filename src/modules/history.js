// ================================================
//  HISTORY - Historial d'aparcaments
// ================================================

import { showToast } from './ui.js';
import { getHistory, deleteFromHistory, clearHistory } from './storage.js';

let selectedParking = null;

// -----------------------------------------------
// INIT
// -----------------------------------------------
export function initHistory() {
  document.getElementById('clearHistoryBtn')
    ?.addEventListener('click', handleClearAll);

  document.getElementById('closeModalBtn')
    ?.addEventListener('click', closeModal);

  document.getElementById('modalOverlay')
    ?.addEventListener('click', closeModal);

  document.getElementById('modalDeleteBtn')
    ?.addEventListener('click', handleModalDelete);

  document.getElementById('modalNavigateBtn')
    ?.addEventListener('click', handleModalNavigate);

  // Escoltar nous aparcaments i fotos
  document.addEventListener('parking:saved',      () => renderHistory());
  document.addEventListener('parking:photo_added', () => renderHistory());
  document.addEventListener('parking:deleted',     () => renderHistory());

  // Render inicial
  renderHistory();
}

// -----------------------------------------------
// RENDER
// -----------------------------------------------
export function renderHistory() {
  const list  = document.getElementById('historyList');
  const empty = document.getElementById('historyEmpty');
  if (!list) return;

  const history = getHistory();

  // Eliminar items anteriors (mantenir empty state)
  list.querySelectorAll('.history-item').forEach(el => el.remove());

  if (history.length === 0) {
    empty?.classList.remove('hidden');
    return;
  }

  empty?.classList.add('hidden');

  history.forEach(parking => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      ${parking.photo
        ? `<img class="history-item-thumb" src="${parking.photo}" alt="foto"/>`
        : `<div class="history-item-thumb-placeholder">🅿️</div>`
      }
      <div class="history-item-info">
        <div class="history-item-title">${parking.address ?? 'Posició guardada'}</div>
        <div class="history-item-meta">📅 ${parking.timestamp}</div>
      </div>
      <span class="history-item-arrow">›</span>
    `;
    item.addEventListener('click', () => openModal(parking));
    list.appendChild(item);
  });
}

// -----------------------------------------------
// MODAL DETALL
// -----------------------------------------------
function openModal(parking) {
  selectedParking = parking;

  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const photo = document.getElementById('modalPhoto');
  const body  = document.getElementById('modalBody');

  if (!modal) return;

  if (title) title.textContent = parking.address ?? 'Aparcament guardat';

  if (photo) {
    if (parking.photo) {
      photo.src = parking.photo;
      photo.classList.remove('hidden');
    } else {
      photo.classList.add('hidden');
    }
  }

  if (body) {
    body.innerHTML = `
      <div class="modal-detail-row">
        <span class="modal-detail-icon">📅</span>
        <div>
          <div class="modal-detail-label">Data i hora</div>
          <div class="modal-detail-value">${parking.timestamp}</div>
        </div>
      </div>
      <div class="modal-detail-row">
        <span class="modal-detail-icon">📍</span>
        <div>
          <div class="modal-detail-label">Coordenades</div>
          <div class="modal-detail-value">${parking.lat.toFixed(6)}, ${parking.lng.toFixed(6)}</div>
        </div>
      </div>
      ${parking.address ? `
      <div class="modal-detail-row">
        <span class="modal-detail-icon">🏘️</span>
        <div>
          <div class="modal-detail-label">Adreça</div>
          <div class="modal-detail-value">${parking.address}</div>
        </div>
      </div>` : ''}
      ${parking.photo ? `
      <div class="modal-detail-row">
        <span class="modal-detail-icon">📷</span>
        <div>
          <div class="modal-detail-label">Foto</div>
          <div class="modal-detail-value">Disponible</div>
        </div>
      </div>` : ''}
    `;
  }

  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('detailModal')?.classList.add('hidden');
  selectedParking = null;
}

// -----------------------------------------------
// ACCIONS MODAL
// -----------------------------------------------
function handleModalDelete() {
  if (!selectedParking) return;

  deleteFromHistory(selectedParking.id);
  closeModal();
  renderHistory();
  showToast('🗑️ Aparcament eliminat', 'info');
}

function handleModalNavigate() {
  if (!selectedParking) return;

  const { lat, lng } = selectedParking;
  // Obrir Google Maps / Apple Maps / navegació nativa
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank');
}

// -----------------------------------------------
// NETEJAR TOT
// -----------------------------------------------
function handleClearAll() {
  if (getHistory().length === 0) {
    showToast('📭 Ja no hi ha aparcaments', 'info');
    return;
  }
  clearHistory();
  renderHistory();
  showToast('🗑️ Historial netejat', 'info');
}