// Сгенерировано при build. Кеш содержит только файлы этой сборки.
const VERSION = "87d509776e10db9a";
const FILES = ["assets/index-CHCe7s1L.js","assets/index-DmeMQrJN.css","assets/interface-background-DOnUA77F.png","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","images/interface-background.png","images/ram.png","index.html","manifest.webmanifest","media/aws_ec2_medium.jpg","media/aws_ec2_medium.mp4","media/azure_ai_medium.jpg","media/example.jpg","media/example.mp4","media/google_ai_max.jpg"];
const BASE = new URL('./', self.location.href);
const PREFIX = `tariffs-${BASE.pathname}-`;
const CACHE = PREFIX + VERSION;
const asset = (file) => new URL(file, BASE).href;
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES.map(asset))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((key) => key.startsWith(PREFIX) && key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

async function cachedRange(request, response) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '');
  if (!match || (!match[1] && !match[2])) return fetch(request);
  const data = await response.arrayBuffer();
  const start = match[1] ? Number(match[1]) : Math.max(0, data.byteLength - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), data.byteLength - 1) : data.byteLength - 1;
  if (start > end || start >= data.byteLength) return new Response(null, {
    status: 416, headers: { 'Content-Range': `bytes */${data.byteLength}` },
  });
  const headers = new Headers(response.headers);
  headers.set('Content-Range', `bytes ${start}-${end}/${data.byteLength}`);
  headers.set('Content-Length', String(end - start + 1));
  headers.set('Accept-Ranges', 'bytes');
  return new Response(data.slice(start, end + 1), { status: 206, headers });
}
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  // Авторизация, API и подписанные объекты MinIO всегда проходят в сеть.
  if (request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname) ||
      /^\/(api|s3)(\/|$)/.test(url.pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => response.ok ? response : caches.match(asset('index.html')))
      .catch(() => caches.match(asset('index.html'))));
    return;
  }
  event.respondWith(caches.open(CACHE).then(async (cache) => {
    const response = await cache.match(request.url);
    if (!response) return fetch(request);
    return request.headers.has('range') ? cachedRange(request, response) : response;
  }));
});
