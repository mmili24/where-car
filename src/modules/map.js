// ================================================
//  MAP - Leaflet + Geolocalització
// ================================================

import L from 'leaflet';
import { showToast, updateGpsStatus } from './ui.js';
import {
  getCurrentParking,
  saveCurrentParking,
  clearCurrentParking,
  saveToHistory,
} from './storage.js';

// Fix icones de Leaflet amb Vite (problema conegut)
import iconUrl       from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl     from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

// -----------------------------------------------
// ESTAT INTERN
// -----------------------------------------------
const mapState = {
  map:            null,
  userMarker:     null,   // Marcador posició actual
  parkingMarker:  null,   // Marcador cotxe aparcat
  userPosition:   null,   // { lat, lng }
  watchId:        null,
};

// Icona personalitzada per al cotxe
const carIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:42px; height:42px;
    background:#f59e0b;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:3px solid white;
    box-shadow:0 4px 16px rgba(245,158,11,0.5);
    display:flex; align-items:center; justify-content:center;
  "><div style="transform:rotate(45deg); font-size:18px; line-height:1;">🚗</div></div>`,
  iconSize:   [42, 42],
  iconAnchor: [21, 42],
  popupAnchor:[0, -44],
});

// Icona per a la posició de l'usuari
const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px; height:18px;
    background:#38bdf8;
    border-radius:50%;
    border:3px solid white;
    box-shadow:0 0 0 4px rgba(56,189,248,0.25);
  "></div>`,
  iconSize:   [18, 18],
  iconAnchor: [9, 9],
});

// -----------------------------------------------
// INIT
// -----------------------------------------------
export function initMap() {
  // Crear mapa Leaflet
  mapState.map = L.map('leaflet-map', {
    center:            [41.3874, 2.1686], // Barcelona per defecte
    zoom:              15,
    zoomControl:       true,
    attributionControl: true,
  });

  // Tiles OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapState.map);

  // Botons
  document.getElementById('saveLocationBtn')
    ?.addEventListener('click', handleSaveLocation);

  document.getElementById('goToCarBtn')
    ?.addEventListener('click', handleGoToCar);

  document.getElementById('deleteParkingBtn')
    ?.addEventListener('click', handleDeleteParking);

  // Carregar aparcament guardat (si n'hi ha)
  loadSavedParking();

  // Iniciar seguiment GPS
  startGeolocation();

  // Escoltar foto capturada → afegir-la a l'aparcament actual
  document.addEventListener('photo:captured', (e) => {
    attachPhotoToParking(e.detail.dataUrl);
  });

  // Fix mida mapa: quan la finestra canvia de mida
  window.addEventListener('resize', () => mapState.map.invalidateSize());

  // Fix mida inicial (el contenidor pot no estar pintat encara)
  setTimeout(() => mapState.map.invalidateSize(), 300);
}

// -----------------------------------------------
// RESIZE (cridat des de main.js en canviar de tab)
// -----------------------------------------------
export function resizeMap() {
  mapState.map?.invalidateSize();
}

// -----------------------------------------------
// GEOLOCALITZACIÓ
// -----------------------------------------------
function startGeolocation() {
  if (!('geolocation' in navigator)) {
    showToast('❌ GPS no disponible en aquest dispositiu', 'error');
    return;
  }

  // Primera posició ràpida
  navigator.geolocation.getCurrentPosition(onPosition, onGpsError, {
    enableHighAccuracy: true,
    timeout: 10000,
  });

  // Seguiment continu
  mapState.watchId = navigator.geolocation.watchPosition(onPosition, onGpsError, {
    enableHighAccuracy: true,
    maximumAge:         5000,
  });
}

function onPosition(pos) {
  const { latitude: lat, longitude: lng, accuracy } = pos.coords;
  mapState.userPosition = { lat, lng };

  updateGpsStatus(true);

  // Actualitzar o crear marcador d'usuari
  if (mapState.userMarker) {
    mapState.userMarker.setLatLng([lat, lng]);
  } else {
    mapState.userMarker = L.marker([lat, lng], { icon: userIcon })
      .addTo(mapState.map)
      .bindPopup(`📍 Estàs aquí<br><small>Precisió: ±${Math.round(accuracy)}m</small>`);

    // Centrar el mapa la primera vegada
    mapState.map.setView([lat, lng], 17);
  }
}

function onGpsError(err) {
  updateGpsStatus(false);
  console.warn('[GPS]', err.message);
  if (err.code === 1) showToast('🚫 Permís GPS denegat', 'error');
}

// -----------------------------------------------
// GUARDAR APARCAMENT
// -----------------------------------------------
function handleSaveLocation() {
  if (!mapState.userPosition) {
    showToast('⏳ Esperant senyal GPS...', 'warning');
    return;
  }

  const { lat, lng } = mapState.userPosition;
  const now = new Date();

  const parking = {
    id:        Date.now(),
    lat,
    lng,
    timestamp: now.toLocaleString('ca-ES'),
    isoDate:   now.toISOString(),
    photo:     null, // S'afegirà si es fa foto
    address:   null, // Es resoldrà per geocoding invers
  };

  // Geocoding invers per obtenir l'adreça (Nominatim, gratuït)
  fetchAddress(lat, lng).then(address => {
    parking.address = address;
    saveCurrentParking(parking);
    saveToHistory({ ...parking });
    renderParkingMarker(parking);
    updateParkingCard(parking);
    showToast('✅ Aparcament guardat!', 'success');

    // Habilitar botó "on és el meu cotxe?"
    const goBtn = document.getElementById('goToCarBtn');
    if (goBtn) goBtn.disabled = false;

    // Emetre event per a l'historial
    document.dispatchEvent(new CustomEvent('parking:saved', { detail: parking }));
  });
}

