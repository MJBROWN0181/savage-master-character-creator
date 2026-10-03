import React,{useEffect,useRef,useState} from 'react';
import {firstMissing,validCompletions,advanceCompletions} from './creation-flow.mjs';
import './creation-workshop.css';
import './creation-notice.js';

export function CreationWorkshop({system,step,setStep,chapters,summary,completed=[],setCompleted,children,tools,choiceStep=false}){
 const [book,setBook]=useState(null),[previewExpanded,setPreviewExpanded]=useState(false),dialog=useRef(null),heading=useRef(null),journey=useRef(null),nextChoice=useRef(null);
 const visible=chapters.map((chapter,i)=>({...chapter,index:i})).filter(ch=>!ch.skipped),next=visible.find(ch=>ch.index>step)?.index??step,previous=visible.filter(ch=>ch.index<step).at(-1)?.index??step;
 useEffect(()=>{if(chapters[step]?.skipped)setStep(next!==step?next:previous);},[step,chapters[step]?.skipped,next,previous]);
 const all=chapters.flatMap((chapter,i)=>chapter.missing.map(message=>({message,i})));
 const finished=validCompletions(chapters,completed),finishedKey=finished.join(',');
 useEffect(()=>{if(finishedKey!==completed.join(','))setCompleted(finished);},[finishedKey,completed,setCompleted]);
 useEffect(()=>{if(book!==null&&!dialog.current.open)dialog.current.showModal();},[book]);
 useEffect(()=>{const frame=requestAnimationFrame(()=>{window.scrollTo({top:0,left:0,behavior:'instant'});heading.current?.focus({preventScroll:true});if(journey.current)journey.current.open=false;});return ()=>cancelAnimationFrame(frame);},[step]);
 const close=()=>{dialog.current.close();setBook(null);};
 const navigate=target=>{window.scrollTo({top:0,left:0,behavior:'instant'});setStep(target);};
 const missingNotice=index=>{const ch=chapters[index];window.showCreationNotice({title:`Complete ${ch.title}`,message:ch.missing.slice(0,3).join(' ')+(ch.missing.length>3?' Open the Creation book for the full checklist.':'')});};
 const move=target=>{
  const missing=target>step?firstMissing(chapters,target):-1;
  if(missing>=0){navigate(missing);missingNotice(missing);return;}
  if(target>step)setCompleted(advanceCompletions(chapters,completed,target));
  navigate(target);
 };
 const current=chapters[step];
 nextChoice.current=()=>move(next);
 useEffect(()=>{const guide=e=>window.showCreationNotice({...e.detail,onContinue:e.detail.onContinue||(step<chapters.length-1?()=>nextChoice.current():undefined),continueLabel:e.detail.continueLabel||`Continue to ${chapters[next]?.title||'review'}`});window.addEventListener('creation-choice-notice',guide);return()=>window.removeEventListener('creation-choice-notice',guide);},[step,chapters,completed]);
 const returnToChapter=()=>{const target=book??step,missing=target>step?firstMissing(chapters,target):-1;if(missing>=0){navigate(missing);setBook(missing);return;}close();move(target);};
 const finish=()=>{if(all.length){navigate(all[0].i);missingNotice(all[0].i);return;}setCompleted(visible.map(ch=>ch.index));setBook(step);};
 return <div className="creation-workshop creation-calm">
  <aside className="creation-summary" data-expanded={previewExpanded} aria-label="Live character preview"><small>{system==='dnd5e'?'DUNGEONS & DRAGONS 5E':'PATHFINDER 2E'}</small>{summary}<button className="creation-preview-toggle" aria-expanded={previewExpanded} aria-controls="creation-preview-details" onClick={()=>setPreviewExpanded(v=>!v)}>{previewExpanded?'Hide character details':'See character details'}</button></aside>
  <div className="creation-page">
   <div className="creation-quiet-nav"><a href="/create">← Choose a game</a><div><details ref={journey} className="creation-journey"><summary>Your journey</summary><nav aria-label="Character creation steps">{visible.map((chapter,position)=>{const i=chapter.index;return <button key={chapter.id} aria-current={step===i?'step':undefined} data-completed={finished.includes(i)} onClick={()=>move(i)}><span aria-hidden="true">{finished.includes(i)?'✓':position+1}</span>{chapter.title}</button>})}</nav></details><button onClick={()=>setBook(step)}>Creation book</button></div></div>
   <div className="creation-step-heading"><div><small>Step {visible.findIndex(ch=>ch.index===step)+1} of {visible.length}</small><h2 ref={heading} tabIndex={-1}>{current.title}</h2></div></div>
   <p className="creation-intro">{current.hint}</p>
   {children}
   <div className="creation-footer"><button disabled={step===0} onClick={()=>move(previous)}>Back</button>{step<chapters.length-1?(!choiceStep&&<button onClick={()=>move(next)}>Continue to {chapters[next].title}</button>):<button onClick={finish}>Finish character review</button>}</div>
   {tools&&<details className="creation-tools"><summary>Draft tools & saved characters</summary>{tools}</details>}
  </div>
  <aside className="creation-timeline" aria-label="Creation progress"><small>YOUR JOURNEY</small><nav aria-label="Character creation timeline">{visible.map((chapter,position)=>{const i=chapter.index;return <button key={chapter.id} aria-current={step===i?'step':undefined} data-completed={finished.includes(i)} onClick={()=>move(i)}><span aria-hidden="true">{finished.includes(i)?'✓':position+1}</span>{chapter.title}</button>})}</nav></aside>
  <dialog ref={dialog} className="creation-book" aria-labelledby="creation-book-title" onCancel={close} onClose={()=>setBook(null)}><div className="creation-book-top"><div><small>YOUR CHARACTER CREATION BOOK</small><h2 id="creation-book-title">{chapters[book??step].title}</h2></div><button onClick={close} autoFocus>Close book</button></div><div className="creation-book-spread"><div><small>THIS CHAPTER</small><p>{chapters[book??step].hint}</p><h3>{chapters[book??step].missing.length?'Before moving on':'This chapter is ready'}</h3>{chapters[book??step].missing.length?<ul>{chapters[book??step].missing.map(message=><li key={message}>{message}</li>)}</ul>:<p>{!all.length&&(book??step)===chapters.length-1?'Your character is ready. Close the book to use your sheet. Download a backup or save to your account through Draft tools.':'These choices are ready. Earlier chapters and table-specific options still need their own checks.'}</p>}<button onClick={returnToChapter}>Return to {chapters[book??step].title}</button></div><div><small>THE WHOLE JOURNEY</small>{visible.map((chapter,position)=>{const i=chapter.index;return <div className="creation-book-chapter" key={chapter.id}><button onClick={()=>setBook(i)} aria-pressed={book===i}>{position+1}. {chapter.title} · {chapter.missing.length?`${chapter.missing.length} remaining`:'Ready'}</button>{chapter.missing.length>0&&<ul>{chapter.missing.map(message=><li key={message}>{message}</li>)}</ul>}</div>})}</div></div></dialog>
 </div>;
}
