// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { BugMascot, BugGuide, BugPaths } from '../bug-mascot.jsx';
import { BugProfileHeader } from '../bug-profile.jsx';
import { postLink } from '../chronicle-share.jsx';
import { BugCompanion } from '../bug-companion.jsx';

let root, host;
beforeEach(() => {
  vi.useFakeTimers(); vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('requestAnimationFrame', callback => { callback(); return 1; });
  localStorage.clear(); host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});
afterEach(async () => { await act(() => root.unmount()); host.remove(); vi.useRealTimers(); vi.unstubAllGlobals(); delete window.smBugCapture; });
async function mount() { await act(() => root.render(<BugCompanion><p>Support form stays available.</p></BugCompanion>)); }
async function signal(state, type = 'sm:bug-state') { await act(() => window.dispatchEvent(new CustomEvent(type, { detail: state }))); }
const motion = () => document.querySelector('.bug-companion .bug-mascot').className;

test('delivery lasts until the real result, and background errors and hints cannot interrupt it', async () => {
  await mount(); await signal('sending');
  await signal(undefined, 'sm:bug-error'); await signal('guide'); await signal('announce');
  await act(() => vi.advanceTimersByTime(60000));
  expect(motion()).toContain('bug-motion-sending'); expect(document.querySelector('.bug-error-dot')).toBeTruthy();
  await signal('success'); expect(motion()).toContain('bug-motion-success');
  await act(() => vi.advanceTimersByTime(3200)); expect(motion()).toContain('bug-motion-idle');
});

test('a failed delivery investigates the error and wizard notices use the guiding pose', async () => {
  await mount(); await signal('sending'); await signal('inspect'); expect(motion()).toContain('bug-motion-inspect');
  await act(() => vi.advanceTimersByTime(6000)); expect(motion()).toContain('bug-motion-idle');
  await signal({}, 'creation-choice-notice'); expect(motion()).toContain('bug-motion-guide');
  await signal('unknown'); expect(motion()).toContain('bug-motion-guide');
  await act(() => vi.advanceTimersByTime(7000)); expect(motion()).toContain('bug-motion-idle');
});

test('support opens and closes with focus restored, and pausing persists without disabling help', async () => {
  await mount(); const button = document.querySelector('.bug-companion');
  await act(() => button.click()); expect(document.querySelector('dialog').open).toBe(true); expect(button.getAttribute('aria-expanded')).toBe('true');
  const pause = document.querySelector('.bug-motion-toggle');
  await act(() => pause.click()); expect(pause.getAttribute('aria-pressed')).toBe('true');
  expect(document.documentElement.dataset.bugMotion).toBe('paused'); expect(localStorage.getItem('sm-bug-motion-v1')).toBe('paused');
  expect(document.querySelector('dialog').textContent).toContain('Support form stays available.');
  await act(() => document.querySelector('.bug-close').click()); expect(document.querySelector('dialog')).toBeNull(); expect(document.activeElement).toBe(button);
  await act(() => root.unmount()); root = createRoot(host); await mount(); expect(document.documentElement.dataset.bugMotion).toBe('paused');
  await act(() => button.isConnected ? button.click() : document.querySelector('.bug-companion').click());
  await act(() => document.querySelector('.bug-motion-toggle').click()); expect(document.documentElement.dataset.bugMotion).toBe('running');
});

test('independent rigs have unique masks and observers release when Bug leaves the page', async () => {
  const observers = [];
  vi.stubGlobal('IntersectionObserver', class { constructor(callback) { this.callback = callback; this.disconnect = vi.fn(); observers.push(this); } observe() {} });
  await act(() => root.render(<><BugMascot /><BugMascot state="sending" /></>));
  const ids = [...host.querySelectorAll('[id]')].map(node => node.id); expect(new Set(ids).size).toBe(ids.length);
  const first = host.querySelector('.bug-mascot'); await act(() => observers[0].callback([{ isIntersecting: false }])); expect(first.classList.contains('bug-offscreen')).toBe(true);
  expect(host.querySelectorAll('.bug-wing')).toHaveLength(8); expect(host.querySelectorAll('.bug-head')).toHaveLength(2); expect(host.querySelectorAll('.bug-tome')).toHaveLength(2);
  await act(() => root.render(null)); expect(observers.every(observer => observer.disconnect.mock.calls.length === 1)).toBe(true);
});

test('life listeners and completion timers are removed on unmount', async () => {
  await mount(); await signal('inspect'); expect(vi.getTimerCount()).toBe(1);
  await act(() => root.render(null)); expect(vi.getTimerCount()).toBe(0);
  await signal('sending'); expect(vi.getTimerCount()).toBe(0); expect(document.documentElement.dataset.bugMotion).toBeUndefined();
});

