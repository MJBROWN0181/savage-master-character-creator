import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useBugPersonalSpace } from './bug-personal-space.js';
import { BugMascot, BugPaths, bugStates } from './bug-mascot.jsx';

const motionKey = 'sm-bug-motion-v1';
const compactKey = 'sm-bug-compact-v1';
const readPaused = () => { try { return localStorage.getItem(motionKey) === 'paused'; } catch { return false; } };
const readCompact = () => { try { return localStorage.getItem(compactKey) === 'true'; } catch { return false; } };
const captureErrors = () => window.smBugCapture?.snapshot()?.errors?.length > 0;
function arrivalState() {
  const query = new URLSearchParams(location.search);
  return query.get('tour') === '1' ? 'guide' : query.get('user') === 'bug' ? 'announce' : /^\/support(?:\.html)?\/?$/.test(location.pathname) ? 'welcome' : 'idle';
}

export function useBugLife() {
  const [motion, setMotion] = useState(arrivalState);
  const [hasError, setHasError] = useState(captureErrors);
  const [paused, setPaused] = useState(readPaused);
  const active = useRef(motion), timer = useRef(null);
  function act(state) {
    if (!bugStates.includes(state)) return;
    // An unrelated error, share or wizard hint must not interrupt delivery.
    if (active.current === 'sending' && !['sending', 'success', 'inspect'].includes(state)) return;
    clearTimeout(timer.current);
    active.current = state; setMotion(state);
    if (!['idle', 'sending'].includes(state)) timer.current = setTimeout(() => {
      active.current = 'idle'; setMotion('idle');
    }, state === 'guide' ? 7000 : state === 'inspect' ? 6000 : 3200);
  }
  useEffect(() => {
    act(active.current);
    function animate(event) {
      if (event.type === 'sm:bug-error') {
        setHasError(true);
        if (active.current !== 'sending') act('inspect');
      } else act(event.detail);
    }
    function guide() { if (active.current !== 'sending') act('guide'); }
    window.addEventListener('sm:bug-error', animate);
    window.addEventListener('sm:bug-state', animate);
    window.addEventListener('creation-choice-notice', guide);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener('sm:bug-error', animate);
      window.removeEventListener('sm:bug-state', animate);
      window.removeEventListener('creation-choice-notice', guide);
    };
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    function visibility() { root.dataset.bugMotion = paused || document.hidden ? 'paused' : 'running'; }
    function storage(event) { if (event.key === motionKey || event.key === null) setPaused(readPaused()); }
    visibility();
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('storage', storage);
    return () => { document.removeEventListener('visibilitychange', visibility); window.removeEventListener('storage', storage); delete root.dataset.bugMotion; };
  }, [paused]);
  function toggleMotion() {
    setPaused(value => {
      try { localStorage.setItem(motionKey, value ? 'running' : 'paused'); } catch { /* Also works without storage. */ }
      return !value;
    });
  }
  return { motion, hasError, paused, toggleMotion, act };
}

export function BugCompanion({ children }) {
  const dialog = useRef(null), button = useRef(null);
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(readCompact);
  const life = useBugLife();
  const welcome = useCallback(() => { setOpen(true); window.dispatchEvent(new CustomEvent('sm:bug-state', { detail: 'welcome' })); }, []);
  useBugPersonalSpace(button, welcome, !open && !life.paused && !compact && life.motion === 'idle');
  useEffect(() => {
    function storage(event) { if (event.key === compactKey || event.key === null) setCompact(readCompact()); }
    window.addEventListener('storage', storage);
    return () => window.removeEventListener('storage', storage);
  }, []);
  function toggleCompact() {
    const next = !compact; setCompact(next);
    try { localStorage.setItem(compactKey, String(next)); } catch { /* Keep the choice for this page. */ }
  }
  useEffect(() => {
    const modal = dialog.current;
    if (!open || !modal) return;
    modal.showModal();
    return () => modal.close();
  }, [open]);
  function close() { setOpen(false); requestAnimationFrame(() => button.current?.focus()); }
  return <>
    <button ref={button} className={`bug-companion${compact ? ' bug-compact' : ''}`} aria-label={`the Bug - report a bug or get support${life.hasError ? '. Error details available' : ''}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => { setOpen(true); life.act('welcome'); }}>
      <BugMascot state={life.motion} size={compact ? 38 : 84} />{life.hasError && <span className="bug-error-dot" aria-hidden="true" />}
    </button>
    {open && <dialog ref={dialog} className="bug-dialog" aria-labelledby="bug-dialog-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => {
      if (event.target !== dialog.current) return;
      const bounds = dialog.current.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
    }}>
      <header className="bug-dialog-header"><BugMascot state={life.motion} size={86} /><div><h2 id="bug-dialog-title">the Bug</h2><p>Tell me what happened. I'll bring it to the team.</p></div><button type="button" className="bug-close" aria-label="Close the Bug" onClick={close}>×</button></header>
      <BugPaths />{children}
      <a className="bug-support-link" href="/support">Visit support &amp; your tickets</a>
      <div className="bug-companion-controls"><button type="button" className="bug-motion-toggle" aria-pressed={life.paused} onClick={life.toggleMotion}>{life.paused ? 'Resume Bug’s animations' : 'Pause Bug’s animations'}</button>
        <button type="button" className="bug-size-toggle" aria-pressed={compact} onClick={toggleCompact}>{compact ? 'Show Bug at full size' : 'Minimize Bug'}</button></div>
    </dialog>}
  </>;
}
