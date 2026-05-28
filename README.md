# 🅿️ On he aparcat?

Una **Progressive Web App (PWA)** per guardar on has aparcat el cotxe, amb mapa interactiu i foto del lloc.

🌐 **Demo en viu:** https://wherecar.netlify.app

---

## 📱 Funcionalitats

- **📍 Guardar ubicació** — Desa la posició GPS actual al mapa amb un sol toc
- **🗺️ Mapa interactiu** — Leaflet + OpenStreetMap, funciona offline gràcies al caché de Workbox
- **📷 Foto del parking** — Fes una foto per recordar la planta, el número o qualsevol referència
- **🏘️ Adreça automàtica** — Geocoding invers amb Nominatim (sense API key)
- **📋 Historial** — Llista de tots els aparcaments guardats amb foto i hora
- **🧭 Navegar** — Obre Google Maps per guiar-te fins al cotxe
- **📴 Offline first** — Les tiles del mapa es cachegen, l'app funciona sense connexió

---

## 🏗️ Arquitectura

Segueix el mateix patró modular de la PWA de referència (SensorCam):

```
where-car/
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── images/
│   │   └── screenshot.png
│   ├── favicon.svg
│   └── favicon.ico
├── src/
│   ├── modules/
│   │   ├── ui.js        → Tabs, Toasts, GPS badge
│   │   ├── map.js       → Leaflet, geolocalització, guardar/mostrar ubicació
│   │   ├── camera.js    → Càmera, captura i preview de foto
│   │   ├── storage.js   → Persistència amb localStorage
│   │   └── history.js   → Historial d'aparcaments i modal de detall
│   ├── main.js          → Entry point, splash, init mòduls
│   └── style.css        → Disseny complet (CSS custom properties)
├── index.html
├── vite.config.js       → Vite + VitePWA + mkcert
└── package.json
```

### Comunicació entre mòduls

```
camera.js  ──── CustomEvent('photo:captured') ────► map.js
map.js     ──── CustomEvent('parking:saved')  ────► history.js
map.js     ──── CustomEvent('parking:deleted')────► history.js
```

---

## 🛠️ Tecnologies

| Tecnologia | Ús |
|---|---|
| **Vite** | Bundler i servidor de desenvolupament |
| **vite-plugin-pwa** | Genera Service Worker i Web App Manifest |
| **vite-plugin-mkcert** | Certificats SSL locals per a HTTPS (necessari per GPS i càmera) |
| **Leaflet** | Mapa interactiu |
| **OpenStreetMap** | Tiles del mapa (gratuït, sense API key) |
| **Nominatim** | Geocoding invers per obtenir l'adreça (gratuït) |
| **Workbox** | Estratègies de caché (tiles OSM en CacheFirst) |
| **localStorage** | Persistència de l'aparcament actual i l'historial |

---

## 🚀 Instal·lació i ús

### Requisits
- [Bun](https://bun.sh/) instal·lat

### Desenvolupament

```bash
# Clonar el repositori
git clone https://github.com/mmili24/where-car.git
cd where-car

# Instal·lar dependències
bun install

# Arrancar el servidor de desenvolupament (HTTPS automàtic)
bun run dev
```

El servidor arrencarà a:
```
➜  Local:   https://localhost:3000/
➜  Network: https://192.168.x.x:3000/  ← Per provar al mòbil
```

> ⚠️ **Important:** La primera vegada, `mkcert` descarregarà el binari automàticament per generar el certificat SSL. El navegador pot mostrar un avís de connexió no privada — accepta-ho per continuar.

### Build i deploy

```bash
# Generar build i desplegar a Netlify
bun run build && netlify deploy --prod --dir dist
```

---

## 📐 Els 3 pilars PWA

### 1. Web App Manifest
Generat automàticament per `vite-plugin-pwa`. Defineix nom, icones, colors i comportament `standalone` (sense barra del navegador).

### 2. Service Worker
Generat per **Workbox** amb estratègies de caché:
- **CacheFirst** per a les tiles d'OpenStreetMap → funciona offline
- **StaleWhileRevalidate** per a Leaflet CSS
- **CacheFirst** per a imatges locals

### 3. HTTPS
Gestionat per `vite-plugin-mkcert`, que genera un certificat SSL de confiança per a la xarxa local. Necessari per accedir al GPS i a la càmera del dispositiu.

---

## 🗺️ Com funciona

1. L'app demana permís de **geolocalització** en carregar
2. El marcador blau mostra la teva posició actual en temps real
3. Prem **"Guardar aquí"** per desar l'aparcament → es crea el marcador 🚗 al mapa i es guarda a `localStorage`
4. Ves al tab **Foto** i fes una foto del lloc (planta, número, referència...)
5. La foto s'associa automàticament a l'aparcament actual
6. Des de l'**Historial** pots veure tots els aparcaments, navegar-hi o eliminar-los

---

## 👩‍💻 Autora

Mili — CFGS DAW, Institut MVM  
Pràctica PWA — Curs 2025–2026
