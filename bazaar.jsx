import React,{useState,useEffect} from 'react';
import {useConvexAuth,useQuery,useMutation,useAction} from 'convex/react';
import {makeFunctionReference as ref} from 'convex/server';
import {communityGames,friendlyError,useDraftWarning} from './community-ui.jsx';
export const bazaarSections=['Custom Art','Game Master Hires','Campaigns','One Shots','Maps & Tokens','Books & Accessories','Other'];
const empty={title:'',description:'',category:bazaarSections[0],game:communityGames[0],price:'',contactUrl:''};
export function Bazaar(){
  const {isAuthenticated}=useConvexAuth(),eligible=useQuery(ref('chronicles:eligibility'));
  const [category,setCategory]=useState('All sections'),[cursors,setCursors]=useState([null]),[draft,setDraft]=useState(empty),[editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
  const save=useMutation(ref('bazaar:save'));
  const uploadUrl=useMutation(ref('profiles:uploadUrl')),validateImage=useAction(ref('profileImages:validate'));
  useDraftWarning(editing && !!(draft.title||draft.description));
  useEffect(()=>{if(!isAuthenticated){setEditing(false);setDraft(empty);}},[isAuthenticated]);
  const field=(key,value)=>setDraft(d=>({...d,[key]:value}));
  async function uploadImage(file){
    if(!file)return;
    setBusy(true);setStatus('');
    const localUrl=URL.createObjectURL(file);
    try{
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>4*1024*1024)throw new Error('Uncaught Error: Use PNG, JPEG, or WebP under 4 MB.');
      const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Uncaught Error: This image could not be opened.'));image.src=localUrl;});
      if(image.width*image.height>25000000)throw new Error('Uncaught Error: Use an image under 25 megapixels.');
      const response=await fetch(await uploadUrl({}),{method:'POST',headers:{'Content-Type':file.type},body:file});
      if(!response.ok)throw new Error('Upload failed');
      const {storageId}=await response.json();await validateImage({storageId});field('imageId',storageId);setStatus('Image ready. Publish your ad to show it in the Bazaar.');
    }catch(error){setStatus(friendlyError(error));}finally{URL.revokeObjectURL(localUrl);setBusy(false);}
  }
  return <section className="chron-panel bazaar"><span className="chron-eyebrow">The tabletop classifieds</span><h2>Bazaar</h2><p>Find a custom portrait, hire a Game Master, discover campaigns and one shots, or offer something of your own.</p>
    <nav className="bazaar-categories" aria-label="Bazaar sections">{['All sections',...bazaarSections].map(c=><button key={c} type="button" className={category===c?'':'quiet'} aria-pressed={category===c} onClick={()=>{setCategory(c);setCursors([null]);}}>{c}</button>)}</nav>
    {eligible?<button type="button" onClick={()=>{setDraft(empty);setEditing(!editing);}}>Post a classified ad</button>:<p><a href={isAuthenticated?'/settings#review':'/profile?entry=signIn'}>{isAuthenticated?'Complete profile review':'Sign in'}</a> to post an ad.</p>}
    {editing&&<form onSubmit={async e=>{e.preventDefault();setBusy(true);try{await save({...draft,contactUrl:draft.contactUrl||undefined});setDraft(empty);setEditing(false);setStatus('Your ad is in the Bazaar.');setCursors([null]);}catch(error){setStatus(friendlyError(error));}finally{setBusy(false);}}}>
      <label>Listing image (optional)<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>uploadImage(e.target.files[0])}/></label>{draft.imageId&&<button type="button" className="quiet" onClick={()=>field('imageId',undefined)}>Remove listing image</button>}<h3>{draft.id?'Edit classified ad':'Your classified ad'}</h3><label>Title<input required maxLength={100} value={draft.title} onChange={e=>field('title',e.target.value)}/></label><div className="community-form-row"><label>Section<select value={draft.category} onChange={e=>field('category',e.target.value)}>{bazaarSections.map(c=><option key={c}>{c}</option>)}</select></label><label>Game<select value={draft.game} onChange={e=>field('game',e.target.value)}>{communityGames.map(g=><option key={g}>{g}</option>)}</select></label></div><label>Description<textarea required rows={5} maxLength={2000} value={draft.description} onChange={e=>field('description',e.target.value)}/></label><label>Price or terms<input required maxLength={80} placeholder="$25 per session, quote on request, or free" value={draft.price} onChange={e=>field('price',e.target.value)}/></label><label>Contact or booking link (optional)<input type="url" maxLength={500} placeholder="https://…" value={draft.contactUrl} onChange={e=>field('contactUrl',e.target.value)}/></label><p>Buyers can visit your public profile. Add clear details about availability, delivery, and booking.</p><button disabled={busy}>{busy?'Saving…':'Publish ad'}</button><button type="button" className="quiet" onClick={()=>setEditing(false)}>Cancel</button>
    </form>}
    {status&&<p role="status">{status}</p>}{cursors.map((cursor,i)=><ListingPage key={`${category}:${cursor||'first'}`} category={category} before={cursor} last={i===cursors.length-1} onMore={next=>setCursors(p=>p.includes(next)?p:[...p,next])} onEdit={row=>{setDraft({id:row._id,title:row.title,description:row.description,category:row.category,game:row.game,price:row.price,contactUrl:row.contactUrl||'',imageId:row.imageId});setEditing(true);}}/>)}
    <p className="campfire-status">Classified ads connect players and sellers. Arrange payments and bookings directly with the seller.</p>
  </section>;
}
function ListingPage({category,before,last,onMore,onEdit}){
  const data=useQuery(ref('bazaar:list'),{category,before});
  return data===undefined?<p>Opening the Bazaar…</p>:<><div className="community-list-grid">{data.rows.map(row=><Listing key={row._id} row={row} onEdit={onEdit}/>)}</div>{!before&&!data.rows.length&&<p>No ads in this section yet.</p>}{last&&data.next&&<button type="button" onClick={()=>onMore(data.next)}>More classified ads</button>}</>;
}
function Listing({row,onEdit}){
  const {isAuthenticated}=useConvexAuth(),close=useMutation(ref('bazaar:close')),report=useMutation(ref('bazaar:report'));
  const [reporting,setReporting]=useState(false),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
  async function run(fn,message){setBusy(true);try{await fn();setStatus(message);}catch(e){setStatus(friendlyError(e));}finally{setBusy(false);}}
  return <article>{row.imageUrl&&<img className="bazaar-image" src={row.imageUrl} alt={row.title}/>}<p className="chron-eyebrow">{row.category} · {row.game}</p><h3>{row.title}</h3><p className="bazaar-price">{row.price}{row.status==='closed'?' · Closed':''}</p><p className="chron-story">{row.description}</p><p>Offered by <a href={'/profile?user='+encodeURIComponent(row.seller.handle)}>{row.seller.name}</a></p>{row.contactUrl&&row.status==='open'&&<a href={row.contactUrl} target="_blank" rel="noopener noreferrer nofollow ugc">Contact or book with seller ↗</a>}<div className="chron-actions">{row.mine?<><button type="button" className="quiet" onClick={()=>onEdit(row)}>Edit ad</button><button type="button" className="quiet" disabled={busy} onClick={()=>run(()=>close({id:row._id,closed:row.status!=='closed'}),'Listing status updated.')}>{row.status==='closed'?'Reopen ad':'Close ad'}</button></>:isAuthenticated&&<button type="button" className="quiet" onClick={()=>setReporting(!reporting)}>Report ad</button>}</div>{reporting&&<form onSubmit={e=>{e.preventDefault();run(async()=>{await report({id:row._id,reason});setReporting(false);},'Ad reported for review.');}}><label>Reason<textarea required maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/></label><button disabled={busy}>Send report</button></form>}{status&&<p role="status">{status}</p>}</article>;
}
