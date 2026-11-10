/* Общий service worker: оболочка приложения работает офлайн. Данные Supabase и /api не кэшируются. */
const VER = 'osh-v1', SHELL = self.SHELL || [];
self.addEventListener('install', e => { e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL.concat(['/shared/style.css', '/shared/theme-init.js', '/shared/catalog.js', '/shared/core.js', '/icons/icon-192.png']))).catch(() => {}).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const CDN = /(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com)$/;
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const ext = CDN.test(u.hostname) || /tile\.openstreetmap\.org$/.test(u.hostname);
  if (u.pathname.startsWith('/api/') || u.pathname === '/config.js' || /supabase\.co$/.test(u.hostname)) return;
  if (u.origin !== location.origin && !ext) return;
  if (ext) {
    e.respondWith(caches.open(VER).then(c => c.match(r).then(m => { const f = fetch(r).then(x => { if (x && (x.ok || x.type === 'opaque')) c.put(r, x.clone()); return x; }).catch(() => m); return m || f; })));
    return;
  }
  e.respondWith(fetch(r).then(x => { if (x.ok) { const cp = x.clone(); caches.open(VER).then(c => c.put(r, cp)); } return x; }).catch(() => caches.match(r).then(m => m || caches.match(self.SHELL[0] || '/'))));
});
