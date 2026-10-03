import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({ authenticated: false, loading: false, profile: null, frames: null }));
vi.mock('convex/react', () => ({
  ConvexReactClient: class {},
  useConvexAuth: () => ({ isAuthenticated: state.authenticated, isLoading: state.loading }),
  useQuery: (reference, args) => {
    if (args === 'skip') return undefined;
    const name=reference[Symbol.for('functionName')];
    return name === 'profiles:mine' ? state.profile : name === 'profileFrames:mine' ? state.frames : name === 'chronicles:feed' ? {posts:[],next:null} : name === 'chronicles:eligibility' ? state.profile?.reviewStatus === 'approved' : name === 'profiles:canReview' ? false : [];
  },
  useMutation: () => vi.fn(),
  useAction: () => vi.fn(),
  useConvex: () => ({}),
}));
vi.mock('@convex-dev/auth/react', () => ({
  ConvexAuthProvider: ({ children }) => children,
  useAuthActions: () => ({ signIn: vi.fn(), signOut: vi.fn() }),
}));
vi.mock('../profile-friends.jsx', () => ({ FriendsArea: () => <section>Friends</section>, FriendActions: () => null }));

beforeEach(() => {
  state.authenticated = false;
  state.loading = false;
  state.profile = null;
  state.frames = null;
  vi.stubGlobal('window', { savageMasterHome: false });
  vi.stubGlobal('document', { getElementById: () => null });
  vi.stubGlobal('location', new URL('http://localhost/profile'));
});

async function renderApp(search = '') {
  vi.stubGlobal('location', new URL('http://localhost/profile' + search));
  const { App } = await import('../profile.jsx');
  return renderToStaticMarkup(<App />);
}

test('landing offers account entry and the separate character journey', async () => {
  const { Home } = await import('../home.jsx');
  const html = renderToStaticMarkup(<Home />);
  expect(html).toContain('src="/logo.png"');
  expect(html.match(/<a /g)).toHaveLength(4);
  expect(html).toContain('href="/create"');
  expect(html).toContain('href="/install"');
  expect(html).toContain('data-install-app');
  expect(html).toContain('href="/profile?entry=signUp"');
  expect(html).toContain('href="/profile?entry=signIn"');
  expect(html).toContain('Your character. Your table. Your story.');
  expect(html).not.toMatch(/<nav|<footer|home-games|home-features/);
});

test('new members enter account creation and returning members enter sign-in', async () => {
  const signup = await renderApp('?entry=signUp');
  expect(signup).toContain('Create Account');
  expect(signup).toContain('autoComplete="new-password"');
  expect(signup).toContain('name="acceptedTerms"');
  expect(signup).toMatch(/<input(?=[^>]*name="acceptedTerms")(?=[^>]*required="")(?=[^>]*value="2026-10-03")[^>]*>/);
  expect(signup).toContain('href="/legal#terms"');
  expect(signup).toContain('href="/legal#privacy"');
  expect(signup).not.toContain('checked=""');
  expect(signup).toContain('build your profile');
  expect(signup).not.toContain('aria-label="Workspace"');
  const signin = await renderApp('?entry=signIn');
  expect(signin).toContain('>Sign In</button>');
  expect(signin).toContain('autoComplete="current-password"');
  expect(signin).toContain('Sign in to return to your profile.');
  expect(signin).not.toContain('name="acceptedTerms"');
});

test('an authenticated member without a saved profile starts the guided wizard', async () => {
  state.authenticated = true;
  const html = await renderApp('?entry=signUp');
  expect(html).toContain('Build your profile');
  expect(html).toContain('Step 1 of 5');
  expect(html).toContain('Next: Background');
  expect(html).not.toContain('Create Account');
});

test('saved accounts open their profile directly regardless of the entry button', async () => {
  state.authenticated = true;
  state.profile = {
    _id: 'saved-profile', handle: 'table-hero', displayName: 'Saved Hero',
    bio: 'My saved story', games: ['Savage Worlds'], roles: ['player'], memory: '',
    links: [], favorites: [], highlights: [], reviewStatus: 'private',
    appearance: { background: 'midnight', accent: 'gold', font: 'classic', layout: 'balanced', sections: ['about', 'games', 'memory', 'characters', 'journal'] },
  };
  for (const entry of ['signIn', 'signUp']) {
    const html = await renderApp('?entry=' + entry);
    expect(html).toContain('Saved Hero');
    expect(html).toContain('My saved story');
    expect(html).toContain('Edit profile &amp; background');
    expect(html).not.toContain('Step 1 of 5');
    expect(html).not.toContain('profile-settings');
    expect(html).not.toContain('Welcome to Savage Master /');
  }
});

