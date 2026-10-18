/* NeonFitness Pro : permet d'ouvrir l'app sans réseau (salle de sport).
   Fichiers du site : réseau d'abord (les mises à jour arrivent tout de suite), copie locale si hors ligne.
   Bibliothèques Firebase et polices (versionnées) : copie locale d'abord.
   Les échanges avec Firebase (connexion, base de données) ne passent jamais par ce cache. */
const CACHE = "neonfitness-v1";
const SHELL = ["./", "./index.html", "./firebase-config.js", "./manifest.webmanifest", "./icon.svg", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const own = url.origin === self.location.origin;
  const lib = (url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/"))
           || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!own && !lib) return;
  if (own) {
    e.respondWith(fetch(req)
      .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./index.html"))));
  } else {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    })));
  }
});
