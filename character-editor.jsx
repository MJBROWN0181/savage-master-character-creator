import React,{useEffect,useReducer,useRef} from 'react';
import {createPortal} from 'react-dom';
import {useConvex,useConvexAuth,useMutation,useQuery} from 'convex/react';
import {makeFunctionReference as ref} from 'convex/server';
import {CharacterEditor} from './character-editor.mjs';
import './character-editor.css';

export function downloadCharacter(snapshot){const url=URL.createObjectURL(new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='character-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function useCharacterEditor(config){
 const {isAuthenticated,isLoading}=useConvexAuth(),client=useConvex();
 const owner=useQuery(ref('characters:editorIdentity'),isAuthenticated?{}:'skip');
 const save=useMutation(ref('characters:saveForEdit'));
 const [,redraw]=useReducer(n=>n+1,0),session=useRef(null),mounted=useRef(false);
 const parameters=new URLSearchParams(typeof location==='undefined'?'':location.search),campaign=parameters.get('campaign'),ambiguous=parameters.has('create')&&!!campaign;
 const cfg={...config,online:()=>typeof navigator==='undefined'||navigator.onLine,storage:typeof localStorage==='undefined'?null:localStorage,download:config.download||downloadCharacter,load:args=>client.query(ref('characters:loadForEdit'),args),save,onChange:()=>{if(mounted.current)redraw();}};
 if(!session.current)session.current=new CharacterEditor(cfg);session.current.config=cfg;
 const editor=session.current;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;editor.generation++;};},[editor]);
 useEffect(()=>{if(!isLoading)editor.setOwner(isAuthenticated?owner:null);},[isAuthenticated,isLoading,owner,editor]);
 useEffect(()=>{
  if(!config.active||!config.ready())return;
  editor.restore();
  let cancelled=false;
  const resume=async()=>{
   if(editor.binding&&!editor.bindingVerified)await editor.verifyBinding();
   if(cancelled||editor.owner!==owner)return;
   if(campaign&&!editor.started&&owner){editor.started=true;if(ambiguous)editor.mark('Choose either your new character or your campaign character. Use Back to campaign to open it safely.');else editor.open({campaignId:campaign});}
  };resume();return()=>{cancelled=true;};
 },[owner,campaign,ambiguous,config.active,config.ready(),editor]);
 return editor;
}
export function CharacterEditorPanel({editor,target}){
 const dialog=useRef(null),previousFocus=useRef(null),d=editor.dialog;
 const campaign=new URLSearchParams(typeof location==='undefined'?'':location.search).get('campaign');
 useEffect(()=>{if(d){if(!dialog.current.open){previousFocus.current=document.activeElement;dialog.current.showModal();dialog.current.querySelector('button')?.focus();}}else if(dialog.current?.open){dialog.current.close();previousFocus.current?.focus?.();}},[d]);
 const decision=<dialog className="character-editor-dialog" ref={dialog} aria-label={d?.kind==='conflict'?'Account copy changed':d?.kind==='create'?'Save device draft to account':'Open account character'} onKeyDown={e=>e.stopPropagation()} onCancel={e=>{e.preventDefault();editor.cancel();}}>
   <h2>{d?.kind==='conflict'?'Your account copy changed':d?.kind==='create'?'Save this device draft?':'Open '+(d?.record?.snapshot?.character?.name||'account character')+'?'}</h2>
   <p>{d?.kind==='conflict'?'Another account save changed this character. Keep your draft or download it before loading the account version.':d?.kind==='create'?'This will create a new character in the account you are signed into. Your existing account characters will stay as they are.':'Opening this character will replace the draft currently on this device. Keep it or download a backup before continuing.'}</p>
   <div className="character-editor-actions">
    <button type="button" onClick={()=>editor.cancel()}>Keep this draft</button>
    <button type="button" onClick={()=>editor.download()}>Download backup</button>
    {d?.kind==='open'&&<button type="button" onClick={()=>editor.acceptOpen()}>Open {d.record.snapshot.character.name}</button>}
    {d?.kind==='create'&&<button type="button" onClick={()=>editor.save(true)}>Save to this account</button>}
    {d?.kind==='conflict'&&<button type="button" onClick={()=>{editor.dialog=null;editor.open({id:editor.binding.id});}}>Load account version</button>}
    <button type="button" className="secondary" onClick={()=>editor.cancel()}>Close</button>
   </div>
  </dialog>;
 const content=<div className="character-editor-panel">
  {campaign&&<a className="btn secondary" href={'/campaigns?campaign='+encodeURIComponent(campaign)+'&view=table'}>Back to campaign</a>}
  <p className="character-editor-status" role="status" aria-live="polite">{editor.message()}</p>
  {editor.pending&&/^(Opening|Checking)/.test(editor.status)&&<button type="button" onClick={()=>editor.cancelOpen()}>Cancel opening</button>}
  {campaign&&editor.owner&&!editor.pending&&!editor.dialog&&/^(Could not|Opening cancelled|You are offline)/.test(editor.status)&&<button type="button" onClick={()=>editor.open({campaignId:campaign})}>Try opening again</button>}
 </div>;
 const body=typeof document==='undefined'?null:document.body;
 return <>{target?createPortal(content,target):content}{body?createPortal(decision,body):decision}</>;
}
