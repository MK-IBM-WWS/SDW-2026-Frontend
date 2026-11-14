import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { resolveConfig, transformWithEsbuild } from 'vite';

async function check(mode, hostname, expected) {
  const config = await resolveConfig({ mode }, 'build', mode);
  const source = readFileSync('src/modules/environment.ts', 'utf8');
  const result = await transformWithEsbuild(source, 'environment.ts', {
    format: 'cjs', define: { ...config.define, 'import.meta.env.BASE_URL': JSON.stringify('/repo/') },
  });
  const module = { exports: {} };
  runInNewContext(result.code, { module, exports: module.exports, window: { location: { hostname } } });
  assert.equal(module.exports.MOCK_ONLY, expected, `${mode}, host=${hostname}`);
  assert.equal(module.exports.publicAsset('/media/example.jpg'), '/repo/media/example.jpg');
  console.log(`PASS mode=${mode}, host=${hostname}, mock=${expected}`);
}
await check('pages', 'example.org', true);
await check('production', 'localhost', false);
await check('production', '192.168.10.104', false);
// Защита от публикации обычной сборки на стандартном домене Pages.
await check('production', 'boris.github.io', true);
await check('production', 'github.io.example.org', false);
