import {OfficialProducts} from './official-products.jsx';
import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {ConvexReactClient,useConvexAuth,useQuery,useMutation} from 'convex/react';
import {ConvexAuthProvider} from '@convex-dev/auth/react';
import {makeFunctionReference as ref} from 'convex/server';
import {CharacterAccount} from './account.jsx';
import './campaigns.css';

const refs=Object.fromEntries(['list','workspace','addAdventure','saveScene','invite','join','setSystem'].map(n=>[n,ref('campaigns:'+n)]));
const systems={
  pathfinder2e:{name:'Pathfinder 2e',description:'Remastered character workshop',href:'/pathfinder',rules:'https://2e.aonprd.com/',tip:'Prepare encounters with AC, HP, saves, Perception, attacks, and action costs.'},
  dnd5e:{name:'Dungeons & Dragons 5e',description:'Revised 2024 rules / SRD 5.2.1',href:'/dnd',rules:'https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf',tip:'Prepare NPCs and encounters with AC, HP, abilities, saving throws, attacks, and spells.'},
  savageWorlds:{name:'Savage Worlds',description:'Adventure Edition / choose a setting in the character creator',href:'/?game=savage',rules:'https://peginc.com/product/savage-worlds-adventure-edition-core-rules-pdf/',tip:'Prepare NPCs and encounters with Traits, Pace, Parry, Toughness, Edges, Hindrances, Bennies, and Wild Cards. Use your licensed SWADE books for complete rules.'},
};
const views=[['prepare','Prepare'],['table','Gaming Table'],['journal','My Journal']];
function SystemPicker({value,onChange}){
  return <fieldset className="campaign-system-picker"><legend>Which game are you running?</legend><div>{Object.entries(systems).map(([id,s])=><label key={id} className={value===id?'selected':''}><input type="radio" name="campaign-system" checked={value===id} onChange={()=>onChange(id)}/><span><strong>{s.name}</strong><small>{s.description}</small></span></label>)}</div></fieldset>;
}
function CampaignRules({system}){
  const s=systems[system];
  return s&&<details className="campaign-rules"><summary>{s.name} rules & resources</summary><p>{s.tip}</p><nav aria-label={s.name+' resources'}><a href={s.href}>Open character workshop</a><a href={s.rules} target="_blank" rel="noopener noreferrer">{system==='dnd5e'?'Free SRD rules':system==='pathfinder2e'?'Pathfinder rules reference':'Official SWADE rulebook'}</a></nav><OfficialProducts system={system}/><p className="campaign-system-note">Adventures, party members, and private journals belong to this campaign.</p></details>;
}
function Party({data}){
  return <section><span className="sm-kicker">Around your table</span><h2>Your party</h2>{data.party.length?data.party.map(p=><article key={p.userId}><h3>{p.characterName}</h3>{p.profileHandle&&<a href={'/profile?user='+encodeURIComponent(p.profileHandle)}>Visit player profile</a>}</article>):<p>No player characters have joined this campaign yet.</p>}{systems[data.system]&&<div className="sm-inline-actions"><a href={systems[data.system].href}>Open {systems[data.system].name} sheets</a></div>}</section>;
}
export function CampaignTable({data,adventure,sceneId,onAdventure,onScene,onPrepare}){
  const sceneRows=data.isGM?data.scenes.filter(s=>!adventure||s.adventureId===adventure):[];
  const scene=sceneRows.find(s=>s._id===sceneId)||sceneRows[0];
  const chapter=data.adventures.find(a=>a._id===adventure);
  return <div className="sm-campaign-grid"><div>
    <div className="sm-table-stage"><span className="sm-kicker">{systems[data.system]?.name||'Your campaign'} · {data.isGM?'GM table':'Player table'}</span><h2>{chapter?.title||data.name}</h2><p>Your characters. Your shared adventure.</p></div>
    <section className="sm-table-scene"><label>Adventure<select value={adventure} onChange={e=>onAdventure(e.target.value)}><option value="">All adventures</option>{data.adventures.map(a=><option key={a._id} value={a._id}>{a.title}</option>)}</select></label>
    {data.isGM?<>{sceneRows.length?<><label>Scene reference<select value={scene?._id||''} onChange={e=>onScene(e.target.value)}>{sceneRows.map(s=><option key={s._id} value={s._id}>{s.title}</option>)}</select></label><span className="sm-kicker">Private GM reference · visible only to you</span><h2>{scene.title}</h2><p className="notes">{scene.notes||'No scene notes recorded yet.'}</p></>:<><h2>Set the scene</h2><p>Prepare an adventure and its scenes, then keep your reference here during play.</p></>}<button className="secondary" onClick={onPrepare}>Return to preparation</button></>:<><h2>Ready for the adventure</h2><p>Open your character sheet and keep your journal nearby. Your GM will guide the scene at your table.</p><p className="dnd-note">Private GM scene notes stay behind the screen.</p></>}
    </section>
  </div><div><Party data={data}/><section><span className="sm-kicker">A place to gather</span><h2>Continue at Chronicles</h2><p>Meet the community and share a moment from your adventures.</p><div className="sm-inline-actions"><a href="/chronicles">Visit Chronicles</a></div></section></div></div>;
}
export function CampaignJournal({data,busy,onSubmit,draft,onDraft}){
  return <section className={'sm-journal'+(data.isGM?' sm-gm-journal':'')}><span className="sm-kicker">{data.isGM?'Behind the screen':'Your personal adventure journal'}</span><h2>{data.isGM?'Private GM Journal':'Your story, one chapter at a time'}</h2><p>Only you can read these entries. They are saved to your account when you select Save journal entry.</p>
    {!data.journals.length&&<div className="sm-empty"><img src="/images/art/memory-journal.webp" alt="" width="180" height="120"/><p>{data.isGM?'Keep a ruling, an idea, or a plan for the next session.':'Start with a moment you want your character to remember.'}</p></div>}
    {data.journals.map(j=><article className="sm-journal-entry" key={j._id}><small>{new Date(j.updatedAt).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})}</small><p className="notes">{j.text}</p></article>)}
    <form onSubmit={onSubmit}><label className="sm-journal-field">{data.isGM?'Add a private note':'Write your next memory'}<textarea name="text" value={draft} onChange={onDraft?e=>onDraft(e.target.value):undefined} placeholder={data.isGM?'Plans, rulings, and thoughts for next time.':'What happened? What would your character remember?'} required maxLength={30000}/></label><button disabled={busy}>Save journal entry</button></form>
  </section>;
}
function Workspace(){
  const query=new URLSearchParams(location.search),initialView=query.get('view');
  const {isAuthenticated}=useConvexAuth();
  const [campaign,setCampaign]=useState(''),[adventure,setAdventure]=useState(''),[sceneId,setSceneId]=useState('');
  const [requestedCampaign]=useState(query.get('campaign'));
  const [drafts,setDrafts]=useState({});
  const [view,setView]=useState(views.some(([id])=>id===initialView)?initialView:'prepare');
  const [status,setStatus]=useState(''),[busy,setBusy]=useState(false),[link,setLink]=useState(''),[system,setSystem]=useState('');
  const list=useQuery(refs.list,isAuthenticated?{}:'skip'),data=useQuery(refs.workspace,isAuthenticated&&campaign?{campaignId:campaign}:'skip'),characters=useQuery(ref('characters:list'),isAuthenticated?{}:'skip');
  const create=useMutation(ref('privateWorkspaces:createCampaign')),add=useMutation(refs.addAdventure),save=useMutation(refs.saveScene),journal=useMutation(ref('privateWorkspaces:saveJournal')),invite=useMutation(refs.invite),join=useMutation(refs.join),chooseSystem=useMutation(refs.setSystem);
  const token=query.get('invite');
  useEffect(()=>{if(!isAuthenticated){setCampaign('');setAdventure('');setSceneId('');setLink('');setDrafts({});}},[isAuthenticated]);
  useEffect(()=>{if(isAuthenticated&&list?.length&&!campaign){setCampaign(list.find(c=>c._id===requestedCampaign)?._id||list[0]._id);}},[isAuthenticated,list,campaign,requestedCampaign]);
  useEffect(()=>{if(!Object.values(drafts).some(Boolean))return;const warn=e=>{e.preventDefault();e.returnValue="";};window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[drafts]);
  useEffect(()=>{const url=new URL(location.href);if(view==='prepare')url.searchParams.delete('view');else url.searchParams.set('view',view);if(campaign)url.searchParams.set('campaign',campaign);else if(!isAuthenticated)url.searchParams.delete('campaign');history.replaceState({},'',url.pathname+url.search);document.documentElement.dataset.campaignView=view;window.dispatchEvent(new Event('sm:workspace-change'));},[view,campaign,isAuthenticated]);
  async function run(action,message='Saved to your account.'){
    setBusy(true);setStatus('');try{await action();setStatus(message);return true;}catch(e){window.smBugCapture?.record('Campaign error',e);setStatus(e.message.replace(/\[CONVEX[^\]]*\]/g,'').replace(/Called by client/g,'').trim());return false;}finally{setBusy(false);}
  }
  function form(action){return async e=>{e.preventDefault();const f=e.currentTarget,values=Object.fromEntries(new FormData(f));if(await run(()=>action(values)))f.reset();};}
  function openCampaign(id){setCampaign(id);setAdventure('');setSceneId('');setLink('');}
  const selectedAdventure=id=>{setAdventure(id);setSceneId('');};
  const headings={prepare:['Behind the screen','Your campaign workspace','Prepare the next chapter. Keep your table together.'],table:['The adventure is here','Gaming Table','Settle in. Open your sheet. Let the story unfold.'],journal:['A story worth keeping','Your campaign journals','Keep the moments, discoveries, and memories that matter.']};
  const [eyebrow,title,description]=headings[view];
  return <main className={'sm-campaign-page sm-view-'+view}>
    <header className="workspace-hero"><div><span className="art-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><img className="workspace-art" src={'/images/art/'+(view==='journal'?'memory-journal':'campaign-tome')+'.webp'} alt="" width="720" height="480" decoding="async"/></header>
    <details className="builder-account" open={!isAuthenticated}><summary>My account</summary><CharacterAccount accountOnly/></details>
    {isAuthenticated&&<>
      {token&&<section><h2>Join a campaign</h2><p>Choose a character saved in your account for your GM's game system.</p><form onSubmit={form(async v=>{const id=await join({token,characterId:v.character});openCampaign(id);setView('table');const url=new URL(location.href);url.searchParams.delete('invite');history.replaceState({},'',url.pathname+url.search);})}><label>Your character<select name="character" required><option value="">Choose character</option>{characters?.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}</select></label><button disabled={busy}>Join campaign</button></form></section>}
      <section><div className="sm-campaign-picker"><label>Open campaign<select value={campaign} onChange={e=>openCampaign(e.target.value)}><option value="">Choose a campaign</option>{list?.map(c=><option key={c._id} value={c._id}>{c.name} · {c.isGM?'Game Master':'Player'}</option>)}</select></label>{data&&<span className="builder-badge">{data.isGM?'Game Master':'Player'} · {systems[data.system]?.name||'Choose game system'}</span>}</div>
        <details className="sm-campaign-create" open={list?.length===0}><summary>Create a new campaign</summary><SystemPicker value={system} onChange={setSystem}/><form onSubmit={form(async v=>{openCampaign(await create({name:v.name,system}));setView('prepare');})}><label>Campaign name<input name="name" placeholder="Name your next adventure" maxLength={160} required/></label><button disabled={busy||!system}>Create campaign</button></form></details>
        {list===undefined?<p>Loading your campaigns.</p>:list.length===0&&<p>Create your first campaign, or open an invitation from your GM.</p>}
      </section>
      {campaign&&!data&&<p role="status">Opening your campaign.</p>}
      {data&&<>
        <div className="sm-campaign-tabs" role="tablist" aria-label="Campaign workspace" onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const current=views.findIndex(([id])=>id===view);const next=e.key==='Home'?0:e.key==='End'?2:(current+(e.key==='ArrowRight'?1:2))%3;setView(views[next][0]);document.getElementById('campaign-tab-'+views[next][0])?.focus();}}>{views.map(([id,label])=><button type="button" role="tab" tabIndex={view===id?0:-1} id={'campaign-tab-'+id} aria-selected={view===id} aria-controls={'campaign-panel-'+id} key={id} onClick={()=>setView(id)}>{label}</button>)}</div>
        <div key={campaign}>
          <div id="campaign-panel-table" role="tabpanel" aria-labelledby="campaign-tab-table" hidden={view!=='table'} tabIndex={0}><CampaignTable data={data} adventure={adventure} sceneId={sceneId} onAdventure={selectedAdventure} onScene={setSceneId} onPrepare={()=>setView('prepare')}/></div>
          <div id="campaign-panel-journal" role="tabpanel" aria-labelledby="campaign-tab-journal" hidden={view!=='journal'} tabIndex={0}><CampaignJournal data={data} busy={busy} draft={drafts[campaign]||''} onDraft={text=>setDrafts(prev=>({...prev,[campaign]:text}))} onSubmit={async e=>{e.preventDefault();const id=campaign,text=drafts[id];if(await run(()=>journal({campaignId:id,kind:data.isGM?'gm':'player',text})))setDrafts(prev=>prev[id]===text?{...prev,[id]:''}:prev);}}/></div>
          <div id="campaign-panel-prepare" role="tabpanel" aria-labelledby="campaign-tab-prepare" hidden={view!=='prepare'} tabIndex={0}>
            <section><span className="sm-kicker">{data.isGM?'GM preparation':'Your campaign'}</span><h2>{data.name}</h2><p>{data.isGM?'Scenes and preparation stay private to the Game Master.':'Your GM manages the adventure. Your personal journal stays private.'}</p>
              {data.system?<CampaignRules system={data.system}/>:<><p>Your GM needs to choose this campaign's game system.</p>{data.isGM&&<SystemPicker value="" onChange={system=>run(()=>chooseSystem({campaignId:campaign,system}))}/>}</>}
              <div className="sm-inline-actions"><button onClick={()=>setView('table')}>Open Gaming Table</button><button className="secondary" onClick={()=>setView('journal')}>Open my journal</button>{data.isGM&&<a href="/builder">Build your world</a>}</div>
            </section>
            <div className="sm-campaign-grid"><section><h2>Adventures & scenes</h2><label>Current adventure<select value={adventure} onChange={e=>selectedAdventure(e.target.value)}><option value="">Choose an adventure</option>{data.adventures.map(a=><option key={a._id} value={a._id}>{a.title}</option>)}</select></label>
              {data.isGM&&<form onSubmit={form(async v=>selectedAdventure(await add({campaignId:campaign,title:v.title})))}><label>New adventure title<input name="title" placeholder="The next chapter" required maxLength={160}/></label><button disabled={busy}>Add adventure</button></form>}
              {data.isGM&&adventure&&<><h3>Scene preparation</h3>{data.scenes.filter(s=>s.adventureId===adventure).map(s=><article key={s._id}><h3>{s.title}</h3><p className="notes">{s.notes}</p><details><summary>Edit scene</summary><form onSubmit={form(v=>save({id:s._id,adventureId:adventure,title:v.title,notes:v.notes}))}><label>Scene title<input name="title" defaultValue={s.title} required maxLength={160}/></label><label>Private scene notes<textarea name="notes" defaultValue={s.notes} maxLength={30000}/></label><button disabled={busy}>Update scene</button></form></details></article>)}<form onSubmit={form(v=>save({adventureId:adventure,title:v.title,notes:v.notes}))}><label>New scene title<input name="title" placeholder="Where does the story go next?" required maxLength={160}/></label><label>Private scene notes<textarea name="notes" placeholder={data.system==='savageWorlds'?'NPCs, clues, Traits, Pace, Parry, Toughness, Edges, and Hindrances.':'NPCs, clues, AC, HP, saves, attacks, spells, and action costs.'} maxLength={30000}/></label><button disabled={busy}>Save scene</button></form></>}
              {!data.adventures.length&&<p>Your next chapter starts with an adventure.</p>}
            </section><div><Party data={data}/>{data.isGM&&<section><h2>Invite your players</h2><p>Bring players into this campaign with their own saved characters.</p><button disabled={busy} onClick={()=>run(async()=>setLink(location.origin+'/campaigns?invite='+await invite({campaignId:campaign})),'Player invitation created.')}>Create player invitation</button>{link&&<label>One-use link · expires in 24 hours<input readOnly value={link} onFocus={e=>e.target.select()}/></label>}</section>}</div></div>
          </div>
        </div>
      </>}
    </>}
    <p className="workspace-status" role="status">{busy?'Saving to your account…':status}</p>
  </main>;
}
const url=import.meta.env.VITE_CONVEX_URL;
if(document.getElementById('campaignRoot'))createRoot(document.getElementById('campaignRoot')).render(url?<ConvexAuthProvider client={new ConvexReactClient(url)}><Workspace/></ConvexAuthProvider>:<main><h1>Campaigns</h1><p>Campaign accounts are unavailable. You can still <a href="/?game=savage">open the character workshop</a>.</p></main>);
