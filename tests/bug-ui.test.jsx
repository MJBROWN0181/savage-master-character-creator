import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { BugMascot, BugGuide, BugPaths } from '../bug-mascot.jsx';
import { BugProfileHeader } from '../bug-profile.jsx';
import { postLink } from '../chronicle-share.jsx';

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
  expect(postLink('public id', 'https://smsheets.com')).toBe('https://smsheets.com/chronicles?post=public%20id');
});
