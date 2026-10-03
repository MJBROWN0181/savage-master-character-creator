import React, { useState } from 'react';
import { useConvexAuth, useQuery, useMutation } from 'convex/react';
import { makeFunctionReference as ref } from 'convex/server';
import { BugMascot, BugPaths, signalBug } from './bug-mascot.jsx';
import { ChronicleShare } from './chronicle-share.jsx';
import './bug-profile.css';

export function BugProfileHeader({ bio, followed, authenticated, busy, onFollow }) {
  return <header className="bug-profile-hero"><BugMascot state="welcome" size={200} label="Bug, a dark fantasy winged fairy with his tome of code" /><div><span className="bug-official">Official Savage Master companion</span><h1>Bug</h1><p className="bug-profile-handle">@bug · Keeper of the code</p><p>{bio}</p><div className="bug-profile-actions">{authenticated ? <button type="button" disabled={busy} aria-pressed={followed} onClick={onFollow}>{followed ? 'Unfollow Bug' : 'Follow Bug'}</button> : <a href="/profile?entry=signIn">Sign in to follow Bug</a>}<a href="/chronicles">Visit Chronicles</a></div><BugPaths /></div></header>;
}
function UpdateComposer() {
  const publish = useMutation(ref('bug:publishUpdate'));
  const [draft, setDraft] = useState({ title: '', body: '', requestId: crypto.randomUUID() });
  const [review, setReview] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault(); if (!review) { setReview(true); return; }
    if (busy) return; setBusy(true); setMessage('');
    try { await publish(draft); setMessage('Bug’s update is published in Chronicles.'); setDraft({ title: '', body: '', requestId: crypto.randomUUID() }); setReview(false); signalBug('announce'); }
    catch (error) { setMessage(typeof error.data === 'string' ? error.data : 'Publishing failed. Your draft is still here.'); }
    finally { setBusy(false); }
  }
  return <details className="bug-update-composer"><summary>Publish an official Bug update</summary><form onSubmit={submit}><p>These updates are public and appear under Bug’s official profile.</p>{review ? <section><h3>{draft.title}</h3><p className="bug-update-body">{draft.body}</p></section> : <><label>Update title<input required maxLength={100} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label><label>Update<textarea required rows={5} maxLength={2000} value={draft.body} onChange={event => setDraft({ ...draft, body: event.target.value })} /></label></>}<div className="bug-profile-actions"><button disabled={busy}>{busy ? 'Publishing…' : review ? 'Publish as Bug' : 'Review update'}</button>{review && <button type="button" disabled={busy} onClick={() => setReview(false)}>Keep editing</button>}</div><p role="status">{message}</p></form></details>;
}
export function BugProfile() {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(ref('bug:profile'));
  const following = useQuery(ref('chronicles:following'));
  const canPublish = useQuery(ref('bug:canPublish'));
  const follow = useMutation(ref('chronicles:follow'));
  const [before, setBefore] = useState(null), [pages, setPages] = useState([]), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const feed = useQuery(ref('chronicles:feed'), { authorHandle: 'bug', before });
  const followed = following?.handles.includes('bug') || false;
  async function toggleFollow() {
    setBusy(true); setMessage('');
    try { await follow({ handle: 'bug', enabled: !followed }); setMessage(followed ? 'You unfollowed Bug.' : 'Following Bug. His updates will appear in your Following feed.'); signalBug('success'); }
    catch { setMessage('Unable to change following. Check your connection and try again.'); }
    finally { setBusy(false); }
  }
  if (profile === undefined) return <p>Opening Bug’s tome…</p>;
  if (!profile) return <section className="bug-profile"><h1>Bug’s profile is coming soon</h1><p>You can still reach Bug for support.</p><BugPaths /></section>;
  return <div className="bug-profile"><BugProfileHeader bio={profile.bio} authenticated={isAuthenticated} followed={followed} busy={busy || !following} onFollow={toggleFollow} /><p role="status">{message}</p><section className="bug-profile-notes"><h2>From Bug’s tome</h2><p>Official updates, setup tips, and news from the Savage Master team. Follow Bug to find them in Chronicles, or share a post with your table.</p></section>{canPublish && <UpdateComposer />}
    <section aria-label="Bug’s updates">{feed === undefined ? <p>Opening the updates…</p> : !feed.posts.length ? <p>No updates on this page yet.</p> : feed.posts.map(post => <article className="bug-update" key={post._id}><header><BugMascot state="announce" size={52} /><div><strong>Bug <span className="bug-official">Official</span></strong><p><time dateTime={new Date(post.createdAt).toISOString()}>{new Date(post.createdAt).toLocaleDateString()}</time></p></div></header><h2><a href={`/chronicles?post=${encodeURIComponent(post._id)}`}>{post.title}</a></h2><p className="bug-update-body">{post.body}</p><ChronicleShare post={post} /></article>)}</section><nav className="bug-profile-actions" aria-label="Update pages">{pages.length > 0 && <button onClick={() => { setBefore(pages.at(-1)); setPages(pages.slice(0, -1)); }}>Newer updates</button>}{feed?.next && <button onClick={() => { setPages([...pages, before]); setBefore(feed.next); }}>Older updates</button>}</nav>
  </div>;
}
