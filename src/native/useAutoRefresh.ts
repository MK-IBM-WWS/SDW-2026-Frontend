import { useEffect, useRef, useState } from 'react';
import { startPolling } from './polling';

export function useAutoRefresh<T>(request: ((signal: AbortSignal) => Promise<T>) | null) {
 const [data,setData] = useState<T | null>(null);
 const [error,setError] = useState('');
 const [loading,setLoading] = useState(Boolean(request));
 const [revision,setRevision] = useState(0);
 const serialized = useRef('');
 useEffect(() => {
  setError(''); setLoading(Boolean(request));
  if (!request) { setData(null); serialized.current = ''; return; }
  return startPolling(async signal => {
   try {
    const result = await request(signal);
    if (signal.aborted) return;
    const next = JSON.stringify(result);
    // Stable corpus references keep unchanged descriptions from starting another CLIP request.
    if (serialized.current !== next) { serialized.current = next; setData(result); }
    setRevision(value => value + 1); setError('');
   } catch (error) {
    if (!signal.aborted) setError(error instanceof Error ? error.message : 'Не удалось загрузить тарифы');
   } finally { if (!signal.aborted) setLoading(false); }
  });
 },[request]);
 return {data,error,loading,revision};
}
