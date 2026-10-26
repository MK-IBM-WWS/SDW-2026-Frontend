export const PRICE_STEPS = [
  { value: '', label: 'без ограничения' },
  { value: '1000', label: 'до 1 000 ₽' },
  { value: '10000', label: 'до 10 000 ₽' },
  { value: '500000', label: 'до 500 000 ₽' },
] as const;

export function getPriceStep(value: string | null): number {
  const index = PRICE_STEPS.findIndex((step) => step.value === value);
  return index < 0 ? 0 : index;
}

export const formatNumber = (value: number): string => value.toLocaleString('ru-RU');
