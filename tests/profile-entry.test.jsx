import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({ authenticated: false, loading: false, profile: null }));
vi.mock('convex/react', () => ({
  ConvexReactClient: class {},
  useConvexAuth: () => ({ isAuthenticated: state.authenticated, isLoading: state.loading }),
  useQuery: (reference, args) => {
    if (args === 'skip') return undefined;
    const name=reference[Symbol.for('functionName')];
    return name === 'profiles:mine' ? state.profile : name === 'chronicles:feed' ? {posts:[],next:null} : name === 'chronicles:eligibility' ? state.profile?.reviewStatus === 'approved' : name === 'profiles:canReview' ? false : [];
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
  expect(signup).toContain('build your profile');
  expect(signup).not.toContain('aria-label="Workspace"');
  const signin = await renderApp('?entry=signIn');
  expect(signin).toContain('>Sign In</button>');
  expect(signin).toContain('autoComplete="current-password"');
  expect(signin).toContain('Sign in to return to your profile.');
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
