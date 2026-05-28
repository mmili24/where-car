// ================================================
//  CAMERA - Foto de l'aparcament
// ================================================

import { showToast } from './ui.js';

const camState = {
  active:      false,
  facing:      'environment', // Càmera posterior per defecte
  stream:      null,
  pendingPhoto: null, // DataURL pendent de confirmar
};

// -----------------------------------------------
// INIT
// -----------------------------------------------
export function initCamera() {
  document.getElementById('captureBtn')
    ?.addEventListener('click', handleCapture);

  document.getElementById('switchCameraBtn')
    ?.addEventListener('click', handleSwitchCamera);

  document.getElementById('galleryHintBtn')
    ?.addEventListener('click', () => {
      // Navegar a l'historial
      document.querySelector('[data-tab="history"]')?.click();
    });

  // Preview: confirmar o descartar
  document.getElementById('confirmPhotoBtn')
    ?.addEventListener('click', confirmPhoto);

  document.getElementById('discardPhotoBtn')
    ?.addEventListener('click', discardPhoto);
}

// -----------------------------------------------
// CAPTURAR FOTO
// -----------------------------------------------
async function handleCapture() {
  if (!camState.active) {
    await startCamera();
    return;
  }

  const video  = document.getElementById('videoFeed');
  const canvas = document.getElementById('photoCanvas');
  if (!canvas || !video) return;

  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');

  // Mirror si és frontal
  if (camState.facing === 'user') {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(video, 0, 0);
  triggerFlash();

  camState.pendingPhoto = canvas.toDataURL('image/jpeg', 0.90);

  // Mostrar preview
  showPreview(camState.pendingPhoto);
}

// -----------------------------------------------
// PREVIEW - CONFIRMAR / DESCARTAR
// -----------------------------------------------
function showPreview(dataUrl) {
  const preview = document.getElementById('photoPreview');
  const img     = document.getElementById('previewImg');
  if (!preview || !img) return;

  img.src = dataUrl;
  preview.classList.remove('hidden');
}

function confirmPhoto() {
  if (!camState.pendingPhoto) return;

  // Emetre event perquè map.js l'associï a l'aparcament actual
  document.dispatchEvent(new CustomEvent('photo:captured', {
    detail: { dataUrl: camState.pendingPhoto },
  }));

  hidePreview();
  camState.pendingPhoto = null;

  showToast('✅ Foto guardada!', 'success');

  // Anar al mapa per veure la targeta actualitzada
  setTimeout(() => {
    document.querySelector('[data-tab="map"]')?.click();
  }, 800);
}

function discardPhoto() {
  hidePreview();
  camState.pendingPhoto = null;
  showToast('🔄 Repeteix la foto', 'info');
}

function hidePreview() {
  document.getElementById('photoPreview')?.classList.add('hidden');
}

// -----------------------------------------------
// ARRANCAR CÀMERA
// -----------------------------------------------
async function startCamera() {
  try {
    camState.stream?.getTracks().forEach(t => t.stop());

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: camState.facing,
        width:  { ideal: 1280 },
        height: { ideal: 1280 },
      },
      audio: false,
    });

    const video = document.getElementById('videoFeed');
    if (!video) return;

    video.srcObject = stream;
    camState.stream = stream;
    camState.active = true;

    document.getElementById('noCamera')?.classList.add('hidden');

    showToast('📷 Càmera llesta!', 'success');
  } catch (err) {
    console.error('[Camera]', err);
    showToast('❌ No s\'ha pogut accedir a la càmera', 'error');
  }
}

// -----------------------------------------------
// CANVIAR CÀMERA
// -----------------------------------------------
async function handleSwitchCamera() {
  camState.facing = camState.facing === 'environment' ? 'user' : 'environment';
  if (camState.active) await startCamera();
  showToast(
    camState.facing === 'user' ? '🤳 Càmera frontal' : '📷 Càmera posterior',
    'info'
  );
}

// -----------------------------------------------
// FLASH
// -----------------------------------------------
function triggerFlash() {
  const flash = document.getElementById('flashOverlay');
  if (!flash) return;
  flash.classList.remove('flash');
  void flash.offsetWidth;
  flash.classList.add('flash');
}

// -----------------------------------------------
// NETEJAR (alliberar càmera en sortir del tab)
// -----------------------------------------------
export function stopCamera() {
  camState.stream?.getTracks().forEach(t => t.stop());
  camState.active = false;
  const video = document.getElementById('videoFeed');
  if (video) video.srcObject = null;
}