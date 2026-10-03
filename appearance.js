/* Applied before paint on every page; shared by the React and classic workspaces. */
(() => {
  const key = 'savage-master-appearance-v1';
  const root = document.documentElement;
  const device = window.matchMedia('(prefers-color-scheme: dark)');
  const valid = value => ['auto', 'light', 'dark'].includes(value);
  let preference = 'auto';
  try { const saved = localStorage.getItem(key); if (valid(saved)) preference = saved; } catch { /* Appearance also works without storage. */ }
  const path = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  const query = new URLSearchParams(location.search);
  root.dataset.workspace = path === '/' ? (query.get('game') === 'savage' ? 'characters' : 'home') : ({'/dnd':'characters','/pathfinder':'characters','/profile':'profile','/chronicles':'community','/builder':'world','/campaigns':'campaigns','/pricing':'account','/support':'support'}[path] || 'home');
  function apply() {
    const theme = preference === 'auto' ? (device.matches ? 'dark' : 'light') : preference;
    root.dataset.theme = theme;
    root.dataset.appearance = preference;
    root.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#111d20' : '#f5f0e6';
    window.dispatchEvent(new CustomEvent('sm:appearance-change', {detail:{preference,theme}}));
  }
  window.smAppearance = {
    getPreference: () => preference,
    setPreference(value) {
      if (!valid(value)) return;
      preference = value;
      try { localStorage.setItem(key, preference); } catch { /* Retain the choice for this page. */ }
      apply();
    },
  };
  device.addEventListener('change', () => { if (preference === 'auto') apply(); });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : 'auto';
    apply();
  });
  apply();
})();
