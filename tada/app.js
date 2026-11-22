(() => {
  const status = document.getElementById('networkStatus');
  const update = () => {
    if (!status) return;
    status.className = 'status ' + (navigator.onLine ? 'online' : 'offline');
    status.querySelector('span').textContent = navigator.onLine ? 'Conexión disponible' : 'Sin conexión · contenido guardado';
  };
  update();
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW:', err)), { once: true });
  }
})();