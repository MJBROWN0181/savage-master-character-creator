(() => {
  function mount() {
    if (document.getElementById('sm-shell')) return;
    const links = [
      ['characters','Create a character','/create'],
      ['campaigns','Campaigns','/campaigns'],
      ['table','Gaming Table','/campaigns?view=table'],
      ['journal','Journals','/campaigns?view=journal'],
      ['community','Around the Fire','/chronicles'],
      ['world','World Builder','/builder'],
      ['profile','My Profile','/profile'],
    ];
    const shell = document.createElement('header');
    shell.id = 'sm-shell';
    shell.className = 'sm-shell';
    const nav = links.map(([id,label,href]) => `<a data-destination="${id}" href="${href}">${label}</a>`).join('');
    shell.innerHTML = `<a class="sm-skip" href="#workspace-content">Skip to workspace</a>
      <a class="sm-brand" href="/" aria-label="Savage Master home"><span class="sm-emblem"><img src="/logo.png" width="48" height="48" alt=""></span><span>Savage Master<small>Your character. Your table. Your story.</small></span></a>
      <nav class="sm-desktop-nav" aria-label="Main workspace">${nav}</nav>
      <div class="sm-shell-controls"><details class="sm-settings"><summary>Settings</summary><div class="sm-settings-menu"><label class="sm-appearance"><span>Appearance</span><select aria-label="Appearance"><option value="auto">Follow device</option><option value="light">Light</option><option value="dark">Dark</option></select></label><a href="/settings#review">Profile review &amp; access</a><a href="/settings#security">Password &amp; account</a><a href="/settings#privacy">Privacy &amp; connections</a><a href="/settings#profile-data">Profile &amp; data</a><a href="/settings">All settings</a></div></details>
      <details class="sm-explore"><summary>Explore <span aria-hidden="true">⌄</span></summary><nav aria-label="Explore workspaces">${nav}<a href="/install" data-install-app>Install App</a><a href="/pricing">Account & billing</a><a href="/support">Support & the Bug</a><a href="/legal">Terms, privacy & publisher credits</a></nav></details></div>`;
    document.body.prepend(shell);
    const select = shell.querySelector('select');
    select.value = window.smAppearance.getPreference();
    select.addEventListener('change', () => window.smAppearance.setPreference(select.value));
    window.addEventListener('sm:appearance-change', () => { select.value = window.smAppearance.getPreference(); });
    function updateLinks() {
      const query = new URLSearchParams(location.search);
      const campaign = query.get('campaign');
      const workspace = document.documentElement.dataset.workspace;
      const active = workspace === 'campaigns' ? (['table','journal'].includes(query.get('view')) ? query.get('view') : 'campaigns') : workspace;
      shell.querySelectorAll('[data-destination]').forEach(link => {
        if (link.dataset.destination === active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
        if (['campaigns','table','journal'].includes(link.dataset.destination)) {
          const url = new URL(links.find(([id]) => id === link.dataset.destination)[2], location.origin);
          if (campaign) url.searchParams.set('campaign',campaign);
          link.setAttribute('href',url.pathname + url.search);
        }
      });
    }
    updateLinks();
    window.addEventListener('sm:workspace-change', updateLinks);
    const menus = [...shell.querySelectorAll('details')];
    shell.addEventListener('keydown', event => { if (event.key === 'Escape') for (const menu of menus) if (menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
    document.addEventListener('click', event => { for (const menu of menus) if (!menu.contains(event.target)) menu.open = false; });
    function markMain() {
      const main = document.querySelector('main:not([hidden])');
      if (!main) return false;
      if (!main.id) main.id = 'workspace-content';
      shell.querySelector('.sm-skip').href = '#' + main.id;
      main.tabIndex = -1;
      return true;
    }
    if (!markMain()) {
      const observer = new MutationObserver(() => { if (markMain()) observer.disconnect(); });
      observer.observe(document.body,{childList:true,subtree:true});
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
})();
