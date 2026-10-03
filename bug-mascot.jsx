import React, { useEffect } from 'react';
import './bug-mascot.css';

export const bugStates = ['idle', 'inspect', 'sending', 'success', 'welcome', 'guide', 'announce'];
export function signalBug(state) {
  if (bugStates.includes(state)) window.dispatchEvent(new CustomEvent('sm:bug-state', { detail: state }));
}
export function BugMascot({ state = 'idle', size = 80, label = '' }) {
  const safeState = bugStates.includes(state) ? state : 'idle';
  return <span className={`bug-mascot bug-motion-${safeState}`} style={{ '--bug-size': `${size}px` }} role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true}>
    <span className="bug-book-light" /><img src="/images/art/the-bug.png" alt="" width={size} height={size} />
    <span className="bug-rune bug-rune-one">&lt;/&gt;</span><span className="bug-rune bug-rune-two">{'{ }'}</span>
    {safeState === 'success' && <span className="bug-seal">✓</span>}
  </span>;
}
export function BugGuide({ children, step = 0 }) {
  useEffect(() => { signalBug('guide'); }, [step]);
  return <div className="bug-guide"><BugMascot key={step} state="guide" size={86} /><div><strong>Bug's field notes</strong><p>{children}</p><a href="/support">Need a hand?</a></div></div>;
}
export function BugPaths() {
  return <nav className="bug-paths" aria-label="Bug's help"><a href="/support">Open support</a><a href="/profile?tour=1">Start the setup wizard</a><a href="/profile?user=bug">Bug's updates</a></nav>;
}
