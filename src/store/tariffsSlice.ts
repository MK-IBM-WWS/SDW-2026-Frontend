import axios from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';
import type { Tariff } from '../types/tariff';
import { tariffsApi, tariffErrorMessage, tariffMediaUrl } from '../api';
import { getPublishedTariffs } from '../modules/mock';
import { PRICE_STEPS } from '../modules/priceFilter';
import { MOCK_ONLY } from '../modules/environment';
import { readListPreferences } from './listPreferences';
import { tariffUserLoggedIn, tariffUserLoggedOut } from './userSlice';

export interface FeedMeta {
 session_id?: string; redis_key?: string; batch_id?: string; batch_start?: number; batch_size?: number; position?: number;
}
interface TariffsState {
 currentPage: number; pageSize: number; total: number; totalPages: number;
 queryMS: number | null; indexEnabled: boolean | null;
 feedMeta: FeedMeta | null; feedReady: boolean;
  selectedPriceStep: number;
  appliedPriceStep: number;
  items: Tariff[];
  feed: Tariff | null;
  draft: Tariff | null;
  listSource: 'api' | 'mock';
  feedSource: 'api' | 'mock';
  listRequest?: string;
  feedRequest?: string;
  draftRequest?: string;
  draftReady: boolean;
  listReady: boolean;
}
const initialState: TariffsState = {
  pageSize: 10, total: 0, totalPages: 0, queryMS: null, indexEnabled: null,
 feedMeta: null, feedReady: false,
 ...readListPreferences(), items: [], feed: null, draft: null,
  listSource: 'api', feedSource: 'api', draftReady: false, listReady: false,
};
type ThunkConfig = { state: RootState; rejectValue: string };
const tariffThunk = createAsyncThunk.withTypes<ThunkConfig>();

// Swagger описывает поля как optional. Проверяем обязательные данные ответа.
function normalizeTariff(value: Partial<Tariff>): Tariff {
  if (!value.tariff_id || !value.tariff_name || !value.tariff_status)
    throw new Error('Бэкенд вернул некорректный тариф');
  return {
    tariff_id: value.tariff_id, tariff_name: value.tariff_name,
    tariff_status: value.tariff_status, short_description: value.short_description ?? '',
    price_per_month: value.price_per_month ?? 0, ram_gb: value.ram_gb ?? 0,
    like_count: value.like_count ?? 0, is_owner: value.is_owner ?? 0, is_liked: value.is_liked ?? 0,
    image_url: tariffMediaUrl(value.image_url), video_url: tariffMediaUrl(value.video_url),
  };
}
function canUseTariffMocks(error: unknown, state: RootState) {
  // Ошибки валидации, 401/403 и 404 не маскируем моковыми данными.
  return !state.tariffUser.isAuthenticated && axios.isAxiosError(error) &&
    (!error.response || [502, 503, 504].includes(error.response.status));
}
function requireTariffUser(state: RootState) {
  if (!state.tariffUser.isAuthenticated) throw new Error('Сначала войдите в систему');
}

export const getTariffs = tariffThunk('tariffs/getTariffs', async (_, { getState, rejectWithValue }) => {
  const { appliedPriceStep, currentPage, pageSize } = getState().tariffs;
  const price = PRICE_STEPS[appliedPriceStep].value;
  const mockPage = () => {
    const all = getPublishedTariffs().filter((t) => !price || t.price_per_month <= Number(price))
      .sort((a, b) => a.price_per_month - b.price_per_month || a.tariff_id - b.tariff_id);
    return { items: all.slice((currentPage - 1) * pageSize, currentPage * pageSize), total: all.length,
      queryMS: null, indexEnabled: null, source: 'mock' as const };
  };
  if (MOCK_ONLY) return mockPage();
  try {
    const response = await tariffsApi.tariffs.getTariffs({
      ...(price ? { priceLimit: Number(price) } : {}), page: currentPage, limit: pageSize,
    });
    const data = response.data;
    if (!Array.isArray(data.data) || data.total === undefined) throw new Error('Некорректная страница тарифов');
    return { items: data.data.map(normalizeTariff), total: data.total,
      queryMS: data.query_ms ?? null, indexEnabled: data.index_enabled ?? null, source: 'api' as const };
  } catch (error) {
    if (canUseTariffMocks(error, getState())) {
      return mockPage();
    }
    return rejectWithValue(tariffErrorMessage(error));
  }
});

