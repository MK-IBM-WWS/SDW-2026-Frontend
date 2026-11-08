import axios from 'axios';
import { TariffsApi } from './generated/TariffsApi';

// Активный JWT хранится только в памяти. После F5 запросы снова гостевые.
// Копия в localStorage остаётся для показа токена в Application/Postman.
let activeTariffToken = '';
export function setActiveTariffToken(token: string) { activeTariffToken = token; }
export function getActiveTariffToken() { return activeTariffToken; }

export const tariffsApi = new TariffsApi({ baseURL: '/api', timeout: 20000, withCredentials: true });
tariffsApi.instance.interceptors.request.use((config) => {
  if (activeTariffToken) config.headers.set('Authorization', `Bearer ${activeTariffToken}`);
  return config;
});

// Авторизация и деавторизация — только прямой Axios, без thunk и кодогенерации.
export const tariffUserHttp = axios.create({ baseURL: '/api', timeout: 20000, withCredentials: true });

export function tariffErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || (error.response
      ? `Ошибка сервера: HTTP ${error.response.status}`
      : 'Нет связи с бэкендом. Проверьте, что сервер запущен.');
  }
  return error instanceof Error ? error.message : 'Не удалось выполнить запрос';
}

// Подписанная ссылка сохраняет путь объекта и всю query-строку.
// Vite направит /s3 к MinIO и выставит исходный Host, участвующий в подписи.
export function tariffMediaUrl(value: string | undefined): string {
  if (!value || value.startsWith('/static/media/')) return '';
  if (/^https?:\/\//.test(value)) {
    const url = new URL(value);
    return `/s3${url.pathname}${url.search}`;
  }
  return value;
}
