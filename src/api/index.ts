import axios from 'axios';
import { MOCK_ONLY } from '../modules/environment';
import { TariffsApi } from './generated/TariffsApi';

// Активный JWT хранится только в памяти. После F5 запросы снова гостевые.
// Копия в localStorage остаётся для показа токена в Application/Postman.
let activeTariffToken = '';
export function setActiveTariffToken(token: string) { activeTariffToken = token; }
export function getActiveTariffToken() { return activeTariffToken; }

export const tariffsApi = new TariffsApi({ baseURL: '/api', timeout: 20000, withCredentials: true });
tariffsApi.instance.interceptors.request.use((config) => {
  if (MOCK_ONLY) return Promise.reject(new Error('На GitHub Pages доступны только демонстрационные тарифы'));
  if (activeTariffToken) config.headers.set('Authorization', `Bearer ${activeTariffToken}`);
  return config;
});

// Авторизация и деавторизация — только прямой Axios, без thunk и кодогенерации.
export const tariffUserHttp = axios.create({ baseURL: '/api', timeout: 20000, withCredentials: true });

tariffUserHttp.interceptors.request.use((config) => {
  if (MOCK_ONLY) throw new Error('Для входа откройте приложение по HTTPS-адресу ноутбука');
  return config;
});

export function tariffErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || (error.response
      ? `Ошибка сервера: HTTP ${error.response.status}`
      : 'Нет связи с бэкендом. Проверьте, что сервер запущен.');
  }
  return error instanceof Error ? error.message : 'Не удалось выполнить запрос';
}

// Подписанная ссылка сохраняет путь объекта и всю query-строку.
// Node.js (HTTPS) или Vite (dev) направит /s3 к MinIO с исходным подписанным Host.
export function tariffMediaUrl(value: string | undefined): string {
  if (!value || value.startsWith('/static/media/')) return '';
  if (/^https?:\/\//.test(value)) {
    const url = new URL(value);
    return `/s3${url.pathname}${url.search}`;
  }
  return value;
}
