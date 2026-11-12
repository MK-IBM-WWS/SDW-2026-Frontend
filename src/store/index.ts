import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import tariffsReducer from './tariffsSlice';
import tariffUserReducer from './userSlice';
import tariffInterfaceReducer from './interfaceSlice';
import { saveListPreferences } from './listPreferences';

export const store = configureStore({ reducer: {
  tariffs: tariffsReducer, tariffUser: tariffUserReducer, tariffInterface: tariffInterfaceReducer,
} });
// Фильтр хранится в Redux при переходах и в sessionStorage при F5.
// Авторизация по-прежнему сбрасывается при перезагрузке, как в ЛР6.
store.subscribe(() => {
  const { selectedPriceStep, appliedPriceStep, currentPage } = store.getState().tariffs;
  saveListPreferences({ selectedPriceStep, appliedPriceStep, currentPage });
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useTariffDispatch = useDispatch.withTypes<AppDispatch>();
export const useTariffSelector = useSelector.withTypes<RootState>();
