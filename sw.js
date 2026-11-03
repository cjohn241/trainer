// sw.js — the service worker. It saves a copy of every app file on the
// phone, so the app opens with no internet. (A service worker is a small
// script Chrome runs in the background for an installed web app.)
//
// WHEN YOU CHANGE ANY APP FILE: bump CACHE_NAME (v1 -> v2), and set
// version in js/version.js to match. The phone then downloads the new
// files the next time it's online, and uses them from the next launch.
// Your workouts (in IndexedDB) are not touched.
//
// The Bard's Tongue lives at the same GitHub Pages address and shares the
// same cache shelf, so this file only ever deletes caches whose names
// start with 'brawnforge-'.

const CACHE_PREFIX = 'brawnforge-';
const CACHE_NAME = 'brawnforge-v4';
const FONT_CACHE = 'brawnforge-fonts';

const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/version.js',
  './js/db.js',
  './js/ui.js',
  './js/data/tuning.js',
  './js/data/equipment.js',
  './js/data/evidence.js',
  './js/data/exercises.js',
  './js/data/templates.js',
  './js/data/loot.js',
  './js/data/walks.js',
  './js/data/links.js',
  './js/data/sprites.js',
  './js/sprite.js',
  './js/plates.js',
  './js/xp.js',
  './js/progress.js',
  './js/campfire.js',
  './js/today.js',
  './js/backup.js',
  './js/someday.js',
  './js/home.js',
  './js/workout.js',
  './js/walk.js',
  './js/done.js',
  './js/settings.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
];

// Install: download and save every app file. cache: 'reload' skips Chrome's
// short-term memory, so a new version never saves an old copy of a file.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete OUR copies from older versions (fonts are kept, other apps' caches are left alone).
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names
        .filter((n) => n.startsWith(CACHE_PREFIX) && n !== CACHE_NAME && n !== FONT_CACHE)
        .map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Fetch: answer from the saved copy first; fall back to the network.
// Anything fetched from the network is saved too, so if the saved copy
// ever goes missing, the app refills it the next time it's online.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!isFont && url.origin !== self.location.origin) return;

  const shelf = isFont ? FONT_CACHE : CACHE_NAME;
  event.respondWith(
    caches.open(shelf).then((cache) =>
      cache.match(event.request, { ignoreSearch: true }).then((saved) => saved || fetch(event.request).then((res) => {
        if (res.ok || res.type === 'opaque') cache.put(event.request, res.clone());
        return res;
      })))
  );
});
