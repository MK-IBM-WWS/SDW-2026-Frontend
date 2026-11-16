import { isTauri } from '@tauri-apps/api/core';
import { fetch as nativeFetch } from '@tauri-apps/plugin-http';
import target from './target_config.json';
import type { CatalogPage, NativeTariff } from './types';

// Set before compilation with npm run native:configure -- SERVER_LAN_IP.
export const API_ORIGIN = target.apiOrigin;
export const API_PORT = new URL(API_ORIGIN).port || '80';
export async function serverFetch(path: string, signal?: AbortSignal): Promise<Response> {
 const url = new URL(path, API_ORIGIN);
 if (url.origin !== API_ORIGIN) throw new Error('Ресурс находится вне адреса API');
 const response = await (isTauri() ? nativeFetch : fetch)(url.href, {
  method: 'GET', signal, headers: { Accept: path.endsWith('/image') ? 'image/*' : 'application/json' },
 });
 if (!response.ok) {
  const detail = await response.text();
  let message = `HTTP ${response.status}`;
  try { message = JSON.parse(detail).message || message; } catch { /* Keep status for non-JSON bodies. */ }
  throw new Error(message);
 }
 return response;
}
export async function loadCatalogPage(q: string, page: number, signal: AbortSignal, priceLimit = ''): Promise<CatalogPage> {
 const query = new URLSearchParams({page:String(page),limit:'12'});
 if (q.trim()) query.set('q',q.trim());
 if (priceLimit) query.set('priceLimit',priceLimit);
 const response=await serverFetch(`/api/native/tariffs?${query}`,signal);
 return await response.json() as CatalogPage;
}
export async function loadSearchCorpus(q: string, signal: AbortSignal): Promise<NativeTariff[]> {
 const rows: NativeTariff[]=[];
 for(let page=1;;page++){
  const query=new URLSearchParams({page:String(page),limit:'100',semantic:'true'});
  if(q.trim())query.set('q',q.trim());
  const response=await serverFetch(`/api/native/tariffs?${query}`,signal);
  const body=await response.json() as CatalogPage;
  if(body.total>5000)throw new Error('Слишком много совпадений. Уточните название тарифа.');
  rows.push(...body.data);
  if(rows.length>=body.total||body.data.length===0)return rows;
 }
}
export async function loadDetails(id: number, signal: AbortSignal): Promise<NativeTariff> {
 const response = await serverFetch(`/api/native/tariffs/${id}`, signal);
 const body = await response.json() as {data: NativeTariff}; return body.data;
}
