import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexReactClient, useConvexAuth, useMutation, useQuery } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { makeFunctionReference as ref } from 'convex/server';
import './support.css';
import { BugMascot, BugPaths, signalBug } from './bug-mascot.jsx';

const capture = () => window.smBugCapture?.snapshot() || { page: location.pathname, errors: [] };
const defaultDraft = () => ({ kind: 'bug', title: '', body: '', email: '', attach: true, requestId: crypto.randomUUID() });
const draftKey = 'sm-support-draft-v1';
function readDraft() {
  try {
    const draft = JSON.parse(sessionStorage.getItem(draftKey));
    if (draft && typeof draft.title === 'string' && typeof draft.body === 'string' && typeof draft.email === 'string') return { ...defaultDraft(), ...draft };
  } catch { /* Keep reporting usable without browser storage. */ }
  return defaultDraft();
}
function reportText(draft, diagnostics) {
  return `Savage Master — ${draft.kind === 'bug' ? 'Bug report' : 'Support request'}\n${draft.title}\n\n${draft.body}\n\n${draft.attach && draft.kind === 'bug' ? diagnostics : 'No automatic error details attached.'}`;
}

function ReportForm({ send, connected, initialKind, onSent }) {
  const [draft, setDraft] = useState(() => ({ ...readDraft(), ...(initialKind ? { kind: initialKind } : {}) }));
  const [diagnostics, setDiagnostics] = useState(() => JSON.stringify(capture(), null, 2).slice(0, 20000));
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [receipt, setReceipt] = useState(null);
  useEffect(() => { if (busy) signalBug('sending'); }, [busy]);
  const set = patch => { setDraft(old => ({ ...old, ...patch })); setReceipt(null); setMessage(''); };
  useEffect(() => { try { sessionStorage.setItem(draftKey, JSON.stringify(draft)); } catch { /* The form remains usable. */ } }, [draft]);
  async function copy() {
    try { await navigator.clipboard.writeText(reportText(draft, diagnostics)); setMessage('Report copied.'); }
    catch { setMessage('Clipboard access is unavailable. Use Download report to keep a copy.'); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([reportText(draft, diagnostics)], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'savage-master-report.txt'; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Report download requested.');
  }
  async function submit(event) {
    event.preventDefault(); if (!send || busy) return;
    setBusy(true); setMessage('');
    try {
      const result = await send({ requestId: draft.requestId, kind: draft.kind, title: draft.title.trim(), body: draft.body.trim(), email: draft.email.trim(), ...(draft.attach && draft.kind === 'bug' ? { diagnostics } : {}) });
      setReceipt(result.reference); signalBug('success'); onSent?.(result);
      setDraft(defaultDraft());
    } catch (error) {
      const reason = typeof error.data === 'string' ? error.data : '';
      setMessage(reason || 'Your report could not be sent. Your draft is still here. Check your connection and try again, or copy/download it.');
      signalBug('inspect');
    }
    finally { setBusy(false); }
  }
  return <form className="bug-form" onSubmit={submit}>
    {(busy || receipt) && <div className="bug-delivery"><BugMascot state={busy ? 'sending' : 'success'} size={62} /><span>{busy ? 'Bug is carrying your report to the team…' : 'Your ticket is safely recorded.'}</span></div>}
    <fieldset disabled={busy}>
      <label>How can I help?<select value={draft.kind} onChange={e => set({ kind: e.target.value })}><option value="bug">Report a bug</option><option value="help">Create a support ticket</option></select></label>
      <label>{draft.kind === 'bug' ? 'What went wrong?' : 'What do you need help with?'}<input required maxLength={160} value={draft.title} onChange={e => set({ title: e.target.value })} placeholder="A short summary" /></label>
      <label>{draft.kind === 'bug' ? 'What happened?' : 'Tell us a little more'}<textarea required maxLength={6000} rows={4} value={draft.body} onChange={e => set({ body: e.target.value })} placeholder={draft.kind === 'bug' ? 'What did you click? What happened, and what did you expect?' : 'Tell us how we can help.'} /></label>
      <label>Your reply email<input required type="email" maxLength={254} autoComplete="email" value={draft.email} onChange={e => set({ email: e.target.value })} placeholder="you@example.com" /></label>
      {draft.kind === 'bug' && <>
        <label className="bug-check"><input type="checkbox" checked={draft.attach} onChange={e => set({ attach: e.target.checked })} />Include captured error details</label>
        <p className="bug-hint">I collect recent errors, the page, and browser details. Your character sheets and journals are not attached. Review or edit the details below before sending.</p>
        {draft.attach && <details className="bug-details"><summary>Review captured error details</summary><label>Error details<textarea rows={6} value={diagnostics} maxLength={20000} onChange={e => setDiagnostics(e.target.value)} /></label><button type="button" onClick={() => setDiagnostics(JSON.stringify(capture(), null, 2).slice(0, 20000))}>Refresh error details</button></details>}
      </>}
      {!connected && <p className="bug-hint">Sending is unavailable right now. Keep a copy of your report and try again later.</p>}
      <div className="bug-actions"><button className="bug-primary" type="submit" disabled={!connected}>{busy ? 'Sending…' : draft.kind === 'bug' ? 'Send bug report' : 'Create support ticket'}</button><button type="button" onClick={copy}>Copy report</button><button type="button" onClick={download}>Download report</button></div>
    </fieldset>
    <p className="bug-status" role="status" aria-live="polite">{receipt ? `Ticket received: ${receipt}. Keep this reference. Our team will follow up at your reply email.` : message}</p>
  </form>;
}

function Tickets() {
  const { isAuthenticated } = useConvexAuth();
  const tickets = useQuery(ref('support:mine'), isAuthenticated ? {} : 'skip');
  return <section className="support-card"><h2>Your tickets</h2>{!isAuthenticated ? <p><a href="/profile?entry=signIn">Sign in</a> before sending to keep tickets with your account. Guest reports receive a ticket reference and replies by email.</p> : tickets === undefined ? <p>Loading your tickets…</p> : !tickets.length ? <p>No tickets yet. The Bug is here whenever you need him.</p> : tickets.map(ticket => <article className="support-ticket" key={ticket._id}><div><h3>{ticket.title}</h3><span className="support-ticket-state">{ticket.status.replace('_', ' ')}</span></div><small>{ticket.reference} · {new Date(ticket.createdAt).toLocaleDateString()}</small><p>{ticket.body}</p>{ticket.reply && <blockquote><strong>Support replied</strong><p>{ticket.reply}</p></blockquote>}</article>)}</section>;
}
function SupportPage({ send, connected, accountConnected }) {
  return <main className="support-page"><nav className="support-nav" aria-label="Support navigation"><a href="/">Savage Master</a><a href="/profile">My profile</a><a href="/support" aria-current="page">Support</a></nav>
    <header className="support-hero"><div><span className="support-eyebrow">A little help for your adventure</span><h1>Support &amp; bug reports</h1><p>Meet the Bug. He keeps a tome of code and helps our team untangle anything that gets in your way.</p><BugPaths /></div><BugMascot state="welcome" size={160} label="Bug, the winged keeper of code" /></header>
    <div className="support-columns"><section className="support-card"><h2>Ask the Bug</h2><p>Report an error or open a support ticket. We’ll save your request and give you a reference.</p><ReportForm send={send} connected={connected} /></section><aside className="support-help"><section className="support-card"><h2>A helping hand</h2><details><summary>My character will not save</summary><p>Check your connection and sign-in. Download a character backup before refreshing the page. Include the error in your report so we can investigate.</p></details><details><summary>I cannot sign in</summary><p>Use “Forgot password?” on your profile page and check your inbox and spam folder for the code. You can send a support ticket here without signing in.</p></details><details><summary>I cannot find my campaign</summary><p>Check that you are using the account that joined the campaign. Ask your GM for a new invitation if the previous link has expired.</p></details><details><summary>What does the Bug capture?</summary><p>Recent application errors, the page path, browser, connection status, and screen size. Details stay in memory until you choose to send. He does not read your character sheets, journals, or passwords. You can edit or remove the attached details.</p></details></section>{accountConnected && <Tickets />}</aside></div>
  </main>;
}
function BugButton({ form }) {
  const dialog = useRef(null), button = useRef(null);
  const [open, setOpen] = useState(false);
  const [motion, setMotion] = useState('idle'), [hasError, setHasError] = useState(() => capture().errors.length > 0);
  const timer = useRef(null);
  useEffect(() => {
    function animate(event) {
      const state = event.type === 'sm:bug-error' ? 'inspect' : event.detail;
      if (event.type === 'sm:bug-error') setHasError(true);
      if (!['idle', 'inspect', 'sending', 'success', 'welcome', 'guide', 'announce'].includes(state)) return;
      clearTimeout(timer.current); setMotion(state);
      if (state !== 'sending') timer.current = setTimeout(() => setMotion('idle'), 3200);
    }
    window.addEventListener('sm:bug-error', animate); window.addEventListener('sm:bug-state', animate);
    return () => { clearTimeout(timer.current); window.removeEventListener('sm:bug-error', animate); window.removeEventListener('sm:bug-state', animate); };
  }, []);
  useEffect(() => {
    if (!open || !dialog.current) return;
    dialog.current.showModal();
    return () => dialog.current?.close();
  }, [open]);
  function close() { setOpen(false); requestAnimationFrame(() => button.current?.focus()); }
  return <><button ref={button} className="bug-companion" aria-label={`the Bug — report a bug or get support${hasError ? '. Error details available' : ''}`} aria-haspopup="dialog" onClick={() => { setOpen(true); setMotion('welcome'); }}><BugMascot state={motion} size={58} /><span>the Bug</span>{hasError && <span className="bug-error-dot" aria-hidden="true" />}</button>
    {open && <dialog ref={dialog} className="bug-dialog" aria-labelledby="bug-dialog-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === dialog.current) { const bounds = dialog.current.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close(); } }}>
      <header className="bug-dialog-header"><BugMascot state={motion} size={64} /><div><h2 id="bug-dialog-title">the Bug</h2><p>Tell me what happened. I’ll bring it to the team.</p></div><button type="button" className="bug-close" aria-label="Close the Bug" onClick={close}>×</button></header>
      <BugPaths />
      {form || <ReportForm connected={false} />}<a className="bug-support-link" href="/support">Visit support &amp; your tickets</a>
    </dialog>}
  </>;
}
function ConnectedPage() {
  const send = useMutation(ref('support:submit'));
  return <SupportPage send={send} connected accountConnected />;
}
function ConnectedForm() {
  const send = useMutation(ref('support:submit'));
  const { isLoading } = useConvexAuth();
  return <ReportForm send={send} connected={!isLoading} />;
}
class SupportBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { window.smBugCapture?.record('Support error', error); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
const pageRoot = document.getElementById('supportPageRoot') || import.meta.hot?.data.pageRoot;
if (import.meta.hot && pageRoot) import.meta.hot.data.pageRoot = pageRoot;
const widgetRoot = document.getElementById('bugRoot') || document.createElement('div'); widgetRoot.id = 'bugRoot';
if (!widgetRoot.isConnected) document.body.append(widgetRoot);
const url = import.meta.env.VITE_CONVEX_URL;
function Root() {
  // Mount the companion's auth provider when opened, after any same-page sign-in.
  // A support failure must leave the button and copy/download form available.
  return <>{pageRoot && <SupportBoundary fallback={<SupportPage connected={false} />}>{url ? <ConvexAuthProvider client={pageClient}><ConnectedPage /></ConvexAuthProvider> : <SupportPage connected={false} />}</SupportBoundary>}
    <BugButton form={url ? <SupportBoundary fallback={<ReportForm connected={false} />}><ConvexAuthProvider client={widgetClient}><ConnectedForm /></ConvexAuthProvider></SupportBoundary> : undefined} />
  </>;
}
const pageClient = url && pageRoot ? new ConvexReactClient(url) : null;
const widgetClient = url ? new ConvexReactClient(url) : null;
if (pageRoot) pageRoot.remove();
const root = import.meta.hot?.data.root || createRoot(widgetRoot);
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(<Root />);