test('hidden tabs pause all Bug artwork and cross-tab animation preferences stay in sync', async () => {
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  await mount(); expect(document.documentElement.dataset.bugMotion).toBe('running');
  hidden.mockReturnValue(true); await act(() => document.dispatchEvent(new Event('visibilitychange'))); expect(document.documentElement.dataset.bugMotion).toBe('paused');
  hidden.mockReturnValue(false); await act(() => document.dispatchEvent(new Event('visibilitychange'))); expect(document.documentElement.dataset.bugMotion).toBe('running');
  localStorage.setItem('sm-bug-motion-v1', 'paused');
  await act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'sm-bug-motion-v1', newValue: 'paused' })));
  expect(document.documentElement.dataset.bugMotion).toBe('paused');
  hidden.mockRestore();
});

test('minimizing keeps support and error alerts available and the size choice survives navigation', async () => {
  await mount(); await act(() => document.querySelector('.bug-companion').click());
  await act(() => document.querySelector('.bug-size-toggle').click());
  expect(document.querySelector('.bug-companion').classList.contains('bug-compact')).toBe(true);
  expect(localStorage.getItem('sm-bug-compact-v1')).toBe('true');
  await signal(undefined, 'sm:bug-error'); expect(document.querySelector('.bug-error-dot')).toBeTruthy();
  await act(() => document.querySelector('.bug-close').click());
  await act(() => document.querySelector('.bug-companion').click()); expect(document.querySelector('dialog').open).toBe(true);
  await act(() => root.unmount()); root = createRoot(host); await mount();
  expect(document.querySelector('.bug-companion').classList.contains('bug-compact')).toBe(true);
});

test('Bug notices nearby pointers, but investigating and paused eyes keep their own gaze', async () => {
  const render = props => root.render(<article><BugMascot {...props} /></article>);
  await act(() => render({}));
  const creature = host.querySelector('.bug-mascot'), nearby = host.querySelector('article');
  creature.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 200 });
  const look = () => nearby.dispatchEvent(new MouseEvent('pointermove', { clientX: 1000, clientY: 1000, bubbles: true }));
  look(); expect(creature.classList.contains('bug-attentive')).toBe(true);
  expect(Math.abs(parseFloat(creature.style.getPropertyValue('--bug-gaze-x')))).toBeLessThanOrEqual(12);
  expect(Math.abs(parseFloat(creature.style.getPropertyValue('--bug-gaze-y')))).toBeLessThanOrEqual(9);
  nearby.dispatchEvent(new MouseEvent('pointerleave')); expect(creature.classList.contains('bug-attentive')).toBe(false);
  await act(() => render({ state: 'inspect' })); look(); expect(creature.classList.contains('bug-attentive')).toBe(false);
  await act(() => render({ paused: true })); look(); expect(creature.classList.contains('bug-attentive')).toBe(false);
});

test('Bug’s decorative animation does not clutter accessible names; labelled art is available', () => {
  expect(renderToStaticMarkup(<BugMascot state="sending" />)).toContain('aria-hidden="true"');
  const art = renderToStaticMarkup(<BugMascot state="success" label="Bug saved your ticket" />);
  expect(art).toContain('role="img"'); expect(art).toContain('aria-label="Bug saved your ticket"');
});
test('Bug’s setup guidance and menu connect to real support, wizard and public profile routes', () => {
  const html = renderToStaticMarkup(<><BugGuide>Choose what you share.</BugGuide><BugPaths /></>);
  expect(html).toContain('Choose what you share.'); expect(html).toContain('href="/support"');
  expect(html).toContain('href="/profile?tour=1"'); expect(html).toContain('href="/profile?user=bug"');
});
test('official profile offers account sign-in for guests and an accessible unfollow for followers', () => {
  const guest = renderToStaticMarkup(<BugProfileHeader bio="Keeper of the code" />);
  expect(guest).toContain('Sign in to follow Bug'); expect(guest).toContain('Official Savage Master companion');
  const follower = renderToStaticMarkup(<BugProfileHeader authenticated followed bio="Keeper" />);
  expect(follower).toContain('Unfollow Bug'); expect(follower).toContain('aria-pressed="true"');
  expect(postLink('public id', 'https://smsheets.com')).toBe('https://smsheets.com/p/public%20id');
});

