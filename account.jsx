import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexReactClient, useConvexAuth, useQuery } from 'convex/react';
import { ConvexAuthProvider, useAuthActions } from '@convex-dev/auth/react';
import { makeFunctionReference } from 'convex/server';
import { needsEmailVerification, normalizeEmailCode, accountErrorMessage } from './account-auth.mjs';
import { TERMS_VERSION } from './legal-terms.mjs';
import {useCharacterEditor,CharacterEditorPanel} from './character-editor.jsx';

const url = import.meta.env.VITE_CONVEX_URL;
const listRef = makeFunctionReference('characters:list');

export function CharacterAccount({accountOnly = false, initialMode = 'signIn', onModeChange}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const characters = useQuery(listRef, isAuthenticated ? {} : 'skip');
  const [mode, setMode] = useState(initialMode);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const [,bridgeChanged]=useState(0);
  const bridge=()=>typeof window==='undefined'?null:window.savageMasterBridge;
  const editor=useCharacterEditor({system:'savageWorlds',key:'savage-master-character-v1',active:!accountOnly,ready:()=>!!bridge()?.ready,snapshot:()=>({version:1,character:bridge()?.getCharacter()}),normalize:snap=>({version:1,character:bridge().parseSnapshot(snap)}),validateSave:snap=>{bridge().parseSnapshot(snap);if(!snap.character.name.trim())throw Error('Give your character a name first.');},meaningful:()=>bridge()?.meaningful()??false,apply:snap=>bridge().loadBackup(snap,{campaign:!!new URLSearchParams(location.search).get('campaign')})});
  useEffect(()=>{if(accountOnly)return;const changed=e=>{bridgeChanged(n=>n+1);if(e.detail?.persisted)queueMicrotask(()=>editor.changed());else if(e.detail?.persisted===false)editor.mark('Could not save on this device. Download a backup to keep your work.');};window.addEventListener('sm:character-change',changed);return()=>window.removeEventListener('sm:character-change',changed);},[accountOnly,editor]);
  useEffect(() => {
    if (mode === 'signUp' || mode === 'signIn') onModeChange?.(mode);
  }, [mode, onModeChange]);

  useEffect(() => {
    if (accountOnly) return;
    window.characterCloud = {
      clearSelection: () => editor.clear(),
      save: () => editor.save(),
    };
    return () => { delete window.characterCloud; };
  }, [isAuthenticated, editor, accountOnly]);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (mode === 'signUp' && form.get('acceptedTerms') !== TERMS_VERSION) {
      setStatus('Confirm you are 18 or older and agree to the Terms of Service.');
      return;
    }
    setBusy(true);
    setStatus('');
    form.set('flow', mode);
    if (form.has('code')) form.set('code', normalizeEmailCode(form.get('code')));
    try {
      const result = await signIn('password', form);
      if (mode === 'reset') {
        setResetEmail(String(form.get('email')));
        setMode('reset-verification');
        setStatus('Check your email for the reset code.');
      } else if (needsEmailVerification(mode, result)) {
        setResetEmail(String(form.get('email')));
        setMode('email-verification');
        setStatus('Check your email for the verification code.');
      } else {
        setStatus(mode === 'signUp' ? 'Account created. You can save your character now.' : 'Signed in.');
      }
    } catch (error) { window.smBugCapture?.record('Account error', error); setStatus(accountErrorMessage(mode, error)); }
    finally { setBusy(false); }
  }

  function loadCharacter(id) { return editor.open({id}); }

  return <section className="account-panel" aria-label="Character account">
    <h3>{accountOnly ? 'Your Account' : 'My Characters'}</h3>
    {isLoading ? <p>Checking account…</p> : isAuthenticated ? <>
      {!accountOnly && <>
      <button className="btn btn-sm" disabled={busy||editor.pending} onClick={() => window.characterCloud.save()}>Save Character</button>
      <button className="btn btn-sm" onClick={() => { window.savageMasterBridge.newCharacter(); }}>New Character</button>
      <div className="account-list">
        {characters?.filter(c=>!['dnd5e','pathfinder2e'].includes(c.setting)).length ? characters.filter(c=>!['dnd5e','pathfinder2e'].includes(c.setting)).map(c => <button key={c._id} className="account-item" disabled={busy||editor.pending} onClick={() => loadCharacter(c._id)}>
          {c.name}{c._id === editor.binding?.id ? ' (open)' : ''}
        </button>) : <p>No saved characters yet.</p>}
      </div>
      </>}
      <button className="btn btn-sm" onClick={() => { editor.clear(); signOut(); }}>Sign Out</button>
    </> : <>
      <p>{mode === 'signUp' ? 'Create an account to keep your characters and adventures together.' : 'Sign in to save and load characters across devices.'}</p>
      <form onSubmit={submit}>
        {mode === 'reset-verification' || mode === 'email-verification' ? <>
          <input name="email" type="hidden" value={resetEmail} />
          <input name="code" placeholder="8-digit email code" aria-label="Email code" required inputMode="numeric" autoComplete="one-time-code" />
          {mode === 'reset-verification' && <input name="newPassword" type="password" placeholder="New password" aria-label="New password" required minLength={8} autoComplete="new-password" />}
        </> : <>
          <input name="email" type="email" placeholder="Email" aria-label="Email" required autoComplete="email" />
          {mode !== 'reset' && <input name="password" type="password" placeholder="Password" aria-label="Password" required minLength={8} autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'} />}
        </>}
        {mode === 'signUp' && <label className="account-terms"><input type="checkbox" name="acceptedTerms" value={TERMS_VERSION} required /><span>I am 18 or older and agree to the <a href="/legal#terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>. I have read the <a href="/legal#privacy" target="_blank" rel="noopener noreferrer">Privacy Notice</a>.</span></label>}
        <button className="btn btn-sm" type="submit" disabled={busy}>{mode === 'signUp' ? 'Create Account' : mode === 'reset' ? 'Send Reset Code' : mode === 'reset-verification' ? 'Set New Password' : mode === 'email-verification' ? 'Verify Email' : 'Sign In'}</button>
      </form>
      <button className="account-switch" onClick={() => { setMode(mode === 'signUp' ? 'signIn' : 'signUp'); setStatus(''); }}>
        {mode === 'signUp' ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </button>
      <button className="account-switch" onClick={() => { setMode(mode === 'reset' || mode === 'reset-verification' || mode === 'email-verification' ? 'signIn' : 'reset'); setStatus(''); }}>
        {mode === 'reset' || mode === 'reset-verification' || mode === 'email-verification' ? 'Back to sign in' : 'Forgot password?'}
      </button>
    </>}
    {!accountOnly&&<CharacterEditorPanel editor={editor} target={typeof document==='undefined'?null:document.getElementById('savageCharacterControls')}/>}
    <a className="account-switch" href="/pricing">Billing &amp; Account</a>
    {status && <p className="account-status" role="status">{status}</p>}
  </section>;
}

if (url && document.getElementById('accountRoot') && !window.savageMasterHome) {
  const convex = new ConvexReactClient(url);
  createRoot(document.getElementById('accountRoot')).render(
    <ConvexAuthProvider client={convex}><CharacterAccount /></ConvexAuthProvider>
  );
} else if (document.getElementById('accountRoot') && !window.savageMasterHome) {
  document.getElementById('accountRoot').textContent = 'Cloud saving needs a Convex deployment.';
}
