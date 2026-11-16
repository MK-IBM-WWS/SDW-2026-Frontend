import { writeFileSync, readFileSync } from 'node:fs';
import { isIP } from 'node:net';
const [ip,portText='8080']=process.argv.slice(2);
const port=Number(portText);
const bytes=ip?.split('.').map(Number);
const privateIP=bytes&&(bytes[0]===10||(bytes[0]===172&&bytes[1]>=16&&bytes[1]<=31)||(bytes[0]===192&&bytes[1]===168));
if(!ip||isIP(ip)!==4||!privateIP||!Number.isInteger(port)||port<1||port>65535){
 console.error('Использование: npm run native:configure -- IP_СЕРВЕРА [ПОРТ_API]\nНужен IPv4 локальной сети: 10.x.x.x, 172.16–31.x.x или 192.168.x.x; не localhost.');process.exit(1);
}
const apiOrigin=`http://${ip}:${port}`;
writeFileSync('src/native/target_config.json',JSON.stringify({apiOrigin},null,2)+'\n');
writeFileSync('src-tauri/capabilities/default.json',JSON.stringify({identifier:'default',description:'Read the configured LAN API',windows:['main'],permissions:['core:default',{identifier:'http:default',allow:[{url:`${apiOrigin}/api/native/**`}]}]},null,2)+'\n');
const path='src-tauri/tauri.conf.json';
const config=JSON.parse(readFileSync(path));
config.app.security.csp=`default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self' ipc: http://ipc.localhost ${apiOrigin} blob:; font-src 'self' data:; object-src 'none'; base-uri 'self'`;
writeFileSync(path,JSON.stringify(config,null,2)+'\n');
console.log(`API: ${apiOrigin}\nОбновлены target_config.json, HTTP permissions и CSP. Пересоберите Tauri после смены IP.`);
