import React, { useState } from 'react';
import { useConvexAuth, useQuery, useMutation } from 'convex/react';
import { makeFunctionReference as ref } from 'convex/server';
import { profileFrames } from './profile-frames.mjs';
import { ProfileAvatar } from './profile-avatar.jsx';

export function ProfileFrameSettings() {
  const { isAuthenticated } = useConvexAuth();
  const frames = useQuery(ref('profileFrames:mine'), isAuthenticated ? {} : 'skip');
  const profile = useQuery(ref('profiles:mine'), isAuthenticated ? {} : 'skip');
  const save = useMutation(ref('profileFrames:setPreference'));
  const [busy, setBusy] = useState(false), [status, setStatus] = useState('');
  async function update(enabled, selection) {
    setBusy(true); setStatus('');
    try { await save({ enabled, selection }); setStatus(enabled ? 'Your profile frame is on.' : 'Your profile frame is off. Your awards remain yours.'); }
    catch (error) { setStatus(typeof error?.data === 'string' ? error.data : 'Unable to save your frame preference. Please try again.'); }
    finally { setBusy(false); }
  }
  if (!isAuthenticated) return null;
  const available = frames?.available || [];
  return <section id="profile-frames"><h2>Your portrait frame</h2><p>Earned frames appear automatically. Turn yours off whenever you prefer a plain portrait; you keep the award.</p>
    {frames === undefined ? <p>Loading your frames.</p> : <>
      <ProfileAvatar image={profile?.avatarUrl} name={profile?.displayName || profile?.handle || 'Your profile'} frame={frames?.active} />
      {available.length ? <><label className="check"><input type="checkbox" checked={frames.enabled !== false} disabled={busy} onChange={e => update(e.target.checked, frames.selection || 'auto')} />Show my earned profile frame</label><label>Frame to display<select value={frames.selection || 'auto'} disabled={busy} onChange={e => update(frames.enabled !== false, e.target.value)}><option value="auto">Automatic</option>{available.map(id => <option key={id} value={id}>{profileFrames[id]?.label || id}</option>)}</select></label></> : <p>No frames earned yet. The first 100 verified members and the first 50 members with confirmed live payments receive founder frames.</p>}
    </>}{status && <p role="status">{status}</p>}
  </section>;
}
