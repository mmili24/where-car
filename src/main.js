// ================================================
//  MAIN - Entry point
// ================================================

import './style.css';
import 'leaflet/dist/leaflet.css';

import { initTabs }    from './modules/ui.js';
import { initMap, resizeMap } from './modules/map.js';
import { initCamera, stopCamera } from './modules/camera.js';
import { initHistory } from './modules/history.js';
import { showToast }   from './modules/ui.js';

// -----------------------------------------------
// SPLASH → APP
// -----------------------------------------------
function showApp() {
  const splash = document.getElementById('splash');
  const app    = document.getElementById('app');

  setTimeout(() => {
    splash?.classList.add('fade-out');
    splash?.addEventListener('transitionend', () => {
      splash.style.display = 'none';
    }, { once: true });

    app?.classList.remove('hidden');
    showToast('👋 On he aparcat? Llest!', 'info');
  }, 2000);
}

// -----------------------------------------------
// INIT
// -----------------------------------------------
function init() {
  showApp();

  // Tabs
  initTabs((tabId) => {
    console.log('[Nav] Tab actiu:', tabId);
    if (tabId === 'map') setTimeout(resizeMap, 50);
    if (tabId !== 'camera') stopCamera();
  });

  // Mòduls
  initMap();
  initCamera();
  initHistory();

  // PWA instal·lació
  window.addEventListener('appinstalled', () => {
    showToast('🎉 App instal·lada al teu mòbil!', 'success');
  });
}

// -----------------------------------------------
// START
// -----------------------------------------------
document.addEventListener('DOMContentLoaded', init);