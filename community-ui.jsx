import React, { useState, useEffect } from 'react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { makeFunctionReference as ref } from 'convex/server';
import { ChronicleShare } from './chronicle-share.jsx';
export const communityGames = ['Any tabletop game', 'Savage Worlds', 'Dungeons & Dragons 5e', 'Pathfinder 2e'];
export function useDraftWarning(dirty) {
  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
}
export function friendlyError(error) {
  const text = typeof error?.data === 'string' ? error.data : String(error?.message || '');
  return text.includes('Uncaught Error:') ? text.split('Uncaught Error:')[1].split('\n')[0].trim() : 'Unable to complete that action. Check your entries and connection, then try again.';
}
export function PostBody({ body }) {
  return <div className="chron-story">{body.split(/(https:\/\/[^\s]+)/g).map((part,i) => /^https:\/\//.test(part) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow ugc">{part}</a> : <React.Fragment key={i}>{part}</React.Fragment>)}</div>;
}
export function PostCard({ post }) {
  const { isAuthenticated } = useConvexAuth();
  const toast = useMutation(ref('chronicles:toast')), remove = useMutation(ref('chronicles:remove')), report = useMutation(ref('chronicles:report')), follow = useMutation(ref('chronicles:follow'));
  const follows = useQuery(ref('chronicles:following'), isAuthenticated ? {} : 'skip');
  const [busy,setBusy] = useState(false), [status,setStatus] = useState(''), [reason,setReason] = useState(''), [reporting,setReporting] = useState(false), [deleting,setDeleting] = useState(false);
  async function act(fn, message) { setBusy(true); try { await fn(); setStatus(message); } catch(e) { setStatus(friendlyError(e)); } finally { setBusy(false); } }
  return <article className="chron-post">
    <div className="chron-post-top"><a className="chron-author" href={'/profile?user='+encodeURIComponent(post.author.handle)}>{post.author.avatar ? <img src={post.author.avatar} alt="" /> : <span className="chron-avatar" aria-hidden="true">{post.author.name.slice(0,1)}</span>}<span><strong>{post.author.name}</strong><small>@{post.author.handle}{post.author.official === 'bug' ? ' · Official Bug update' : ''}</small></span></a><time dateTime={new Date(post.createdAt).toISOString()}>{new Date(post.createdAt).toLocaleDateString()}</time></div>
    {post.sharedBy && <p className="chron-shared-by">Shared by <a href={'/profile?user='+encodeURIComponent(post.sharedBy.handle)}>{post.sharedBy.name}</a></p>}
    <div className="chron-post-tags"><span>{post.game}</span><span>{post.kind}</span></div><h3><a href={'/chronicles?post='+encodeURIComponent(post._id)}>{post.title}</a></h3><PostBody body={post.body} />
    <div className="chron-actions"><button type="button" className="quiet" disabled={!isAuthenticated || busy} aria-pressed={post.toasted} onClick={()=>act(()=>toast({id:post._id}),post.toasted?'Toast withdrawn.':'A toast to this story.')}>{post.toasted?'Toasted':'Raise a toast'} · {post.toastCount}</button>
      {isAuthenticated && !post.mine && post.allowFollowers && <button type="button" className="quiet" disabled={busy} aria-pressed={follows?.handles.includes(post.author.handle) || false} onClick={()=>act(()=>follow({handle:post.author.handle,enabled:!follows?.handles.includes(post.author.handle)}),'Following updated.')}>{follows?.handles.includes(post.author.handle)?'Unfollow':'Follow'}</button>}
      {isAuthenticated && <button type="button" className="quiet" onClick={()=>setReporting(!reporting)}>Report</button>}{post.mine && <button type="button" className="quiet" onClick={()=>setDeleting(!deleting)}>Remove post</button>}
    </div>
    {post.public !== false && <ChronicleShare post={post} />}
    {reporting && <form onSubmit={e=>{e.preventDefault();act(async()=>{await report({id:post._id,reason});setReporting(false);setReason('');},'Report received.');}}><label>Report reason<textarea required maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} /></label><button disabled={busy}>Send report</button></form>}
    {deleting && <div className="chron-confirm"><p>Hide this post and its shares from Around the Fire?</p><button type="button" disabled={busy} onClick={()=>act(()=>remove({id:post._id}),'Post removed.')}>Confirm removal</button><button type="button" className="quiet" onClick={()=>setDeleting(false)}>Cancel</button></div>}
    {status && <p role="status">{status}</p>}
  </article>;
}
export function PostComposer({ onPublished }) {
  const { isAuthenticated } = useConvexAuth(), eligible = useQuery(ref('chronicles:eligibility'));
  const publish = useMutation(ref('chronicles:publish'));
  const [open,setOpen] = useState(false), [busy,setBusy] = useState(false), [status,setStatus] = useState('');
  const [draft,setDraft] = useState({title:'',body:'',game:communityGames[0],kind:'Session tale',consent:false});
  useDraftWarning(!!(draft.title || draft.body));
  useEffect(()=>{if(!isAuthenticated){setOpen(false);setDraft({title:'',body:'',game:communityGames[0],kind:'Session tale',consent:false});}},[isAuthenticated]);
  const field = (key,value)=>setDraft(d=>({...d,[key]:value}));
  return <section className="chron-panel" id="chron-compose"><h2>Your next spark</h2>{!isAuthenticated ? <p><a href="/profile?entry=signIn">Sign in</a> to share a story.</p> : !eligible ? <p>Your profile needs approval before posting. <a href="/settings#review">Check or request review in Settings</a>.</p> : !open ? <button type="button" onClick={()=>setOpen(true)}>Share something around the fire</button> : <form onSubmit={async e=>{e.preventDefault();setBusy(true);try{await publish(draft);setDraft({title:'',body:'',game:communityGames[0],kind:'Session tale',consent:false});setOpen(false);setStatus('Your story is around the fire.');onPublished?.();}catch(error){setStatus(friendlyError(error));}finally{setBusy(false);}}}>
    <label>Title<input required maxLength={100} value={draft.title} onChange={e=>field('title',e.target.value)} /></label><label>Your story<textarea required maxLength={2000} rows={5} value={draft.body} onChange={e=>field('body',e.target.value)} /></label><div className="community-form-row"><label>Game<select value={draft.game} onChange={e=>field('game',e.target.value)}>{communityGames.map(g=><option key={g}>{g}</option>)}</select></label><label>Kind<select value={draft.kind} onChange={e=>field('kind',e.target.value)}>{['Session tale','Epic roll','Character moment','Table memory'].map(k=><option key={k}>{k}</option>)}</select></label></div><label className="check"><input type="checkbox" required checked={draft.consent} onChange={e=>field('consent',e.target.checked)} />This is mine to share publicly.</label><button disabled={busy || !draft.consent}>{busy?'Sharing…':'Post around the fire'}</button><button type="button" className="quiet" onClick={()=>setOpen(false)}>Keep draft</button>
    </form>}{status && <p role="status">{status}</p>}</section>;
}
export function ProfilePosts({ handle }) {
  const [cursors,setCursors] = useState([null]);
  return <section className="profile-stories"><h2>Posts around the fire</h2>{cursors.map((cursor,i)=><ProfilePostPage key={cursor || 'first'} handle={handle} before={cursor} last={i===cursors.length-1} onMore={next=>setCursors(p=>p.includes(next)?p:[...p,next])} />)}</section>;
}
function ProfilePostPage({handle,before,last,onMore}) {
  const data = useQuery(ref('chronicles:feed'),{authorHandle:handle,before});
  return <>{data===undefined?<p>Opening stories…</p>:<>{data.posts.map(p=><PostCard key={p._id} post={p}/>)}{last && !data.posts.length && !before && <p>No public posts yet.</p>}{last && data.next && <button type="button" onClick={()=>onMore(data.next)}>Earlier stories</button>}</>}</>;
}
export function FollowingList({handle}) {
  const rows=useQuery(ref('chronicles:profileFollowing'),{handle});
  return <section className="profile-following"><h2>Following</h2>{rows===undefined?<p>Opening follows…</p>:rows.length?<ul>{rows.map(p=><li key={p.handle}><a href={'/profile?user='+encodeURIComponent(p.handle)}>{p.name}</a>{p.official?' · Official Bug profile':''}</li>)}</ul>:<p>Follow storytellers from Around the Fire to bring their posts into your feed.</p>}</section>;
}