// -----------------------------------------------
// GEOCODING INVERS (Nominatim)
// -----------------------------------------------
async function fetchAddress(lat, lng) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ca`,
      { headers: { 'User-Agent': 'ParkingPWA/1.0' } }
    );
    const data = await res.json();
    const addr = data.address ?? {};
    const parts = [
      addr.road ?? addr.pedestrian ?? addr.path,
      addr.house_number,
      addr.suburb ?? addr.neighbourhood ?? addr.quarter,
      addr.city    ?? addr.town ?? addr.village,
    ].filter(Boolean);
    return parts.join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// -----------------------------------------------
// MOSTRAR MARCADOR DEL COTXE
// -----------------------------------------------
function renderParkingMarker(parking) {
  // Eliminar marcador anterior
  if (mapState.parkingMarker) {
    mapState.parkingMarker.remove();
  }

  mapState.parkingMarker = L.marker([parking.lat, parking.lng], { icon: carIcon })
    .addTo(mapState.map)
    .bindPopup(`
      <strong>🚗 El teu cotxe</strong><br>
      <small>${parking.timestamp}</small><br>
      ${parking.address ? `<small>📍 ${parking.address}</small>` : ''}
    `);
}

// -----------------------------------------------
// ANAR AL COTXE (centrar mapa)
// -----------------------------------------------
function handleGoToCar() {
  const parking = getCurrentParking();
  if (!parking) return;

  mapState.map.flyTo([parking.lat, parking.lng], 18, {
    animate: true,
    duration: 1.2,
  });

  mapState.parkingMarker?.openPopup();
}

// -----------------------------------------------
// ELIMINAR APARCAMENT ACTUAL
// -----------------------------------------------
export function handleDeleteParking() {
  clearCurrentParking();

  if (mapState.parkingMarker) {
    mapState.parkingMarker.remove();
    mapState.parkingMarker = null;
  }

  document.getElementById('parkingCard')?.classList.add('hidden');
  document.getElementById('goToCarBtn')?.setAttribute('disabled', '');

  showToast('🗑️ Aparcament eliminat', 'info');

  document.dispatchEvent(new CustomEvent('parking:deleted'));
}

// -----------------------------------------------
// CÀRREGA INICIAL
// -----------------------------------------------
function loadSavedParking() {
  const parking = getCurrentParking();
  if (!parking) return;

  renderParkingMarker(parking);
  updateParkingCard(parking);

  const goBtn = document.getElementById('goToCarBtn');
  if (goBtn) goBtn.disabled = false;

  mapState.map.setView([parking.lat, parking.lng], 16);
}

// -----------------------------------------------
// TARGETA D'APARCAMENT (UI)
// -----------------------------------------------
function updateParkingCard(parking) {
  const card   = document.getElementById('parkingCard');
  const title  = document.getElementById('parkingCardTitle');
  const time   = document.getElementById('parkingCardTime');
  const details = document.getElementById('parkingCardDetails');

  if (!card) return;

  if (title)  title.textContent = parking.address ?? 'Aparcament guardat';
  if (time)   time.textContent  = parking.timestamp;

  if (details) {
    details.innerHTML = `
      <div class="parking-detail-chip">📅 ${parking.timestamp.split(',')[0] ?? parking.timestamp}</div>
      <div class="parking-detail-chip">🌐 ${parking.lat.toFixed(5)}, ${parking.lng.toFixed(5)}</div>
      ${parking.photo ? '<div class="parking-detail-chip">📷 Foto guardada</div>' : ''}
    `;

    // Afegir miniatura de foto si n'hi ha
    const existingPhoto = details.querySelector('.parking-card-photo');
    if (parking.photo && !existingPhoto) {
      const img = document.createElement('img');
      img.className = 'parking-card-photo';
      img.src       = parking.photo;
      img.alt       = 'Foto del parking';
      details.parentElement.appendChild(img);
    }
  }

  card.classList.remove('hidden');
}

// -----------------------------------------------
// AFEGIR FOTO A L'APARCAMENT ACTUAL
// -----------------------------------------------
function attachPhotoToParking(dataUrl) {
  const parking = getCurrentParking();
  if (!parking) {
    showToast('💡 Guarda primer l\'aparcament al mapa!', 'warning');
    return;
  }

  parking.photo = dataUrl;
  saveCurrentParking(parking);

  // Actualitzar també a l'historial
  const history = JSON.parse(localStorage.getItem('parking_history') ?? '[]');
  const idx     = history.findIndex(p => p.id === parking.id);
  if (idx !== -1) {
    history[idx].photo = dataUrl;
    localStorage.setItem('parking_history', JSON.stringify(history));
  }

  // Actualitzar targeta
  updateParkingCard(parking);

  showToast('📷 Foto afegida a l\'aparcament!', 'success');
  document.dispatchEvent(new CustomEvent('parking:photo_added', { detail: parking }));
}