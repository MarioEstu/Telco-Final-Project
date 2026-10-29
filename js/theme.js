/* Tema: preferencia guardada o del sistema; se aplica antes de pintar para evitar parpadeo.
   Es un archivo aparte (no un script en línea) para poder usar una política CSP estricta. */
(function () {
  var t = null;
  try { t = localStorage.getItem('mp2-theme'); } catch (e) {}
  if (t !== 'dark' && t !== 'light') t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
})();
