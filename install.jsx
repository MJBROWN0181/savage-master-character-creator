import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './install.css';

const fallback = { available: false, installed: false, busy: false, platform: 'desktop', message: '' };
const devices = { desktop: 'Computer', android: 'Android', ios: 'iPhone / iPad' };
export function InstallPage() {
  const [state, setState] = useState(() => window.smInstall?.getState() || fallback);
  const [device, setDevice] = useState(() => window.smInstall?.getState().platform || 'desktop');
  const [copied, setCopied] = useState('');
  useEffect(() => {
    const update = event => setState(event.detail);
    window.addEventListener('sm:install-change', update);
    setState(window.smInstall?.getState() || fallback);
    return () => window.removeEventListener('sm:install-change', update);
  }, []);
  async function copy() {
    try { await navigator.clipboard.writeText('https://smsheets.com/install'); setCopied('Install link copied.'); }
    catch { setCopied('Select and copy the link above.'); }
  }
  return <main className="install-page">
    <header className="install-hero">
      <div className="install-app-icon"><img src="/icons/icon-512x512.png" width="512" height="512" alt="Savage Master" /></div>
      <span className="install-eyebrow">Your adventure, one tap away</span>
      <h1>Take Savage Master with you.</h1>
      <p>Add it to your phone or computer. Your character workshop, campaigns, and stories open in their own app window.</p>
      {state.installed ? <><p className="install-status" role="status">You’re already using the Savage Master app.</p><a className="install-primary" href="/create">Create a character</a></> : state.available || state.busy ? <><button type="button" className="install-primary" data-install-app disabled={state.busy}>{state.busy ? 'Opening install…' : 'Install App'}</button><small>Confirm Install in your browser to finish.</small></> : <a className="install-primary" href="#install-guide">Show install steps</a>}
      {state.message && <p className="install-status" role="status">{state.message}</p>}
    </header>
    {!state.installed && <section className="install-guide" id="install-guide" aria-labelledby="install-guide-title">
      <h2 id="install-guide-title">A quick setup for your device</h2>
      <div className="install-devices" role="group" aria-label="Choose your device">{Object.entries(devices).map(([id, name]) => <button type="button" key={id} aria-pressed={device === id} onClick={() => setDevice(id)}>{name}</button>)}</div>
      {device === 'ios' ? <div><h3>In Safari</h3><ol><li>Open <strong>smsheets.com/install</strong> in Safari.</li><li>Tap <strong>Share</strong> (you may need to open the <strong>More</strong> menu first), then <strong>Add to Home Screen</strong>.</li><li>Keep <strong>Open as Web App</strong> on if shown, then tap <strong>Add</strong>.</li></ol><p>Your Savage Master icon will appear on your Home Screen.</p></div> : device === 'android' ? <div><h3>In Chrome or Edge</h3><ol><li>Tap <strong>Install App</strong> above when it appears, or open your browser’s <strong>⋮ menu</strong>.</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>Confirm <strong>Install</strong>. Open Savage Master from its new icon.</li></ol><p>If you opened this link inside another app, open it in Chrome or Edge first.</p></div> : <div><h3>In Chrome or Edge</h3><ol><li>Click <strong>Install App</strong> above when it appears, or click the <strong>install icon</strong> in the address bar.</li><li>Confirm <strong>Install</strong>.</li><li>Launch Savage Master from your desktop or app list.</li></ol><p>In Edge you can also use <strong>… → More tools → Apps → Install this site as an app</strong>. On a Mac in Safari, use <strong>File → Add to Dock</strong>. If your browser has no install option, open this link in Chrome or Edge.</p></div>}
    </section>}
    <div className="install-footnote"><p>Core character tools are available offline after the first online setup. Artwork loads as you browse. Sign-in, account saving, and community features need internet.</p><a href="/">Continue on the website</a></div>
    <section className="install-share" aria-labelledby="install-share-title"><h2 id="install-share-title">Bring your table along</h2><label>Share the install link<input readOnly value="https://smsheets.com/install" onFocus={event => event.currentTarget.select()} /></label><button type="button" className="install-copy" onClick={copy}>Copy install link</button>{copied && <p role="status">{copied}</p>}</section>
  </main>;
}
const host = document.getElementById('installRoot');
const root = host ? (import.meta.hot?.data.installRoot || createRoot(host)) : null;
if (import.meta.hot && root) import.meta.hot.data.installRoot = root;
root?.render(<InstallPage />);
