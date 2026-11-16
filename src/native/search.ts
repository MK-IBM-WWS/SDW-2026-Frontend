import type { NativeTariff, RankedTariff } from './types';
export const MODEL_ID = 'Xenova/clip-vit-base-patch32';
export const DEFAULT_THRESHOLD = 0.6;
export const DEFAULT_TOP_K = 10;
// English fixture descriptions contain only ASCII, letters and normal punctuation.
export function validDescription(text: string): boolean {
 return text.length >= 50 && text.length <= 100 && /^[\x20-\x7e]+$/.test(text) && /[A-Za-z]/.test(text);
}
export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
 if (!a.length || a.length !== b.length) throw new Error('Размерности эмбеддингов не совпадают');
 let dot = 0, na = 0, nb = 0;
 for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
 return na && nb ? Math.max(-1, Math.min(1, dot / Math.sqrt(na*nb))) : 0;
}
// Explicit normalized cosine scale agreed for the required 0.4–0.9 threshold range.
// Both the original cosine and its reversible mapping are exposed in the UI.
export function rankTariffs(items: NativeTariff[], vectors: Record<number, number[]>, image: number[]): RankedTariff[] {
 return items.filter(item => vectors[item.tariff_id]).map(item => {
  const cosine = cosineSimilarity(image, vectors[item.tariff_id]);
  return { ...item, cosine, score: (cosine + 1) / 2 };
 }).sort((a,b) => b.score-a.score || a.tariff_id-b.tariff_id);
}
export function selectResults(ranked: RankedTariff[], threshold: number, topK: number): RankedTariff[] {
 return ranked.filter(item => item.score >= threshold).slice(0, topK);
}
