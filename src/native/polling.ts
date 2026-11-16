// Shared by both guest pages. A slow request never overlaps the next refresh.
export const REFRESH_INTERVAL_MS = 15_000;
export function startPolling(task: (signal: AbortSignal) => Promise<void>, interval = REFRESH_INTERVAL_MS): () => void {
 const controller = new AbortController();
 let running = false;
 const refresh = async () => {
  if (running || controller.signal.aborted) return;
  running = true;
  try { await task(controller.signal); } finally { running = false; }
 };
 void refresh();
 const timer = setInterval(() => { void refresh(); }, interval);
 return () => { clearInterval(timer); controller.abort(); };
}
