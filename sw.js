const CACHE_NAME = 'savage-master-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/creation-workshop.css',
  '/creation-notice.js',
  '/app.js',
  '/data.js',
  '/settings.js',
  '/manifest.json',
  '/logo.png',
  /* BUILD_ASSETS */
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];
const SHELL_PAGES = ['/', '/index.html', '/create.html', '/dnd.html', '/pathfinder.html', '/campaigns.html', '/profile.html', '/chronicles.html', '/builder.html', '/pricing.html', '/support.html', '/settings.html', '/install.html'];
function shellPath(path) {
  const normalized = path.replace(/\/$/, '') || '/';
  if (SHELL_PAGES.includes(normalized)) return normalized === '/' ? '/index.html' : normalized;
  return SHELL_PAGES.includes(normalized + '.html') ? normalized + '.html' : null;
}
function staticPath(path) {
  return ASSETS_TO_CACHE.includes(path) || /^(?:\/assets\/|\/icons\/|\/fonts\/|\/images\/).+\.(?:js|css|woff2?|png|webp|jpe?g|svg)$/.test(path);
}

// Install — pre-cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll([...new Set(ASSETS_TO_CACHE)]))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith('savage-master-') && k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', event => {
  // Cache app shells and public static files, never API responses or shared posts.
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const page = shellPath(url.pathname);
  if (!page && !staticPath(url.pathname)) return;
  const key = page || url.pathname;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(key, clone)).catch(() => {}));
        }
        return response;
      })
      .catch(async () => (await caches.match(key)) || Response.error())
  );
});