export const getTariffFeed = tariffThunk('tariffs/getTariffFeed',
  async (query: { id?: number; next?: boolean; position?: number; init?: boolean }, { getState, rejectWithValue }) => {
    const mockFeed = () => {
      const items = getPublishedTariffs();
      const index = query.position !== undefined ? (query.position - 1) % items.length :
        query.id === undefined ? 0 : items.findIndex((t) => t.tariff_id === query.id);
      const tariff = index < 0 ? null : items[query.next ? (index + 1) % items.length : index] ?? null;
      return { tariff, meta: null, source: 'mock' as const };
    };
    if (MOCK_ONLY) return mockFeed();
    try {
      const response = await tariffsApi.tariffs.getTariffFeed(query);
      return { tariff: response.data.data ? normalizeTariff(response.data.data) : null,
        meta: response.data.feed ?? null, source: 'api' as const };
    } catch (error) {
      // Работающий API с недоступным Redis должен показать ошибку, а не моковую ленту.
      const redisFailure = axios.isAxiosError(error) && error.response?.status === 503 &&
        error.response?.data?.message !== 'Бэкенд недоступен';
      if (!redisFailure && canUseTariffMocks(error, getState())) {
        return mockFeed();
      }
      return rejectWithValue(tariffErrorMessage(error));
    }
  }, { condition: (query, { getState }) => !query.init || !getState().tariffs.feedRequest });

export const getTariffDraft = tariffThunk('tariffs/getTariffDraft', async (_, { getState, rejectWithValue }) => {
  try {
    requireTariffUser(getState());
    const response = await tariffsApi.tariffs.getTariffDraft();
    return response.data.data ? normalizeTariff(response.data.data) : null;
  } catch (error) { return rejectWithValue(tariffErrorMessage(error)); }
}, { condition: (_, { getState }) => !getState().tariffs.draftRequest });

export const createTariff = tariffThunk('tariffs/createTariff',
  async (data: { tariff_name: string; image?: File; video?: File }, { getState, rejectWithValue }) => {
    try {
      requireTariffUser(getState());
      const response = await tariffsApi.tariffs.createTariff(data);
      if (!response.data.data) throw new Error('Не получен созданный черновик');
      return normalizeTariff(response.data.data);
    } catch (error) { return rejectWithValue(tariffErrorMessage(error)); }
  });

export const publishTariff = tariffThunk('tariffs/publishTariff',
  async (data: { id: number; tariff_name: string; short_description: string; price_per_month: number; ram_gb: number; image?: File; video?: File },
    { getState, rejectWithValue }) => {
    try {
      requireTariffUser(getState());
      const { id, ...fields } = data;
      const response = await tariffsApi.tariffs.publishTariff(id, fields);
      if (!response.data.data) throw new Error('Не получен опубликованный тариф');
      return normalizeTariff(response.data.data);
    } catch (error) { return rejectWithValue(tariffErrorMessage(error)); }
  });

export const deleteTariff = tariffThunk('tariffs/deleteTariff', async (id: number, { getState, rejectWithValue }) => {
  try {
    requireTariffUser(getState());
    await tariffsApi.tariffs.deleteTariff(id);
    return id;
  } catch (error) { return rejectWithValue(tariffErrorMessage(error)); }
});

export const setTariffLike = tariffThunk('tariffs/setTariffLike',
  async (data: { id: number; value: number }, { getState, rejectWithValue }) => {
    try {
      requireTariffUser(getState());
      const response = await tariffsApi.tariffs.setTariffLike(data.id, { value: data.value });
      const result = response.data.data;
      if (!result || result.like_count === undefined || result.is_liked === undefined)
        throw new Error('Не получен результат лайка');
      return { id: data.id, like_count: result.like_count, is_liked: result.is_liked };
    } catch (error) { return rejectWithValue(tariffErrorMessage(error)); }
  });

