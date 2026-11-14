// VITE_MOCK_ONLY передаётся как строка, как и обычные VITE_* env-переменные.
// Домен Pages дополнительно защищает от публикации обычной локальной сборки.
const hostedOnPages = typeof window !== 'undefined' && window.location.hostname.toLowerCase().endsWith('.github.io');
export const MOCK_ONLY = import.meta.env.VITE_MOCK_ONLY === 'true' || hostedOnPages;

// Vite подставляет /имя-репозитория/ для Pages и / для локального запуска.
export function publicAsset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
