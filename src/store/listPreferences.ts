import { PRICE_STEPS } from '../modules/priceFilter';
const KEY = 'cloud_tariffs_list_v7';
export function readListPreferences() {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) || '{}');
    const validStep = (step: number) => Number.isInteger(step) && !!PRICE_STEPS[step];
    return {
      selectedPriceStep: validStep(value.selectedPriceStep) ? value.selectedPriceStep : 0,
      appliedPriceStep: validStep(value.appliedPriceStep) ? value.appliedPriceStep : 0,
      currentPage: Number.isInteger(value.currentPage) && value.currentPage > 0 ? value.currentPage : 1,
    };
  } catch { return { selectedPriceStep: 0, appliedPriceStep: 0, currentPage: 1 }; }
}
export function saveListPreferences(value: { selectedPriceStep: number; appliedPriceStep: number; currentPage: number }) {
  try { sessionStorage.setItem(KEY, JSON.stringify(value)); } catch { /* Хранилище может быть запрещено. */ }
}