test('body gestures stow the tome, articulate the arm, and yield immediately to work', async () => {
  const images = [];
  vi.stubGlobal('Image', class { constructor() { images.push(this); } });
  await act(() => root.render(<BugMascot gesture="scratch" />));
  await act(() => images.at(-1).onload());
  expect(host.querySelector('.bug-gesture').dataset.frame).toBe('0');
  await act(() => vi.advanceTimersByTime(710));
  expect(host.querySelector('.bug-gesture').dataset.frame).toBe('3');
  await act(() => vi.advanceTimersByTime(710));
  expect(host.querySelector('.bug-gesture').dataset.frame).toBe('10');
  await act(() => root.render(<BugMascot state="sending" gesture="scratch" />));
  expect(host.querySelector('.bug-gesture')).toBeNull();
  await act(() => images.at(-1).onload());
  await act(() => vi.advanceTimersByTime(30000));
  expect(host.querySelector('.bug-gesture')).toBeNull();
  await act(() => root.render(<BugMascot gesture="think" paused />));
  await act(() => images.at(-1).onload());
  expect(host.querySelector('.bug-gesture')).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
});

test('idle gestures return the book and clean up when removed', async () => {
  const images = [];
  vi.stubGlobal('Image', class { constructor() { images.push(this); } });
  await act(() => root.render(<BugMascot gesture="stow" />));
  await act(() => images.at(-1).onload());
  await act(() => vi.advanceTimersByTime(2180));
  expect(host.querySelector('.bug-gesture').dataset.frame).toBe('0');
  await act(() => vi.advanceTimersByTime(320));
  expect(host.querySelector('.bug-gesture')).toBeNull();
  await act(() => root.render(null));
  expect(vi.getTimerCount()).toBe(0);
});

test('Bug allows quick clicks through, invites deliberate hover, and avoids focused controls', async () => {
  await mount();
  const bug = host.querySelector('.bug-companion');
  bug.getBoundingClientRect = () => ({left:900,right:998,top:650,bottom:758,width:98,height:108});
  const point = type => new PointerEvent(type, {bubbles:true,clientX:940,clientY:690,pointerType:'mouse'});
  await act(() => document.dispatchEvent(point('pointermove')));
  await act(() => vi.advanceTimersByTime(599));
  expect(bug.classList.contains('bug-invited')).toBe(false);
  await act(() => vi.advanceTimersByTime(1));
  expect(bug.classList.contains('bug-invited')).toBe(true);
  await act(() => document.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:100,clientY:100,pointerType:'mouse'})));
  expect(bug.classList.contains('bug-invited')).toBe(false);
  const underlying = document.createElement('button'); host.append(underlying);
  underlying.getBoundingClientRect = () => ({left:880,right:1000,top:640,bottom:770});
  await act(() => underlying.dispatchEvent(new FocusEvent('focusin',{bubbles:true})));
  expect(bug.style.getPropertyValue('--bug-step')).not.toBe('0px');
  underlying.remove();
});

test('a resting finger opens Bug, while a scrolling finger cancels the invitation', async () => {
  await mount();
  const bug = host.querySelector('.bug-companion');
  bug.getBoundingClientRect = () => ({left:0,right:98,top:0,bottom:108,width:98,height:108});
  const touch = (type,x=40) => new PointerEvent(type,{bubbles:true,clientX:x,clientY:40,pointerType:'touch'});
  await act(() => document.dispatchEvent(touch('pointerdown')));
  await act(() => document.dispatchEvent(touch('pointermove',70)));
  await act(() => vi.advanceTimersByTime(700));
  expect(host.querySelector('dialog')).toBeNull();
  await act(() => document.dispatchEvent(touch('pointerdown')));
  await act(() => vi.advanceTimersByTime(650));
  expect(host.querySelector('dialog').open).toBe(true);
  const click = new MouseEvent('click',{bubbles:true,cancelable:true});
  document.dispatchEvent(click);
  expect(click.defaultPrevented).toBe(true);
});


test('free flight is interruptible by a report and releases its animations and timers', async () => {
  const flights = [];
  const bounds = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    return this.classList.contains('bug-companion') ? {left:900,top:600,right:976,bottom:687,width:76,height:87} : {left:0,top:0,right:0,bottom:0,width:0,height:0};
  });
  const originalAnimate = HTMLElement.prototype.animate;
  HTMLElement.prototype.animate = function (frames) {
    const handle = { cancel: vi.fn(), onfinish: null, frames }; flights.push(handle); return handle;
  };
  try {
    await mount();
    await act(() => vi.advanceTimersByTime(12000));
    expect(host.querySelector('.bug-companion').classList.contains('bug-airborne')).toBe(true);
    expect(flights[0].frames.length).toBe(25);
    await signal('sending');
    expect(flights.every(flight => flight.cancel.mock.calls.length > 0)).toBe(true);
    expect(host.querySelector('.bug-companion').classList.contains('bug-airborne')).toBe(false);
    await act(() => root.render(null));
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    bounds.mockRestore();
    if (originalAnimate) HTMLElement.prototype.animate = originalAnimate;
    else delete HTMLElement.prototype.animate;
  }
});
