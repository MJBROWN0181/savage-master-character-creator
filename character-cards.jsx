import React,{useEffect,useRef,useState} from 'react';
import art from './character-art.json';
import './character-cards.css';

export function CardArt({system,type,id,sigil='✦'}){
 const source=type==='games'?art.games[id]:art[system]?.[type]?.[id];
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[source]);
 return <div className="tarot-art" aria-hidden="true">{source&&!failed?<img src={source} alt="" loading="lazy" decoding="async" onError={()=>setFailed(true)}/>:<><span className="tarot-orbit"/><span className="tarot-sigil">{sigil}</span><span className="tarot-star">✧</span></>}</div>;
}
export function ChoiceCards({system,type,rows,value,onChoose,details,greaterDetail,more=false,extraNote}){
 const [preview,setPreview]=useState(null),[expanded,setExpanded]=useState(false),[search,setSearch]=useState('');const dialog=useRef(null);
 useEffect(()=>{setPreview(null);setSearch('');},[type]);
 useEffect(()=>{if(preview&&!dialog.current.open)dialog.current.showModal();},[preview]);
 const close=()=>{dialog.current.close();setPreview(null);};
 const found=rows.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));
 return <>
  {rows.length>10&&<label className="choice-search">Find {type==='species'&&system==='pathfinder2e'?'an':'a'} {type==='species'&&system==='pathfinder2e'?'ancestry':type}<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name"/></label>}
  <div className={`choice-deck${type==='background'?' background-deck':''}`}>{found.map((r,i)=><article className={`tarot-card${type==='background'?' background-title-card':''}`} key={r.id||r.name}><button className="tarot-face" aria-label={`Meet ${r.name}`} onClick={()=>{setExpanded(false);setPreview(r);}}>{type!=='background'&&<CardArt system={system} type={type} id={r.id||r.name} sigil={r.sigil||'✦'}/>}<span className="tarot-caption"><small>{String(i+1).padStart(2,'0')}{value===r.name?' · Your choice':''}</small><strong>{r.name}</strong></span></button><button className="tarot-detail-link" onClick={()=>{setExpanded(true);setPreview(r);}} aria-label={`Greater Detail about ${r.name}`}>Greater Detail</button></article>)}</div>
  {!found.length&&<p>No cards match. Try another name.</p>}
  {more&&<details className="choice-expansion"><summary>More {type==='species'?(system==='pathfinder2e'?'ancestries':'species'):type==='background'?'backgrounds':'classes'} & table options</summary><p>There is room here for more options as they are added. Additional species, ancestries, and classes may not be accepted in every game. Check with your GM before using them.</p>{extraNote&&<p>{extraNote}</p>}</details>}
  <dialog ref={dialog} className={`choice-preview${type==='background'?' background-preview':''}`} onCancel={close} onClose={()=>setPreview(null)} aria-labelledby="choice-preview-title">
   {preview&&<><button className="choice-close" onClick={close} autoFocus aria-label="Close card">×</button>{type!=='background'&&<div className="choice-preview-art"><CardArt system={system} type={type} id={preview.id||preview.name} sigil={preview.sigil||'✦'}/></div>}<div className="choice-preview-copy"><small>{system==='dnd5e'?'D&D · Revised fifth edition':'Pathfinder · Second edition'}</small><h2 id="choice-preview-title">{preview.name}</h2>{details(preview)}<details className="choice-full-details" open={expanded} onToggle={e=>setExpanded(e.currentTarget.open)}><summary>Greater Detail</summary>{greaterDetail?greaterDetail(preview):<p>{preview.description}</p>}</details><p className="choice-gm-note">Check with your GM: additional options and uncommon choices may not be accepted at every table.</p></div><footer className="choice-preview-actions"><button className="choice-confirm" onClick={()=>{const selected=preview;close();onChoose(selected);}}>My choice: {preview.name}</button></footer></>}
  </dialog>
 </>;
}
