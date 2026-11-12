import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { isIP } from 'node:net';
import { join } from 'node:path';
const ip = process.argv[2];
if (!ip || !isIP(ip)) throw new Error('Укажите LAN IP ноутбука: npm run certs -- 192.168.1.10');
mkdirSync('certs', { recursive: true, mode: 0o700 });
execFileSync('mkcert', ['-install'], { stdio: 'inherit' });
execFileSync('mkcert', ['-key-file', 'certs/localhost-key.pem', '-cert-file', 'certs/localhost.pem', 'localhost', '127.0.0.1', '::1', ip], { stdio: 'inherit' });
const caRoot = execFileSync('mkcert', ['-CAROOT'], { encoding: 'utf8' }).trim();
// Только публичный сертификат CA для установки на телефон. Приватный CA-ключ не копируется.
copyFileSync(join(caRoot, 'rootCA.pem'), 'certs/local-ca.crt');
console.log(`Сертификат выпущен для ${ip}. На Android установите certs/local-ca.crt как сертификат ЦС.`);
