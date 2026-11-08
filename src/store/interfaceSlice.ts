import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { tariffUserLoggedIn, tariffUserLoggedOut } from './userSlice';

// Счётчик учитывает одновременные запросы; каждый заканчивается ровно один раз.
const tariffInterfaceSlice = createSlice({
  name: 'tariffInterface', initialState: { pending: 0, error: '' },
  reducers: {
    tariffAuthStarted(state) { state.pending++; state.error = ''; },
    tariffAuthFinished(state) { state.pending = Math.max(0, state.pending - 1); },
    tariffInterfaceError(state, action: PayloadAction<string>) { state.error = action.payload; },
  },
  extraReducers: (builder) => {
    builder.addCase(tariffUserLoggedIn, (state) => { state.error = ''; });
    builder.addCase(tariffUserLoggedOut, (state) => { state.error = ''; });
    builder.addMatcher((action) => action.type.startsWith('tariffs/') && action.type.endsWith('/pending'),
      (state) => { state.pending++; state.error = ''; });
    builder.addMatcher((action) => action.type.startsWith('tariffs/') &&
      (action.type.endsWith('/fulfilled') || action.type.endsWith('/rejected')),
      (state, action: { type: string; payload?: unknown; meta?: { condition?: boolean; aborted?: boolean }; error?: { message?: string } }) => {
        if (action.meta?.condition) return;
        state.pending = Math.max(0, state.pending - 1);
        if (action.type.endsWith('/rejected') && !action.meta?.aborted)
          state.error = typeof action.payload === 'string' ? action.payload : action.error?.message || 'Ошибка запроса';
      });
  },
});
export const { tariffAuthStarted, tariffAuthFinished, tariffInterfaceError } = tariffInterfaceSlice.actions;
export default tariffInterfaceSlice.reducer;
