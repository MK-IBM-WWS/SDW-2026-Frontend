import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import tariffsReducer from './tariffsSlice';
import tariffUserReducer from './userSlice';
import tariffInterfaceReducer from './interfaceSlice';

export const store = configureStore({ reducer: {
  tariffs: tariffsReducer, tariffUser: tariffUserReducer, tariffInterface: tariffInterfaceReducer,
} });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useTariffDispatch = useDispatch.withTypes<AppDispatch>();
export const useTariffSelector = useSelector.withTypes<RootState>();
