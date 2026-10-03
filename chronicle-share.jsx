import React, { useState } from 'react';
import { useConvexAuth, useMutation } from 'convex/react';
import { makeFunctionReference as ref } from 'convex/server';
import { signalBug } from './bug-mascot.jsx';
import './bug-profile.css';
export function postLink(id, origin = window.location.origin) { return `${origin}/p/${encodeURIComponent(id)}`; }
export function ChronicleShare({ post }) {
  const { isAuthenticated } = useConvexAuth();
  const shareUpdate = useMutation(ref('chronicles:share'));
  const [message,setMessage] = useState(''), [busy,setBusy] = useState(false), [showLink,setShowLink] = useState(false);
  const url = postLink(post.originalPostId || post._id);
  async function copy(full = false) {
    try { await navigator.clipboard.writeText(full ? `${post.title}\n\n${post.body}\n\n${url}` : url); setMessage(full?'Post and link copied.':'Post link copied.'); signalBug('announce'); }
    catch { setShowLink(true); setMessage('Select and copy the post or link below.'); }
  }
  async function share() {
    if (!navigator.share) return copy(true);
    try { await navigator.share({title:post.title,text:`${post.title}\n\n${post.body}`,url}); setMessage('Post shared.'); signalBug('announce'); }
    catch(error) { if(error.name!=='AbortError'){setShowLink(true);setMessage('Choose a sharing link or copy your post below.');} }
  }
  async function repost() {
    setBusy(true);setMessage('');
    try { await shareUpdate({id:post._id});setMessage('Shared to your fire.');signalBug('announce'); }
    catch(error){setMessage(typeof error.data==='string'?error.data:'Unable to share. Your profile must be reviewed and the original post public.');}
    finally{setBusy(false);}
  }
  return <div className="chron-share"><div className="chron-share-actions"><button type="button" onClick={share}>Share post</button><button type="button" onClick={()=>copy(true)}>Copy post</button><button type="button" onClick={()=>copy()}>Copy link</button><a href={'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url)} target="_blank" rel="noopener noreferrer">Facebook</a>
    {isAuthenticated?<button type="button" disabled={busy} onClick={repost}>{busy?'Sharing…':'Share to my fire'}</button>:<a href="/profile?entry=signIn">Sign in to share to the fire</a>}
    </div>{showLink&&<><label>Post and link<textarea readOnly rows={5} value={`${post.title}\n\n${post.body}\n\n${url}`} onFocus={e=>e.target.select()}/></label><label>Post link<input readOnly value={url} onFocus={e=>e.target.select()}/></label></>}<p role="status">{message}</p></div>;
}
