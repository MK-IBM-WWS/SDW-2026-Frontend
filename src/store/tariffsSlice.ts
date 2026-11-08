import axios from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';
import type { Tariff } from '../types/tariff';
import { tariffsApi, tariffErrorMessage, tariffMediaUrl } from '../api';
import { getPublishedTariffs } from '../modules/mock';
import { PRICE_STEPS } from '../modules/priceFilter';
import { tariffUserLoggedIn, tariffUserLoggedOut } from './userSlice';

interface TariffsState {
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
  selectedPriceStep: 0, appliedPriceStep: 0, items: [], feed: null, draft: null,
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
  const limit = PRICE_STEPS[getState().tariffs.appliedPriceStep].value;
  try {
    const response = await tariffsApi.tariffs.getTariffs(limit ? { priceLimit: Number(limit) } : {});
    if (!Array.isArray(response.data.data)) throw new Error('Некорректный список тарифов');
    return { items: response.data.data.map(normalizeTariff), source: 'api' as const };
  } catch (error) {
    if (canUseTariffMocks(error, getState())) return {
      items: getPublishedTariffs().filter((t) => !limit || t.price_per_month <= Number(limit)), source: 'mock' as const,
    };
    return rejectWithValue(tariffErrorMessage(error));
  }
}, { condition: (_, { getState }) => !getState().tariffs.listRequest });

export const getTariffFeed = tariffThunk('tariffs/getTariffFeed',
  async (query: { id?: number; next?: boolean }, { getState, rejectWithValue }) => {
    try {
      const response = await tariffsApi.tariffs.getTariffFeed(query);
      return { tariff: response.data.data ? normalizeTariff(response.data.data) : null, source: 'api' as const };
    } catch (error) {
      if (canUseTariffMocks(error, getState())) {
        const items = getPublishedTariffs();
        const index = query.id === undefined ? 0 : items.findIndex((t) => t.tariff_id === query.id);
        const tariff = index < 0 ? null : items[query.next ? (index + 1) % items.length : index] ?? null;
        return { tariff, source: 'mock' as const };
      }
      return rejectWithValue(tariffErrorMessage(error));
    }
  });

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
    applyTariffPriceFilter(state) {
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
        state.items = action.payload.items; state.listSource = action.payload.source; state.listRequest = undefined;
        state.listReady = true;
      })
      .addCase(getTariffs.rejected, (state, action) => {
        if (state.listRequest !== action.meta.requestId) return;
        state.listRequest = undefined; state.items = []; state.listSource = 'api';
        state.listReady = true;
      })
      .addCase(getTariffFeed.pending, (state, action) => { state.feedRequest = action.meta.requestId; state.feed = null; })
      .addCase(getTariffFeed.fulfilled, (state, action) => {
        if (state.feedRequest !== action.meta.requestId) return;
        state.feed = action.payload.tariff; state.feedSource = action.payload.source; state.feedRequest = undefined;
      })
      .addCase(getTariffFeed.rejected, (state, action) => {
        if (state.feedRequest === action.meta.requestId) state.feedRequest = undefined;
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
      .addCase(publishTariff.fulfilled, (state, action) => {
        state.draft = null;
        const limit = PRICE_STEPS[state.appliedPriceStep].value;
        // Публикация обновляет уже загруженный список без повторного GET.
        if (state.listReady && (!limit || action.payload.price_per_month <= Number(limit))) {
          state.items = [...state.items.filter((t) => t.tariff_id !== action.payload.tariff_id), action.payload]
            .sort((a, b) => a.tariff_id - b.tariff_id);
        }
      })
      .addCase(deleteTariff.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.tariff_id !== action.payload);
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
export const { setTariffPriceStep, applyTariffPriceFilter } = tariffsSlice.actions;
export default tariffsSlice.reducer;
