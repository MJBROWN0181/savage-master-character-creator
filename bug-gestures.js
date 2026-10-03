import { useEffect, useState } from 'react';

// Atlas cells are discrete drawn poses; holds let each gesture read at button size.
const stow = [[0, 280], [1, 190], [2, 220], [3, 260]];
const retrieve = [[3, 180], [2, 200], [1, 200], [0, 320]];
export const gestureFrames = {
  think: [...stow, [4, 240], [5, 380], [6, 720], [5, 280], [7, 240], ...retrieve],
  scratch: [...stow, [8, 220], [9, 180], [10, 140], [9, 140], [11, 150], [10, 160], [9, 190], [8, 260], ...retrieve],
  wave: [...stow, [12, 180], [13, 160], [14, 140], [15, 180], [14, 140], [13, 160], [12, 200], ...retrieve],
  stow: [...stow, [3, 650], ...retrieve],
};

export function useBugGesture({ state, paused, visible, gesture }) {
  const [pose, setPose] = useState(null);
  useEffect(() => {
    let timer, disposed = false, ready = false, round = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const root = document.documentElement;
    const image = new Image();
    function stop() { clearTimeout(timer); setPose(null); }
    function allowed() {
      return ready && !disposed && !paused && visible && !document.hidden && !reduced.matches && root.dataset.bugMotion !== 'paused';
    }
    function play(name) {
      if (!allowed()) return;
      const frames = gestureFrames[name];
      let index = 0;
      function next() {
        if (!allowed()) { stop(); return; }
        if (index === frames.length) {
          setPose(null);
          if (state === 'idle') timer = setTimeout(() => play(gesture || (round++ % 2 ? 'scratch' : 'think')), 22000 + Math.random() * 9000);
          return;
        }
        const [frame, duration] = frames[index++];
        setPose(previous => ({ frame, previous: previous?.frame ?? null, ending: index === frames.length }));
        timer = setTimeout(next, duration);
      }
      next();
    }
    function restart() {
      stop();
      if (!allowed()) return;
      // Reports and wizard guidance always take priority over idle pantomime.
      if (state === 'sending' || state === 'guide' || state === 'success' || state === 'announce') return;
      if (gestureFrames[gesture]) play(gesture);
      else if (state === 'welcome') play('wave');
      else if (state === 'inspect') timer = setTimeout(() => play('think'), 1800);
      else if (state === 'idle') timer = setTimeout(() => play(round++ % 2 ? 'scratch' : 'think'), 14000 + Math.random() * 6000);
    }
    image.onload = () => { ready = true; restart(); };
    image.src = '/images/art/the-bug-gestures.png';
    const observer = new MutationObserver(restart);
    observer.observe(root, { attributes: true, attributeFilter: ['data-bug-motion'] });
    document.addEventListener('visibilitychange', restart);
    reduced.addEventListener('change', restart);
    return () => {
      disposed = true; clearTimeout(timer); image.onload = null;
      observer.disconnect();
      document.removeEventListener('visibilitychange', restart);
      reduced.removeEventListener('change', restart);
    };
  }, [state, paused, visible, gesture]);
  // Hide a previous gesture immediately when a work state arrives.
  return ['sending', 'guide', 'success', 'announce'].includes(state) || paused || !visible ? null : pose;
}
