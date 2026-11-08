import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const s3Target = env.S3_TARGET || 'http://localhost:9000';
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', port: 3000, strictPort: true,
      proxy: {
        '/api': {
          target: env.API_TARGET || 'http://localhost:8080', changeOrigin: true,
          configure: (proxy) => proxy.on('error', (_error, _request, response) => {
            // Vite по умолчанию возвращает 500 при выключенном Go-сервере.
            // Отмечаем именно недоступность upstream кодом 503; настоящие
            // ответы API с 400/401/403/404/500 проходят без подмены.
            if ('writeHead' in response && !response.headersSent) {
              response.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
              response.end(JSON.stringify({ status: 'fail', message: 'Бэкенд недоступен' }));
            }
          }),
        },
        '/s3': {
          target: s3Target, changeOrigin: true,
          rewrite: (path) => path.replace(/^\/s3/, ''),
          // MinIO включает Host в подпись. В контейнере target может быть
          // host.docker.internal, но подписанный Host остаётся localhost:9000.
          configure: (proxy) => proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Host', env.S3_SIGNED_HOST || new URL(s3Target).host);
          }),
        },
      },
    },
  };
});
