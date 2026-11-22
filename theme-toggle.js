'use strict';
(() => {
  const button = document.getElementById('themeToggle');
  if (!button) return;

  const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  let theme = systemTheme;

  function applyTheme() {
    document.body.dataset.theme = theme;
    const dark = theme === 'dark';
    button.textContent = dark ? '☀ Modo claro' : '☾ Modo noche';
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo noche');
    button.title = dark ? 'Cambiar a modo claro' : 'Cambiar a modo noche';
  }

  button.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme();
  });

  applyTheme();
})();