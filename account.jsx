import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexReactClient, useConvexAuth, useMutation, useQuery, useConvex } from 'convex/react';
import { ConvexAuthProvider, useAuthActions } from '@convex-dev/auth/react';
import { makeFunctionReference } from 'convex/server';

const url = import.meta.env.VITE_CONVEX_URL;
const listRef = makeFunctionReference('characters:list');
const loadRef = makeFunctionReference('characters:load');
const saveRef = makeFunctionReference('characters:save');

function CharacterAccount() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const convex = useConvex();
  const save = useMutation(saveRef);
  const characters = useQuery(listRef, isAuthenticated ? {} : 'skip');
  const [mode, setMode] = useState('signIn');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    window.characterCloud = {
      clearSelection: () => setSelectedId(null),
      save: async () => {
        if (!isAuthenticated) { setStatus('Sign in to save this character to your account.'); return; }
        const backup = { version: 1, character: window.savageMasterBridge.getCharacter() };
        if (!backup.character.name.trim()) { setStatus('Give your character a name first.'); return; }
        setBusy(true);
        try {
          const id = await save({ id: selectedId || undefined, snapshot: backup });
          setSelectedId(id);
          setStatus('Character saved to your account.');
        } catch (error) { setStatus(error.message); }
        finally { setBusy(false); }
      },
    };
    return () => { delete window.characterCloud; };
  }, [isAuthenticated, save, selectedId]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus('');
    const form = new FormData(event.currentTarget);
    form.set('flow', mode);
    try {
      const signedIn = await signIn('password', form);
      if (mode === 'reset') {
        setResetEmail(String(form.get('email')));
        setMode('reset-verification');
        setStatus('Check your email for the reset code.');
      } else if (!signedIn && (mode === 'signUp' || mode === 'signIn')) {
        setResetEmail(String(form.get('email')));
        setMode('email-verification');
        setStatus('Check your email for the verification code.');
      } else {
        setStatus(mode === 'signUp' ? 'Account created. You can save your character now.' : 'Signed in.');
      }
    } catch (error) { setStatus(error.message || 'Could not sign in.'); }
    finally { setBusy(false); }
  }

  async function loadCharacter(id) {
    if (!confirm('Load this character? Your current unsaved edits will be replaced.')) return;
    setBusy(true);
    try {
      const backup = await convex.query(loadRef, { id });
      window.savageMasterBridge.loadBackup(backup);
      setSelectedId(id);
      setStatus('Character loaded.');
    } catch (error) { setStatus(error.message); }
    finally { setBusy(false); }
  }

  return <section className="account-panel" aria-label="Character account">
    <h3>My Characters</h3>
    {isLoading ? <p>Checking account…</p> : isAuthenticated ? <>
      <button className="btn btn-sm" disabled={busy} onClick={() => window.characterCloud.save()}>Save Character</button>
      <button className="btn btn-sm" onClick={() => { if (window.savageMasterBridge.newCharacter()) setSelectedId(null); }}>New Character</button>
      <div className="account-list">
        {characters?.length ? characters.map(c => <button key={c._id} className="account-item" disabled={busy} onClick={() => loadCharacter(c._id)}>
          {c.name}{c._id === selectedId ? ' (open)' : ''}
        </button>) : <p>No saved characters yet.</p>}
      </div>
      <button className="btn btn-sm" onClick={() => { setSelectedId(null); signOut(); }}>Sign Out</button>
    </> : <>
      <p>Sign in to save and load characters across devices.</p>
      <form onSubmit={submit}>
        {mode === 'reset-verification' || mode === 'email-verification' ? <>
          <input name="email" type="hidden" value={resetEmail} />
          <input name="code" placeholder="Email code" aria-label="Email code" required />
          {mode === 'reset-verification' && <input name="newPassword" type="password" placeholder="New password" aria-label="New password" required minLength={8} autoComplete="new-password" />}
        </> : <>
          <input name="email" type="email" placeholder="Email" aria-label="Email" required autoComplete="email" />
          {mode !== 'reset' && <input name="password" type="password" placeholder="Password" aria-label="Password" required minLength={8} autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'} />}
        </>}
        <button className="btn btn-sm" type="submit" disabled={busy}>{mode === 'signUp' ? 'Create Account' : mode === 'reset' ? 'Send Reset Code' : mode === 'reset-verification' ? 'Set New Password' : mode === 'email-verification' ? 'Verify Email' : 'Sign In'}</button>
      </form>
      <button className="account-switch" onClick={() => { setMode(mode === 'signUp' ? 'signIn' : 'signUp'); setStatus(''); }}>
        {mode === 'signUp' ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </button>
      <button className="account-switch" onClick={() => { setMode(mode === 'reset' || mode === 'reset-verification' || mode === 'email-verification' ? 'signIn' : 'reset'); setStatus(''); }}>
        {mode === 'reset' || mode === 'reset-verification' || mode === 'email-verification' ? 'Back to sign in' : 'Forgot password?'}
      </button>
    </>}
    {status && <p className="account-status" role="status">{status}</p>}
  </section>;
}

if (url) {
  const convex = new ConvexReactClient(url);
  createRoot(document.getElementById('accountRoot')).render(
    <ConvexAuthProvider client={convex}><CharacterAccount /></ConvexAuthProvider>
  );
} else {
  document.getElementById('accountRoot').textContent = 'Cloud saving needs a Convex deployment.';
}
