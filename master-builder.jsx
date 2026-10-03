import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ConvexReactClient,useConvex,useConvexAuth,useMutation,useQuery} from 'convex/react';
import {ConvexAuthProvider} from '@convex-dev/auth/react';
import {makeFunctionReference as ref} from 'convex/server';
import {CharacterAccount} from './account.jsx';
import {AccountWorldMaps,LocalWorldMaps} from './world-map-studio.jsx';
import {newWorld,ruleSets,worldSections,foundationIssues,worldIssues,ruleSetName,validateWorld,worldBackup,readWorldBackup} from './builder-model.mjs';
import './campaigns.css';
import './master-builder.css';

const draftKey='savage-master-builder-world-v1';
const steps=['Rule foundation','World & lore','Maps','Play style & rules','Review world'];
function initialDraft(){
  try {
    const raw=localStorage.getItem(draftKey);
    if(raw){const saved=JSON.parse(raw),world=readWorldBackup(saved);if(!world.mapKey)world.mapKey=crypto.randomUUID();const n=saved.stepVersion===2?saved.step:saved.step>=2?saved.step+1:saved.step;return {world,step:foundationIssues(world).length?0:Number.isInteger(n)&&n>=0&&n<steps.length?n:0,accountId:typeof saved.accountId==='string'?saved.accountId:null,warning:''};}
  } catch {return {world:newWorld(),step:0,warning:'Your previous browser draft could not be read. It will be replaced only when you edit this new draft. Download backups to keep your work safe.'};}
  return {world:newWorld(),step:0,warning:''};
}
function Field({label,value,onChange,hint,multiline=false,max=10000,list}){
  return <label className="builder-field"><span>{label}</span>{hint&&<small>{hint}</small>}{multiline?<textarea maxLength={max} value={value} onChange={e=>onChange(e.target.value)}/>:<input maxLength={max} value={value} list={list} onChange={e=>onChange(e.target.value)}/>}</label>;
}
function WorldReview({world}){
  const w=world,sections=[...worldSections.map(([key,label])=>[label,w[key]]),...Object.entries({
    'Experience at the table':w.playStyle.experience,'Conflict resolution':w.playStyle.resolution,'Character creation':w.playStyle.characters,'Advancement & rewards':w.playStyle.advancement,'Table conventions':w.playStyle.table,
  })];
  return <div className="world-review"><h2>{w.name||'Untitled world'}</h2><p className="builder-rule-tag">{ruleSetName(w)}{w.rules.edition&&` · ${w.rules.edition}`}</p>{w.rules.approach&&<p>Rules approach: {w.rules.approach}</p>}{w.rules.notes&&<article><h3>Rule foundation</h3><p className="notes">{w.rules.notes}</p></article>}
    {sections.filter(([,value])=>value.trim()).map(([label,value])=><article key={label}><h3>{label}</h3><p className="notes">{value}</p></article>)}
    {w.houseRules.length>0&&<><h3>House rules</h3>{w.houseRules.map(r=><article key={r.id}><h3>{r.name||'Unnamed rule'}</h3>{r.category&&<small>{r.category}</small>}<p className="notes">{r.text}</p></article>)}</>}
    {w.customFields.map(f=><article key={f.id}><h3>{f.label||'Untitled custom field'}</h3><p className="notes">{f.value||'No details yet.'}</p></article>)}
    {!sections.some(([,v])=>v.trim())&&<p>Your world is ready for its first details. Return to World &amp; lore to begin.</p>}
  </div>;
}
function Builder({cloud=null}){
  const [initial]=useState(initialDraft),[world,setWorld]=useState(initial.world),[step,setStep]=useState(initial.step),[revision,setRevision]=useState(0),[id,setId]=useState(null),[busy,setBusy]=useState(false),[status,setStatus]=useState(initial.warning),[storageStatus,setStorageStatus]=useState(''),[accountOpen,setAccountOpen]=useState(false);
  const [pendingId,setPendingId]=useState(initial.accountId||null);
  const foundation=foundationIssues(world),issues=worldIssues(world);
  useEffect(()=>{if(!cloud?.authenticated)setId(null);},[cloud?.authenticated]);
  useEffect(()=>{if(cloud?.authenticated&&cloud.worlds!==undefined&&pendingId){if(cloud.worlds.some(row=>row._id===pendingId))setId(pendingId);setPendingId(null);}},[cloud?.authenticated,cloud?.worlds,pendingId]);
  useEffect(()=>{
    if(!revision)return;
    try{localStorage.setItem(draftKey,JSON.stringify({...worldBackup(world),step,stepVersion:2,accountId:id||pendingId}));setStorageStatus('Draft saved in this browser.');}
    catch{setStorageStatus('Browser draft could not be saved. Download a backup to keep your edits.');}
  },[world,step,revision,id,pendingId]);
  function update(patch){setWorld(w=>({...w,...patch}));setRevision(r=>r+1);setStatus('');}
  function updateRule(patch){update({rules:{...world.rules,...patch}});}
  function go(n){setStep(n);setRevision(r=>r+1);}
  function replace(w,cloudId=null){setWorld({...w,mapKey:w.mapKey||crypto.randomUUID()});setId(cloudId);setPendingId(null);setStep(foundationIssues(w).length?0:4);setRevision(r=>r+1);}
  async function run(action){setBusy(true);setStatus('');try{await action();}catch(e){window.smBugCapture?.record('World save/load error',e);setStatus(e.message?.includes('World not found')?'World not found in this account.':'Unable to save or load this world. Check your connection and try again.');}finally{setBusy(false);}}
  function download(){try{const url=URL.createObjectURL(new Blob([JSON.stringify(worldBackup(world),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=(world.name.trim()||'my-world').replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,80)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus('World backup downloaded, including private GM lore.');}catch(e){setStatus(e.message);}}
  async function importFile(e){
    const f=e.target.files?.[0];e.target.value='';if(!f)return;
    setBusy(true);try{if(f.size>2000000)throw new Error();const w=readWorldBackup(JSON.parse(await f.text()));if(confirm('Replace your current world draft with this backup? Download your current draft first if you want to keep it.')){replace(w);setStatus('World backup imported.');}}catch{setStatus('Choose a valid Savage Master world JSON backup under 2 MB.');}finally{setBusy(false);}
  }
  const rows=(key,patchId,patch)=>update({[key]:world[key].map(row=>row.id===patchId?{...row,...patch}:row)});
  const remove=(key,rowId)=>{if(confirm('Remove this '+(key==='houseRules'?'house rule':'custom field')+' and its contents?'))update({[key]:world[key].filter(r=>r.id!==rowId)});};
  return <main className="master-builder">
    <nav className="workspace-nav" aria-label="Workspace"><a href="/?game=savage">Characters</a><a href="/campaigns">Campaigns</a><a href="/builder" aria-current="page">Master Builder</a><a href="/profile">My Profile</a></nav>
    <header className="workspace-hero"><div><span className="art-eyebrow">Your world. Your rules.</span><h1>Savage Master Builder</h1><p>A Game Master’s workshop for worlds only you can imagine.</p></div><img className="workspace-art" src="/images/art/campaign-tome.webp" alt="" width="720" height="480"/></header>

    <details className="builder-account" open={accountOpen} onToggle={e=>setAccountOpen(e.currentTarget.open)}><summary>My account &amp; saved worlds</summary>{cloud?<>{cloud.account}{cloud.authenticated&&<div className="builder-library">{cloud.worlds===undefined?<p>Loading your worlds…</p>:cloud.worlds.length===0?<p>No saved worlds yet. Create your first world below.</p>:cloud.worlds.map(row=><button key={row._id} disabled={busy} onClick={()=>{if(confirm('Open this saved world and replace the current draft? Download your current draft first if you want to keep it.'))run(async()=>{const w=await cloud.load(row._id);validateWorld(w);replace(w,row._id);setStatus('World loaded from your account.');});}}><strong>{row.name}{id===row._id?' (open)':''}</strong><small>{row.baseRules}</small></button>)}</div>}</>:<p>Account saving needs a configured Convex deployment. You can build locally and download backups.</p>}</details>
    <section className="builder-workshop"><div className="builder-heading"><div><span className="art-eyebrow">World workshop</span><h2>{world.name||'Your new world'}</h2></div><p className="builder-caption">{storageStatus||'Your draft stays in this browser.'}</p></div>
      <div className="builder-toolbar"><button disabled={busy} onClick={()=>{if(!cloud?.authenticated){setAccountOpen(true);setStatus('Sign in to save your world to your account. You can also download a backup.');return;}if(issues.length){setStatus(issues.join(' '));return;}run(async()=>{const savedId=await cloud.save(id,world);setId(savedId);setStatus('World saved privately to your account.');});}}>{busy?'Working…':'Save world to account'}</button><button className="secondary" disabled={busy} onClick={download}>Download backup</button><label className="builder-import">Import backup<input disabled={busy} type="file" accept=".json,application/json" onChange={importFile}/></label><button className="secondary" disabled={busy} onClick={()=>{if(confirm('Start a new world? Download or save your current world first.')){replace(newWorld());setStatus('New world started. Choose its rule foundation.');}}}>New world</button></div>
      <p className="builder-caption">Account worlds are private to their owner. Backups and printed copies include private GM lore. Custom rules are recorded here for your table; they do not change character calculations.</p>
      <p className="builder-status" role="status" aria-live="polite">{status}</p>
      <nav className="builder-steps" aria-label="World creation steps">{steps.map((label,n)=><button key={label} aria-current={step===n?'step':undefined} disabled={busy||(n>0&&foundation.length>0)} onClick={()=>go(n)}><span>0{n+1}</span>{label}</button>)}</nav>
      <fieldset className="builder-form" disabled={busy}><legend className="builder-step-title">{steps[step]}</legend>
        {step===0&&<><p>What rule set is this world based on?</p><div className="builder-rule-sets">{ruleSets.map(s=><label key={s.id} className={world.rules.base===s.id?'selected':''}><input type="radio" name="base-rule-set" value={s.id} checked={world.rules.base===s.id} onChange={()=>updateRule({base:s.id})}/><span><strong>{s.name}</strong><small>{s.detail}</small></span></label>)}</div>
          {world.rules.base&&<><div className="builder-grid">{['other','original'].includes(world.rules.base)&&<Field label="Rule set name" value={world.rules.name} onChange={name=>updateRule({name})} max={160}/>}<Field label="Edition, revision, or version" hint="Use the exact version your table follows, or leave this open." value={world.rules.edition} onChange={edition=>updateRule({edition})} max={200}/><Field label="How will you use these rules?" hint="Use a suggestion or write your own approach." value={world.rules.approach} list="rule-approaches" onChange={approach=>updateRule({approach})} max={200}/><datalist id="rule-approaches"><option value="Use the base rules"/><option value="Base rules with house rules"/><option value="Heavily customized rules"/><option value="Entirely original rules"/></datalist></div><Field label="Rule foundation notes" hint="Books, inspirations, systems you combine, and what you want to change." multiline value={world.rules.notes} onChange={notes=>updateRule({notes})}/></>}
          <p className="builder-caption">This choice is a starting point. You can return here and change it as your world develops.</p></>}
        {step===1&&<><Field label="World name" value={world.name} onChange={name=>update({name})} max={160}/><p>Every detail is yours to define. Leave sections open and return to them as your world grows.</p>{worldSections.map(([key,label,hint])=><Field key={key} label={label} hint={hint} multiline max={30000} value={world[key]} onChange={value=>update({[key]:value})}/>)}
          <h3>Custom world fields</h3><p>Add anything your world needs, with your own labels.</p>{world.customFields.map(f=><article key={f.id}><Field label="Field label" value={f.label} onChange={label=>rows('customFields',f.id,{label})} max={160}/><Field label={f.label||'Field contents'} multiline max={30000} value={f.value} onChange={value=>rows('customFields',f.id,{value})}/><button type="button" className="secondary" onClick={()=>remove('customFields',f.id)}>Remove field</button></article>)}<button type="button" className="secondary" disabled={world.customFields.length>=100} onClick={()=>update({customFields:[...world.customFields,{id:crypto.randomUUID(),label:'',value:''}]})}>Add custom field</button></>}
        {step===2&&(id&&cloud?.authenticated?<AccountWorldMaps key={world.mapKey+id} worldId={id} worldKey={world.mapKey} world={world} disabled={busy} onBusy={setBusy}/>:<LocalWorldMaps key={world.mapKey} worldKey={world.mapKey} world={world} disabled={busy} onBusy={setBusy}/>)}
        {step===3&&<><p>Define your own way to play. These are open writing fields, so any style or mechanic can fit.</p>{[
          ['experience','Experience at the table','What should sessions feel like? Tactical, narrative, exploration, intrigue, or something new.'],
          ['resolution','Conflict resolution','Dice, cards, tokens, diceless choices, success levels, and who resolves outcomes.'],
          ['characters','Character creation','Allowed options, custom traits, starting resources, and how characters belong in this world.'],
          ['advancement','Advancement & rewards','Milestones, experience, discoveries, reputation, or your own progression.'],
          ['table','Table conventions','Session structure, player roles, collaboration, boundaries, and how you handle rulings.'],
        ].map(([key,label,hint])=><Field key={key} label={label} hint={hint} multiline value={world.playStyle[key]} onChange={value=>update({playStyle:{...world.playStyle,[key]:value}})}/>)}
          <h3>Your house rules</h3><p>Create original rules or explain changes to {ruleSetName(world)}. Give each rule its own name and description.</p>{world.houseRules.map(r=><article key={r.id}><div className="builder-grid"><Field label="Rule name" max={160} value={r.name} onChange={name=>rows('houseRules',r.id,{name})}/><Field label="Category (optional)" hint="Combat, magic, travel, or any category you choose." max={160} value={r.category} onChange={category=>rows('houseRules',r.id,{category})}/></div><Field label="Rule description" hint="When does it apply? What happens? Include an example if useful." multiline value={r.text} onChange={text=>rows('houseRules',r.id,{text})}/><button type="button" className="secondary" onClick={()=>remove('houseRules',r.id)}>Remove rule</button></article>)}<button type="button" className="secondary" disabled={world.houseRules.length>=100} onClick={()=>update({houseRules:[...world.houseRules,{id:crypto.randomUUID(),name:'',category:'',text:''}]})}>Add house rule</button></>}
        {step===4&&<>{issues.length>0&&<aside className="builder-issues"><strong>Before saving to your account</strong><ul>{issues.map(issue=><li key={issue}>{issue}</li>)}</ul></aside>}<WorldReview world={world}/><h3>World maps</h3>{id&&cloud?.authenticated?<AccountWorldMaps key={world.mapKey+id} worldId={id} worldKey={world.mapKey} world={world} disabled={busy} onBusy={setBusy} readOnly/>:<LocalWorldMaps key={world.mapKey} worldKey={world.mapKey} world={world} disabled={busy} onBusy={setBusy} readOnly/>}<button className="secondary builder-print" type="button" onClick={()=>window.print()}>Print world reference</button></>}
      </fieldset>
      <div className="builder-footer"><span>{step>0?ruleSetName(world):'Choose a rule foundation to continue.'}</span><div><button className="secondary" disabled={busy||step===0} onClick={()=>go(step-1)}>Back</button>{step<4&&<button disabled={busy||foundation.length>0} onClick={()=>go(step+1)}>Next: {steps[step+1]}</button>}</div></div>
    </section>
    <details className="builder-tools"><summary>More world-building tools</summary><div><div className="builder-heading"><div><h2>Build one piece at a time</h2><p>Start with your world and its rule foundation.</p></div><span className="builder-badge">World builder · available now</span></div><div className="builder-roadmap"><span className="active">World <small>Open</small></span>{['Creatures','Species','Magic items','Gods','Towns','Cities','NPCs','Monsters','Lore'].map(label=><span key={label}>{label}<small>Upcoming builder</small></span>)}</div><p className="builder-caption">Record any of these ideas in your world’s lore or custom fields today. Dedicated builders will follow one at a time.</p></div></details>
  </main>;
}
function ConnectedBuilder(){
  const {isAuthenticated}=useConvexAuth(),convex=useConvex(),worlds=useQuery(ref('masterBuilder:list'),isAuthenticated?{}:'skip'),save=useMutation(ref('masterBuilder:save'));
  return <Builder cloud={{authenticated:isAuthenticated,worlds,account:<CharacterAccount accountOnly/>,load:id=>convex.query(ref('masterBuilder:load'),{id}),save:(id,world)=>save({...(id?{id}:{}),world})}}/>;
}
const url=import.meta.env.VITE_CONVEX_URL;
const root=import.meta.hot?.data.root??createRoot(document.getElementById('builderRoot'));
if(import.meta.hot)import.meta.hot.data.root=root;
root.render(url?<ConvexAuthProvider client={new ConvexReactClient(url)}><ConnectedBuilder/></ConvexAuthProvider>:<Builder/>);
