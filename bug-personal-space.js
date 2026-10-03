import { useEffect, useRef } from 'react';
import { bugFlightPath } from './bug-flight.mjs';

// Let native clicks reach the page until someone deliberately lingers on Bug.
export function useBugPersonalSpace(button, onHold, roaming = true) {
  const roam = useRef(roaming), refresh = useRef(null);
  useEffect(() => { roam.current = roaming; refresh.current?.(); }, [roaming]);
  useEffect(() => {
    const node = button.current;
    if (!node) return;
    let dwell, release, origin, held = false, touch = false, offsetX = 0, offsetY = 0;
    let lastPointer;
    let flight, bank, patrol, disposed = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    function stopFlight() {
      clearTimeout(patrol);
      if (flight) {
        const transform = getComputedStyle(node).transform;
        const matrix = new DOMMatrixReadOnly(transform === 'none' ? undefined : transform);
        node.style.setProperty('--bug-step', `${matrix.m41}px`);
        node.style.setProperty('--bug-rise', `${matrix.m42}px`);
        flight.onfinish = null; flight.cancel(); flight = null;
      }
      bank?.cancel(); bank = null;
      node.classList.remove('bug-airborne');
    }
    function canRoam() {
      return !disposed && roam.current && !document.hidden && !reduced.matches && document.documentElement.dataset.bugMotion !== 'paused'
        && !origin && document.activeElement !== node && !document.querySelector('dialog[open]') && typeof node.animate === 'function' && node.getBoundingClientRect().width > 0;
    }
    function schedule(delay = 6000 + Math.random() * 6000) {
      clearTimeout(patrol);
      if (canRoam()) patrol = setTimeout(takeFlight, delay);
    }
    function takeFlight() {
      if (!canRoam()) return;
      const box = node.getBoundingClientRect(), viewport = window.visualViewport;
      const bounds = { left: (viewport?.offsetLeft || 0) + 16, top: (viewport?.offsetTop || 0) + 16 };
      bounds.right = Math.max(bounds.left, bounds.left + (viewport?.width || innerWidth) - box.width - 32);
      bounds.bottom = Math.max(bounds.top, bounds.top + (viewport?.height || innerHeight) - box.height - 32);
      const start = { x: Math.max(bounds.left, Math.min(bounds.right, box.left)), y: Math.max(bounds.top, Math.min(bounds.bottom, box.top)) };
      const focused = document.activeElement;
      const focusBox = focused && focused !== document.body ? focused.getBoundingClientRect() : null;
      const candidates = [bounds.left, bounds.right].flatMap(x => [.18, .5, .82].map(y => ({ x, y: bounds.top + (bounds.bottom - bounds.top) * y })));
      const choices = candidates.filter(point => Math.hypot(point.x - start.x, point.y - start.y) > 90
        && (!lastPointer || Math.hypot(point.x + box.width / 2 - lastPointer.x, point.y + box.height / 2 - lastPointer.y) > 120)
        && (!focusBox || point.x + box.width < focusBox.left - 20 || point.x > focusBox.right + 20 || point.y + box.height < focusBox.top - 20 || point.y > focusBox.bottom + 20));
      if (!choices.length) { schedule(); return; }
      const end = choices[Math.floor(Math.random() * choices.length)];
      const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform === 'none' ? undefined : getComputedStyle(node).transform);
      const base = { x: box.left - matrix.m41, y: box.top - matrix.m42 };
      const path = bugFlightPath(start, end, bounds);
      const timing = { duration: Math.max(3000, Math.min(6500, Math.hypot(end.x - start.x, end.y - start.y) * 9)), easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' };
      node.classList.add('bug-airborne');
      flight = node.animate(path.map(point => ({ transform: `translate(${point.x - base.x}px,${point.y - base.y}px)` })), timing);
      bank = node.querySelector('.bug-mascot')?.animate(path.map(point => ({ transform: `rotate(${point.bank}deg)` })), timing);
      flight.onfinish = () => {
        node.style.setProperty('--bug-step', `${end.x - base.x}px`);
        node.style.setProperty('--bug-rise', `${end.y - base.y}px`);
        flight.cancel(); flight = null; bank?.cancel(); bank = null;
        node.classList.remove('bug-airborne'); schedule();
      };
    }
    function resetRoam() { stopFlight(); schedule(5000); }
    refresh.current = resetRoam;
    const inside = (event) => {
      const box = node.getBoundingClientRect();
      return event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
    };
    function clear() { clearTimeout(dwell); origin = null; node.classList.remove('bug-invited'); }
    function place(avoid) {
      stopFlight();
      const box = node.getBoundingClientRect();
      const viewport = window.visualViewport;
      const left = (viewport?.offsetLeft || 0) + 12;
      const top = (viewport?.offsetTop || 0) + 12;
      const right = Math.max(left, left + (viewport?.width || window.innerWidth) - box.width - 24);
      const bottom = Math.max(top, top + (viewport?.height || window.innerHeight) - box.height - 24);
      const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
      const current = { x: clamp(box.left, left, right), y: clamp(box.top, top, bottom) };
      let target = current;
      if (avoid) {
        const candidates = [current, { x: right, y: bottom }, { x: left, y: bottom }, { x: right, y: top }, { x: left, y: top }];
        const overlap = point => point.x < avoid.right + 24 && point.x + box.width > avoid.left - 24 && point.y < avoid.bottom + 24 && point.y + box.height > avoid.top - 24;
        target = candidates.filter(point => !overlap(point)).sort((a, b) => Math.hypot(a.x - current.x, a.y - current.y) - Math.hypot(b.x - current.x, b.y - current.y))[0] || current;
      }
      // Read the in-flight transform when interrupted, not the last destination.
      const transform = getComputedStyle(node).transform;
      const matrix = transform && transform !== 'none' ? new DOMMatrixReadOnly(transform) : null;
      offsetX = (matrix?.m41 || 0) + target.x - box.left;
      offsetY = (matrix?.m42 || 0) + target.y - box.top;
      node.style.setProperty('--bug-step', `${offsetX}px`);
      node.style.setProperty('--bug-rise', `${offsetY}px`);
      schedule();
    }
    function dodge() {
      const point = origin || lastPointer;
      if (point) place({ left: point.x, right: point.x, top: point.y, bottom: point.y });
    }
    function invite(event, finger) {
      stopFlight();
      clear(); touch = finger; origin = { x: event.clientX, y: event.clientY };
      dwell = setTimeout(() => {
        node.classList.add('bug-invited');
        if (finger) { held = true; onHold(); }
      }, finger ? 650 : 600);
    }
    function move(event) {
      lastPointer = { x: event.clientX, y: event.clientY };
      if (event.pointerType === 'touch') {
        if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 10) clear();
        return;
      }
      if (!inside(event)) { const wasInterested = !!origin; clear(); if (wasInterested) schedule(); return; }
      if (!origin || Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 8) invite(event, false);
    }
    function down(event) {
      if (!inside(event) || node.classList.contains('bug-invited')) return;
      if (event.pointerType === 'touch' || event.pointerType === 'pen') invite(event, true);
      else { dodge(); clear(); schedule(); }
    }
    function up() {
      if (!touch) return;
      if (touch && origin && !held) dodge();
      clear(); touch = false; schedule();
      // Consume only the compatibility click from a deliberate long press.
      clearTimeout(release); release = setTimeout(() => { held = false; }, 500);
    }
    function click(event) { if (held) { event.preventDefault(); event.stopPropagation(); held = false; } }
    function cancel() { clear(); touch = false; held = false; stopFlight(); }
    function context(event) { if (touch && origin || held) event.preventDefault(); }
    function layout() {
      clear();
      node.classList.add('bug-layout-adjust');
      const focused = document.activeElement;
      place(focused && focused !== node && focused !== document.body ? focused.getBoundingClientRect() : undefined);
      // Viewport corrections are immediate; deliberate dodges glide.
      void node.offsetWidth;
      node.classList.remove('bug-layout-adjust');
    }
    function focus(event) { if (event.target !== node && event.target instanceof Element) place(event.target.getBoundingClientRect()); }
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(layout);
    resize?.observe(node);
    place();
    const motionObserver = new MutationObserver(resetRoam);
    motionObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bug-motion'] });
    document.addEventListener('visibilitychange', resetRoam);
    reduced.addEventListener('change', resetRoam);
    window.addEventListener('focus', resetRoam);
    window.addEventListener('resize', layout);
    window.addEventListener('scroll', layout, { passive: true });
    window.visualViewport?.addEventListener('resize', layout);
    window.visualViewport?.addEventListener('scroll', layout);
    document.addEventListener('focusin', focus);
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerdown', down, { passive: true });
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', cancel);
    document.addEventListener('click', click, true);
    document.addEventListener('contextmenu', context);
    window.addEventListener('blur', cancel);
    return () => {
      disposed = true; stopFlight(); refresh.current = null; motionObserver.disconnect();
      document.removeEventListener('visibilitychange', resetRoam);
      reduced.removeEventListener('change', resetRoam);
      window.removeEventListener('focus', resetRoam);
      clear(); clearTimeout(release); node.style.removeProperty('--bug-step'); node.style.removeProperty('--bug-rise');
      resize?.disconnect();
      window.removeEventListener('resize', layout);
      window.removeEventListener('scroll', layout);
      window.visualViewport?.removeEventListener('resize', layout);
      window.visualViewport?.removeEventListener('scroll', layout);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', cancel);
      document.removeEventListener('click', click, true);
      document.removeEventListener('contextmenu', context);
      window.removeEventListener('blur', cancel);
    };
  }, [button, onHold]);
}
