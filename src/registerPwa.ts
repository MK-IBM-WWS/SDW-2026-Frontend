export function registerPwa() {
  // Service Worker создаётся при build. В dev нет кеша, скрывающего изменения кода.
  if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !window.isSecureContext) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}serviceWorker.js`, {
      scope: import.meta.env.BASE_URL,
    }).catch((error) => console.error('Не удалось зарегистрировать PWA:', error));
  });
}
