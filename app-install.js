(() => {
  if (window.smInstall) return;
  const development = document.currentScript?.dataset.development === 'true';
  const display = window.matchMedia('(display-mode: standalone)');
  const ua = navigator.userAgent || '';
  const apple = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const platform = apple ? 'ios' : /Android/i.test(ua) ? 'android' : 'desktop';
  let pending = null, busy = false, installed = display.matches || navigator.standalone === true, message = '';
  function state() { return { available: !!pending, busy, installed, platform, message }; }
  function announce() {
    document.documentElement.dataset.appInstalled = String(installed);
    window.dispatchEvent(new CustomEvent('sm:install-change', { detail: state() }));
  }
  async function request() {
    if (installed || busy) return;
    if (!pending) { location.assign('/install'); return; }
    const prompt = pending;
    pending = null; busy = true; message = ''; announce();
    try {
      // Called immediately inside the user's click, preserving browser activation.
      await prompt.prompt();
      const result = await prompt.userChoice;
      if (result.outcome === 'accepted') installed = true;
      else message = 'Installation canceled. You can install later from your browser menu.';
    } catch {
      message = 'Use the browser menu to install, or follow the steps below.';
      if (!/^\/install(?:\.html)?\/?$/.test(location.pathname)) location.assign('/install');
    } finally { busy = false; announce(); }
  }
  window.smInstall = { getState: state, request };
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); pending = event; announce(); });
  window.addEventListener('appinstalled', () => { installed = true; pending = null; announce(); });
  display.addEventListener('change', event => { installed = event.matches || navigator.standalone === true; announce(); });
  document.addEventListener('click', event => {
    const link = event.target.closest?.('[data-install-app]');
    if (!link || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); void request();
  });
  announce();
  // Vite development serves source modules; only the built app has an offline bundle.
  function register() {
    if (!development && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
})();
