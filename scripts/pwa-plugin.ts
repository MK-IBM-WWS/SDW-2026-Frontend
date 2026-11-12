import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

// По ручному варианту методички: manifest + собственный service worker.
export function tariffPwa(): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'tariff-pwa', apply: 'build', enforce: 'post',
    configResolved(value) { config = value; },
    closeBundle() {
      const out = resolve(config.root, config.build.outDir);
      const walk = (dir: string): string[] => readdirSync(join(out, dir), { withFileTypes: true })
        .flatMap((entry) => entry.isDirectory() ? walk(`${dir}${entry.name}/`) : [`${dir}${entry.name}`]);
      const files = walk('').filter((file) => !['serviceWorker.js', '404.html'].includes(file));
      const digest = createHash('sha256');
      files.sort().forEach((file) => { digest.update(file); digest.update(readFileSync(join(out, file))); });
      const version = digest.digest('hex').slice(0, 16);
      const template = readFileSync(resolve(config.root, 'scripts/service-worker.template.js'), 'utf8');
      writeFileSync(join(out, 'serviceWorker.js'), template
        .replace('__VERSION__', JSON.stringify(version))
        .replace('__PRECACHE__', JSON.stringify(files)));
      // Pages не имеет SPA fallback: 404 переводит deep link в существующий index.html.
      const base = JSON.stringify(config.base);
      writeFileSync(join(out, '404.html'), `<!doctype html><html lang="ru"><meta charset="utf-8"><title>Переход к приложению</title><script>
        const base = ${base};
        location.replace(base + '?__spa=' + encodeURIComponent(location.pathname + location.search + location.hash));
      </script><a href="${config.base}">Открыть тарифы</a></html>`);
      writeFileSync(join(out, '.nojekyll'), '');
    },
  };
}
