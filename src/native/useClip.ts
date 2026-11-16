import { useEffect, useMemo, useRef, useState } from 'react';
import { rankTariffs, selectResults } from './search';
import type { NativeTariff } from './types';
export function useClip(items: NativeTariff[], file: File | null, threshold: number, topK: number) {
 const worker = useRef<Worker | null>(null), sequence = useRef(0);
 const imageIdentity = useRef<{file: File | null; id: number}>({file:null,id:0});
 const [state, setState] = useState<{ vectors: Record<number, number[]>; image: number[]; eligible: number } | null>(null);
 const [status, setStatus] = useState(''), [error, setError] = useState('');
 const [busy, setBusy] = useState(false);
 useEffect(() => {
  const instance = new Worker(new URL('./search.worker.ts', import.meta.url), { type: 'module' });
  worker.current = instance;
  instance.onmessage = event => {
   const { requestId, type, data } = event.data;
   if (requestId !== sequence.current) return;
   if (type === 'status') setStatus(data);
   if (type === 'result') { setState(data); setBusy(false); setStatus('Готово'); }
   if (type === 'error') { setError(data); setBusy(false); }
  };
  instance.onerror = event => { setError(event.message || 'Не удалось запустить CLIP worker'); setBusy(false); };
  return () => { instance.terminate(); worker.current = null; };
 }, []);
 useEffect(() => {
  const requestId = ++sequence.current;
  setState(null); setError(''); setBusy(Boolean(file));
  if (!file) { setStatus(''); return; }
  if (imageIdentity.current.file !== file) imageIdentity.current = {file,id:imageIdentity.current.id+1};
  worker.current?.postMessage({ requestId, items, file, fileId:imageIdentity.current.id,
   modelBase: new URL('./models/', document.baseURI).href,
   wasmBase: new URL('./ort/', document.baseURI).href,
  });
 }, [items, file]);
 const ranked = useMemo(() => state ? rankTariffs(items, state.vectors, state.image) : [], [items, state]);
 const results = useMemo(() => selectResults(ranked, threshold, topK), [ranked, threshold, topK]);
 return { ranked, results, busy, status, error, eligible: state?.eligible ?? 0 };
}
