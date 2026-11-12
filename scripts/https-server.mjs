import { createServer } from 'node:https';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { createReadStream, readFileSync, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';

const root = resolve('dist');
const port = Number(process.env.PORT || 3000);
const api = new URL(process.env.API_TARGET || 'http://127.0.0.1:8080');
const s3 = new URL(process.env.S3_TARGET || 'http://127.0.0.1:9000');
const signedHost = process.env.S3_SIGNED_HOST || 'localhost:9000';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm' };
const fail = (res, code, message) => {
  if (res.headersSent) { res.destroy(); return; }
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify({ status: 'fail', message }));
};
function proxy(req, res, target, media) {
  const headers = { ...req.headers, host: media ? signedHost : target.host,
    'x-forwarded-proto': 'https', 'x-forwarded-host': req.headers.host, 'x-forwarded-for': req.socket.remoteAddress };
  const path = media ? req.url.replace(/^\/s3/, '') : req.url;
  const upstream = (target.protocol === 'https:' ? httpsRequest : httpRequest)({
    protocol: target.protocol, hostname: target.hostname, port: target.port,
    method: req.method, path, headers,
  }, (incoming) => {
    const responseHeaders = { ...incoming.headers, 'cache-control': 'no-store' };
    // Secure cookie сохраняется даже при HTTP между прокси и Go.
    if (incoming.headers['set-cookie']) responseHeaders['set-cookie'] = incoming.headers['set-cookie'].map(
      (cookie) => /;\s*secure(?:;|$)/i.test(cookie) ? cookie : `${cookie}; Secure`);
    res.writeHead(incoming.statusCode || 502, responseHeaders);
    incoming.on('error', () => res.destroy());
    incoming.pipe(res);
  });
  upstream.setTimeout(60000, () => upstream.destroy(new Error('upstream timeout')));
  upstream.on('error', () => fail(res, 503, 'Бэкенд недоступен'));
  req.on('aborted', () => upstream.destroy());
  res.on('close', () => { if (!res.writableEnded) upstream.destroy(); });
  req.pipe(upstream);
}
const server = createServer({
  key: readFileSync(process.env.TLS_KEY || 'certs/localhost-key.pem'),
  cert: readFileSync(process.env.TLS_CERT || 'certs/localhost.pem'),
  minVersion: 'TLSv1.2',
}, (req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'https://localhost').pathname); }
  catch { fail(res, 400, 'Некорректный URL'); return; }
  if (/^\/api(?:\/|$)/.test(pathname)) { proxy(req, res, api, false); return; }
  if (pathname.startsWith('/s3/')) { proxy(req, res, s3, true); return; }
  if (!['GET', 'HEAD'].includes(req.method)) { fail(res, 405, 'Метод не поддерживается'); return; }
  let file = resolve(root, `.${pathname}`);
  if (pathname.includes('\0') || (file !== root && !file.startsWith(root + sep))) { fail(res, 403, 'Запрещено'); return; }
  let stats;
  try {
    stats = statSync(file);
    if (stats.isDirectory()) { file = resolve(file, 'index.html'); stats = statSync(file); }
  } catch {
    // HTML fallback только для маршрутов SPA; отсутствие SW или медиа не маскируется HTML.
    if (!req.headers.accept?.includes('text/html') || extname(pathname)) { fail(res, 404, 'Файл не найден'); return; }
    file = resolve(root, 'index.html');
    try { stats = statSync(file); } catch { fail(res, 503, 'Сначала выполните npm run build'); return; }
  }
  const headers = { 'Content-Type': mime[extname(file)] || 'application/octet-stream',
    'Content-Length': stats.size, 'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff',
    'Cache-Control': file.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache' };
  const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  let start = 0, end = stats.size - 1;
  if (match && (match[1] || match[2])) {
    start = match[1] ? Number(match[1]) : Math.max(0, stats.size - Number(match[2]));
    end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
    if (start > end || start >= stats.size) {
      res.writeHead(416, { 'Content-Range': `bytes */${stats.size}` }); res.end(); return;
    }
    headers['Content-Range'] = `bytes ${start}-${end}/${stats.size}`;
    headers['Content-Length'] = end - start + 1;
  }
  res.writeHead(match ? 206 : 200, headers);
  if (req.method === 'HEAD') res.end();
  else createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
});
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
server.listen(port, process.env.HOST || '0.0.0.0', () => console.log(
  `HTTPS :${port}; /api → ${api.origin}; /s3 → ${s3.origin}; S3 Host=${signedHost}`));
