import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function buildPages(repoArgument) {
  let repo = repoArgument || process.env.GITHUB_REPOSITORY?.split('/').pop();
  if (!repo) {
    try { repo = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim().split('/').pop().replace(/\.git$/, ''); }
    catch { throw new Error('Укажите имя репозитория: npm run build:pages -- cloud-tariffs-lab7'); }
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(repo) || repo === '.' || repo === '..') throw new Error('Некорректное имя репозитория');
  const base = repo.toLowerCase().endsWith('.github.io') ? '/' : `/${repo}/`;
  execFileSync(process.execPath, ['scripts/check-environment.mjs'], { stdio: 'inherit' });
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-b'], { stdio: 'inherit' });
  execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--mode', 'pages', '--outDir', 'dist-pages'], {
    stdio: 'inherit', env: { ...process.env, BASE_PATH: base },
  });
  console.log(`Pages: mock only; base=${base}; каталог dist-pages`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) buildPages(process.argv[2]);
