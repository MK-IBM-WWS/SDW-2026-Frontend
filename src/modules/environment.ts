// Pages получает отдельную сборку: данные только mock, сетевых API-запросов нет.
export const MOCK_ONLY = import.meta.env.VITE_MOCK_ONLY === 'true';

// Vite подставляет /имя-репозитория/ для Pages и / для локального запуска.
export function publicAsset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
