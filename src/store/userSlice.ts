import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

const initialState = { isAuthenticated: false, login: '', userId: 0 };
const tariffUserSlice = createSlice({
  name: 'tariffUser', initialState,
  reducers: {
    tariffUserLoggedIn: (_state, action: PayloadAction<{ login: string; userId: number }>) =>
      ({ ...action.payload, isAuthenticated: true }),
    tariffUserLoggedOut: () => initialState,
  },
});
export const { tariffUserLoggedIn, tariffUserLoggedOut } = tariffUserSlice.actions;
export default tariffUserSlice.reducer;
