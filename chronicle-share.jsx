import React, { useState } from 'react';
import { useConvexAuth, useMutation } from 'convex/react';
import { makeFunctionReference as ref } from 'convex/server';
import { signalBug } from './bug-mascot.jsx';
import './bug-profile.css';

export function postLink(id, origin = window.location.origin) {
  return `${origin}/chronicles?post=${encodeURIComponent(id)}`;
}
export function ChronicleShare({ post }) {
  const { isAuthenticated } = useConvexAuth();
  const shareUpdate = useMutation(ref('bug:shareUpdate'));
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [showLink, setShowLink] = useState(false);
  const url = postLink(post.originalPostId || post._id);
  async function copy() {
    try { await navigator.clipboard.writeText(url); setMessage('Update link copied.'); signalBug('announce'); }
    catch { setShowLink(true); setMessage('Select and copy this link.'); }
  }
  async function share() {
    if (!navigator.share) return copy();
    try { await navigator.share({ title: post.title, url }); setMessage('Update shared.'); signalBug('announce'); }
    catch (error) { if (error.name !== 'AbortError') { setShowLink(true); setMessage('Sharing is unavailable. You can copy the link below.'); } }
  }
  async function repost() {
    if (busy) return; setBusy(true); setMessage('');
    try { await shareUpdate({ id: post._id }); setMessage('Shared to your Chronicles.'); signalBug('announce'); }
    catch (error) { setMessage(typeof error.data === 'string' ? error.data : 'Unable to share. Check your connection and try again.'); }
    finally { setBusy(false); }
  }
  return <div className="chron-share"><div className="chron-share-actions"><button type="button" onClick={share}>Share update</button><button type="button" onClick={copy}>Copy link</button>
    {post.author.official === 'bug' && (isAuthenticated ? <button type="button" disabled={busy} onClick={repost}>{busy ? 'Sharing…' : 'Share to my Chronicles'}</button> : <a href="/profile?entry=signIn">Sign in to share to Chronicles</a>)}
    </div>{showLink && <label>Update link<input readOnly value={url} onFocus={event => event.target.select()} /></label>}<p role="status">{message}</p></div>;
}
