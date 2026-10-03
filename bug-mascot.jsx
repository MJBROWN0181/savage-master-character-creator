import React, { useEffect, useId, useRef, useState } from 'react';
import './bug-mascot.css';
import { useBugGesture } from './bug-gestures.js';

export const bugStates = ['idle', 'inspect', 'sending', 'success', 'welcome', 'guide', 'announce'];
export function signalBug(state) {
  if (bugStates.includes(state)) window.dispatchEvent(new CustomEvent('sm:bug-state', { detail: state }));
}
// Rig the approved transparent artwork without replacing Bug's face or costume.
const parts = {
  leftUpper: 'M0 0 H310 V219 L434 407 L411 441 Q397 465 424 490 L392 517 Q371 526 357 558 L337 579 H0Z',
  rightUpper: 'M865 0 H1254 V636 L984 630 L988 574 L999 503 L966 476 L891 496 L835 475 L823 447Z',
  leftLower: 'M12 834 Q30 754 106 703 L210 673 L226 697 L202 729 L200 758 L175 783 L176 807 Q132 878 66 895 Q7 895 12 834Z',
  rightLower: 'M1010 630 H1254 V960 H965 L950 900 L975 842 L981 800 L999 751 L984 688Z',
  head: 'M411 441 Q452 371 474 342 Q479 280 557 242 Q609 184 663 221 Q751 226 804 371 L812 418 Q796 479 766 490 L733 518 L639 509 L563 501 L473 489 Q416 484 411 441Z M321 50 H545 L596 289 L548 295 L504 205 L312 215Z M631 0 H865 V125 L733 231 L693 277 L649 268 L655 165Z',
  tome: 'M491 508 L511 489 L651 531 L721 565 L758 546 L939 477 L981 490 L1000 501 L989 562 L991 619 L968 653 L951 699 L795 747 L743 766 L690 748 L514 701 L492 640 L455 624 L445 594 L464 568 L496 558Z',
};
const eyes = [
  { name: 'left', x: 587, y: 415, rx: 35, ry: 28, opening: 'M540 408 Q557 383 587 387 Q618 388 627 411 Q625 436 598 443 Q561 447 540 408Z', crease: 'M544 409 Q579 394 623 416' },
  { name: 'right', x: 725, y: 376, rx: 26, ry: 34, opening: 'M697 374 Q703 348 728 345 Q754 342 763 367 Q771 394 748 407 Q715 420 697 391Z', crease: 'M700 377 Q727 360 760 378' },
];
export function BugMascot({ state = 'idle', size = 80, label = '', paused = false, gesture }) {
  const id = `bug-${useId().replace(/:/g, '')}`;
  const creature = useRef(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(creature.current);
    return () => observer.disconnect();
  }, []);
  const safeState = bugStates.includes(state) ? state : 'idle';
  const pose = useBugGesture({ state: safeState, paused, visible, gesture });
  const cellStyle = frame => ({ backgroundPosition: `${(frame % 4) * 100 / 3}% ${Math.floor(frame / 4) * 100 / 3}%` });
  useEffect(() => {
    const node = creature.current;
    // React to nearby attention; working eyes keep their task-specific gaze.
    const target = node.closest('.bug-companion, .bug-profile-hero, .support-hero, article');
    if (!target || !['idle', 'welcome'].includes(safeState) || paused) return;
    function look(event) {
      if (node.classList.contains('bug-offscreen')) return;
      const bounds = node.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = Math.max(-8, Math.min(8, (event.clientX - bounds.left - bounds.width * .52) / bounds.width * 16));
      const y = Math.max(-4, Math.min(6, (event.clientY - bounds.top - bounds.height * .32) / bounds.height * 12));
      node.style.setProperty('--bug-gaze-x', `${x}px`);
      node.style.setProperty('--bug-gaze-y', `${y}px`);
      node.classList.add('bug-attentive');
    }
    function rest() { node.classList.remove('bug-attentive'); }
    target.addEventListener('pointermove', look, { passive: true });
    target.addEventListener('pointerleave', rest);
    return () => { rest(); target.removeEventListener('pointermove', look); target.removeEventListener('pointerleave', rest); };
  }, [safeState, paused]);
  const art = <image href="/images/art/the-bug.png" width="1254" height="1254" />;
  return <span ref={creature} className={`bug-mascot bug-motion-${safeState}${paused ? ' bug-paused' : ''}${visible ? '' : ' bug-offscreen'}`} style={{ '--bug-size': `${size}px` }} role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true}>
    <span className="bug-presence">
    {pose !== null && <span className={`bug-gesture${pose.ending ? ' bug-gesture-ending' : ''}`} data-frame={pose.frame}>
      <span className="bug-pose" style={cellStyle(pose.frame)} />
      {pose.previous !== null && pose.previous !== pose.frame && <span key={`${pose.previous}-${pose.frame}`} className="bug-pose bug-pose-out" style={cellStyle(pose.previous)} />}
    </span>}
    <span className="bug-book-light" />
    <svg className="bug-rig" viewBox="0 0 1254 1254" width={size} height={size} aria-hidden="true" focusable="false">
      <defs>
        {Object.entries(parts).map(([name, path]) => <clipPath key={name} id={`${id}-${name}`}><path d={path} /></clipPath>)}
        <linearGradient id={`${id}-eye-white`} x1="0%" y1="0%" x2="0%" y2="100%"><stop stopColor="#7c523c" /><stop offset=".35" stopColor="#cbb08b" /><stop offset="1" stopColor="#edd3ae" /></linearGradient>
        <linearGradient id={`${id}-lid`} x1="0%" y1="0%" x2="0%" y2="100%"><stop stopColor="#314138" /><stop offset=".55" stopColor="#375346" /><stop offset="1" stopColor="#1b302a" /></linearGradient>
        <radialGradient id={`${id}-eye-light`} cx="50%" cy="100%" r="80%"><stop stopColor="#ffe9a8" /><stop offset="1" stopColor="#ffc567" stopOpacity="0" /></radialGradient>
        {eyes.map(eye => <React.Fragment key={eye.name}>
          <clipPath id={`${id}-eye-${eye.name}`}><path d={eye.opening} /></clipPath>
          <clipPath id={`${id}-iris-${eye.name}`}><ellipse cx={eye.x} cy={eye.y} rx={eye.rx} ry={eye.ry} /></clipPath>
        </React.Fragment>)}
        <mask id={`${id}-body`} maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254">
          <rect width="1254" height="1254" fill="white" />
          {Object.values(parts).map((path, index) => <path key={index} d={path} fill="black" />)}
        </mask>
      </defs>
      <g className="bug-flight">
        {['leftUpper', 'rightUpper', 'leftLower', 'rightLower'].map(name => <g key={name} className={`bug-wing bug-wing-${name}`}><g clipPath={`url(#${id}-${name})`}>{art}</g></g>)}
        <g className="bug-body"> <g mask={`url(#${id}-body)`}>{art}</g>
          <path d="M470 480 Q640 455 780 484 L754 534 L530 529Z" fill="#262923" />
          <g className="bug-head"><g clipPath={`url(#${id}-head)`}>{art}</g>
            <g className="bug-live-eyes">{eyes.map(eye => <g key={eye.name} className={`bug-eye bug-eye-${eye.name}`} clipPath={`url(#${id}-eye-${eye.name})`}>
              <path d={eye.opening} fill={`url(#${id}-eye-white)`} />
              <g className="bug-gaze"><g clipPath={`url(#${id}-iris-${eye.name})`}>{art}</g></g>
              <path className="bug-eye-reflection" d={eye.opening} fill={`url(#${id}-eye-light)`} />
              <g className={`bug-eyelid bug-eyelid-${eye.name}`}><path d={eye.opening} fill={`url(#${id}-lid)`} /><path d={eye.crease} fill="none" stroke="#15251e" strokeWidth="4" strokeLinecap="round" /></g>
            </g>)}</g>
            <g className="bug-antenna-light" fill="#ffe3a0"><circle cx="359" cy="165" r="13" /><circle cx="808" cy="66" r="13" /></g>
          </g>
          <g className="bug-tome"><g clipPath={`url(#${id}-tome)`}>{art}</g></g>
        </g>
      </g>
    </svg>
    <span className="bug-rune bug-rune-one">&lt;/&gt;</span><span className="bug-rune bug-rune-two">{'{ }'}</span>
    {safeState === 'success' && <span className="bug-seal">✓</span>}
    </span>
  </span>;
}
export function BugGuide({ children, step = 0 }) {
  useEffect(() => { signalBug('guide'); }, [step]);
  return <div className="bug-guide"><BugMascot key={step} state="guide" size={86} /><div><strong>Bug's field notes</strong><p>{children}</p><a href="/support">Need a hand?</a></div></div>;
}
export function BugPaths() {
  return <nav className="bug-paths" aria-label="Bug's help"><a href="/support" onClick={() => signalBug('welcome')}>Open support</a><a href="/profile?tour=1" onClick={() => signalBug('guide')}>Start the setup wizard</a><a href="/profile?user=bug" onClick={() => signalBug('announce')}>Bug's updates</a></nav>;
}