test('the welcome tour offers real workshops and can be skipped', async () => {
  const { WelcomeTour } = await import('../profile.jsx');
  const html = renderToStaticMarkup(<WelcomeTour onFinish={() => {}} />);
  expect(html).toContain('Your heroes start here');
  expect(html).toContain('href="/?game=savage"');
  expect(html).toContain('href="/dnd"');
  expect(html).toContain('href="/pathfinder"');
  expect(html).toContain('Skip tour');
});

test('profile status explains the review gate and shows the private change request', async () => {
  const { ProfileReviewStatus } = await import('../profile.jsx');
  const pending = renderToStaticMarkup(<ProfileReviewStatus profile={{ reviewStatus: 'pending' }} />);
  expect(pending).toContain('Awaiting profile review');
  expect(pending).toContain('Approval will enable your public profile and Chronicles posting');
  const approved = renderToStaticMarkup(<ProfileReviewStatus profile={{ reviewStatus: 'approved' }} />);
  expect(approved).toContain('You can post and share updates in Chronicles');
  const rejected = renderToStaticMarkup(<ProfileReviewStatus profile={{ reviewStatus: 'rejected', reviewNote: 'Remove exposed personal details.' }} />);
  expect(rejected).toContain('Remove exposed personal details.');
  expect(rejected).toContain('Your profile needs changes');
});

test('a review link asks guests to sign in and does not show private profiles', async () => {
  const html = await renderApp('?reviews=1');
  expect(html).toContain('Profile review queue');
  expect(html).toContain('Sign in with your authorized reviewer account');
  expect(html).not.toContain('Approve profile');
});

test('the dedicated moderation page has its own sign-in gate and does not start profile setup', async () => {
  vi.stubGlobal('location', new URL('http://localhost/profile-reviews?profile=example'));
  const { App } = await import('../profile.jsx');
  const html = renderToStaticMarkup(<App />);
  expect(html).toContain('Private moderation workspace');
  expect(html).toContain('Sign in with your authorized reviewer account');
  expect(html).not.toContain('Build your profile');
});

test('own-profile approval is visibly disabled before attempting the server action', async () => {
  const { ReviewCard, reviewError } = await import('../profile.jsx');
  const html = renderToStaticMarkup(<ReviewCard profile={{ ...state.profile, _id: 'own', handle: 'own-profile', displayName: 'Me', bio: '', games: [], roles: [], links: [], favorites: [], highlights: [], appearance: { sections: [] }, isOwnProfile: true }} onStatus={() => {}} />);
  expect(html).toContain('Another authorized reviewer must review it');
  expect(html).toMatch(/<button(?=[^>]*disabled="")[^>]*>Approve profile/);
  expect(reviewError({ data: 'Another reviewer must review your own profile.' })).toBe('Another reviewer must review your own profile.');
});

test('frame controls show only earned options, default on, and preserve the award when hidden', async () => {
  state.authenticated = true;
  state.frames = { active: 'founding-100', available: ['founding-100'], enabled: true, selection: 'auto' };
  const { ProfileFrameSettings } = await import('../profile-frame-settings.jsx');
  const visible = renderToStaticMarkup(<ProfileFrameSettings />);
  expect(visible).toContain('Show my earned profile frame');
  expect(visible).toContain('checked=""');
  expect(visible).toContain('founding-100-v1.webp');
  expect(visible).not.toContain('<option value="admin">');
  state.frames = { ...state.frames, enabled: false, active: null };
  const hidden = renderToStaticMarkup(<ProfileFrameSettings />);
  expect(hidden).not.toContain('checked=""');
  expect(hidden).not.toContain('founding-100-v1.webp');
  expect(hidden).toContain('<option value="founding-100">');
});