const tariffsSlice = createSlice({
  name: 'tariffs', initialState,
  reducers: {
    setTariffPriceStep(state, action: PayloadAction<number>) {
      if (Number.isInteger(action.payload) && PRICE_STEPS[action.payload]) state.selectedPriceStep = action.payload;
    },
    setCurrentPage(state, action: PayloadAction<number>) {
 if (Number.isInteger(action.payload) && action.payload >= 1 && action.payload <= state.totalPages) {
 state.currentPage = action.payload; state.listReady = false;
 }
 },
 applyTariffPriceFilter(state) {
 state.currentPage = 1;
      state.appliedPriceStep = state.selectedPriceStep;
      state.listReady = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(tariffUserLoggedOut, () => initialState)
      .addCase(tariffUserLoggedIn, (state) => ({ ...initialState,
        selectedPriceStep: state.selectedPriceStep, appliedPriceStep: state.appliedPriceStep }))
      .addCase(getTariffs.pending, (state, action) => { state.listRequest = action.meta.requestId; })
      .addCase(getTariffs.fulfilled, (state, action) => {
        if (state.listRequest !== action.meta.requestId) return;
        state.total = action.payload.total;
 state.totalPages = Math.ceil(action.payload.total / state.pageSize);
 state.queryMS = action.payload.queryMS; state.indexEnabled = action.payload.indexEnabled;
 state.items = action.payload.items; state.listSource = action.payload.source; state.listRequest = undefined;
        state.listReady = true;
      })
      .addCase(getTariffs.rejected, (state, action) => {
        if (state.listRequest !== action.meta.requestId) return;
        state.listRequest = undefined; state.items = []; state.total = 0; state.totalPages = 0;
 state.queryMS = null; state.indexEnabled = null; state.listSource = 'api';
        state.listReady = true;
      })
      .addCase(getTariffFeed.pending, (state, action) => { state.feedRequest = action.meta.requestId; state.feed = null; })
      .addCase(getTariffFeed.fulfilled, (state, action) => {
        if (state.feedRequest !== action.meta.requestId) return;
        state.feedReady = true; state.feedMeta = action.payload.meta;
 state.feed = action.payload.tariff; state.feedSource = action.payload.source; state.feedRequest = undefined;
      })
      .addCase(getTariffFeed.rejected, (state, action) => {
        if (state.feedRequest === action.meta.requestId) { state.feedRequest = undefined; state.feedReady = true; state.feedMeta = null; }
      })
      .addCase(getTariffDraft.pending, (state, action) => { state.draftRequest = action.meta.requestId; state.draftReady = false; })
      .addCase(getTariffDraft.fulfilled, (state, action) => {
        if (state.draftRequest !== action.meta.requestId) return;
        state.draft = action.payload; state.draftReady = true; state.draftRequest = undefined;
      })
      .addCase(getTariffDraft.rejected, (state, action) => {
        if (state.draftRequest === action.meta.requestId) state.draftRequest = undefined;
      })
      .addCase(createTariff.fulfilled, (state, action) => { state.draft = action.payload; state.draftReady = true; })
      .addCase(publishTariff.fulfilled, (state) => {
        state.draft = null;
        state.listReady = false;

      })
      .addCase(deleteTariff.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.tariff_id !== action.payload);
 state.total = Math.max(0, state.total - 1);
 state.totalPages = Math.ceil(state.total / state.pageSize);
 state.currentPage = Math.min(state.currentPage, Math.max(1, state.totalPages));
 state.listReady = false;
        if (state.draft?.tariff_id === action.payload) state.draft = null;
        if (state.feed?.tariff_id === action.payload) state.feed = null;
      })
      .addCase(setTariffLike.fulfilled, (state, action) => {
        const { id, ...values } = action.payload;
        state.items.forEach((t) => { if (t.tariff_id === id) Object.assign(t, values); });
        if (state.feed?.tariff_id === id) Object.assign(state.feed, values);
      });
  },
});
export const { setTariffPriceStep, applyTariffPriceFilter, setCurrentPage } = tariffsSlice.actions;
export default tariffsSlice.reducer;
