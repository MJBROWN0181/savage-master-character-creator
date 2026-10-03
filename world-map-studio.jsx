import React,{useEffect,useRef,useState} from 'react';
import {useAction,useMutation,useQuery} from 'convex/react';
import {makeFunctionReference as ref} from 'convex/server';
import {listLocalMaps,saveLocalMap,removeLocalMap,updateLocalMap,validateMapFile} from './map-files.mjs';
import {atlasFor} from './map-atlas.mjs';
import {MapAtlasEditor} from './map-atlas-editor.jsx';

const tools=[
  {name:'Inkarnate',url:'https://inkarnate.com/',kind:'Worlds, cities & battle maps',description:'A browser editor with illustrated map styles. Start with a free plan or choose a paid tier.',workflow:'Export your finished map as an image, then upload it here.',source:'https://inkarnate.com/faq/'},
  {name:'Azgaar’s Fantasy Map Generator',url:'https://azgaar.github.io/Fantasy-Map-Generator/',kind:'Worlds & regions',description:'A free, open source world generator with cultures, states, terrain, and settlements.',workflow:'Export as PNG or JPEG. Keep the .map project in Azgaar for future editing.',source:'https://github.com/Azgaar/Fantasy-Map-Generator/wiki/Knowledge-Base'},
  {name:'Dungeondraft',url:'https://dungeondraft.net/',kind:'Dungeons & battle maps',description:'A paid desktop editor with dungeon generation, terrain tools, and lighting. Works offline.',workflow:'Upload a rendered image here. Universal VTT data is a possible future import.',source:'https://dungeondraft.net/'},
  {name:'Wonderdraft',url:'https://wonderdraft.net/',kind:'Worlds & continents',description:'A paid desktop editor for coastlines, rivers, roads, and illustrated world maps. Works offline.',workflow:'Export your finished world map as an image, then upload it here.',source:'https://wonderdraft.net/'},
];
export function MapTools(){return <details className="map-tools"><summary>Recommended map-making tools</summary><p>Create a map in one of these tools, export a PNG, JPEG, or WebP image, and upload it to your world. Editors open in a new tab.</p><div className="map-tools-grid">{tools.map(t=><article key={t.name}><small>{t.kind}</small><h3>{t.name}</h3><p>{t.description}</p><p className="builder-caption">{t.workflow}</p><a href={t.url} target="_blank" rel="noopener noreferrer">Open {t.name} ↗</a><a className="map-source" href={t.source} target="_blank" rel="noopener noreferrer">Official details</a></article>)}</div><p className="builder-caption">Tools checked October 2, 2026. Visit the official sites for current plans and export options.</p></details>;}
function MapLibrary({worldKey,world,cloud=null,disabled=false,onBusy,readOnly=false}){
  const [local,setLocal]=useState([]),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[name,setName]=useState(''),[category,setCategory]=useState(''),[caption,setCaption]=useState(''),[selected,setSelected]=useState(null),[preview,setPreview]=useState(null);
  const input=useRef(null);
  useEffect(()=>{let active=true,urls=[];setLocal([]);setSelected(null);setPreview(null);setStatus('');
    listLocalMaps(worldKey).then(rows=>{if(!active)return;setLocal(rows.map(row=>{const url=URL.createObjectURL(row.blob);urls.push(url);return {...row,url};}));}).catch(()=>{if(active)setStatus('Browser map storage is unavailable. Use account saving or keep your original map files.');});
    return ()=>{active=false;urls.forEach(url=>URL.revokeObjectURL(url));};
  },[worldKey]);
  useEffect(()=>()=>{local.forEach(row=>URL.revokeObjectURL(row.url));},[local]);
  async function refresh(){const rows=(await listLocalMaps(worldKey)).map(row=>({...row,url:URL.createObjectURL(row.blob)}));setLocal(rows);return rows;}
  async function run(fn){setBusy(true);onBusy?.(true);setStatus('');try{await fn();}catch(e){setStatus(e.message?.includes('[CONVEX')?'Could not save this map to your account. Check your connection and try again.':e.message||'Could not store this map. Keep the original file and try again.');}finally{setBusy(false);onBusy?.(false);}}
  const locked=busy||disabled;
  async function upload(e){e.preventDefault();if(!selected)return;await run(async()=>{await validateMapFile(selected);const details={name:name.trim()||selected.name.slice(0,160),category,caption};if(cloud){await cloud.upload(selected,details);setStatus('Map saved to this world in your account.');}else{await saveLocalMap(worldKey,selected,details);await refresh();setStatus('Map saved in this browser. Keep your original file as a backup.');}setName('');setCategory('');setCaption('');setSelected(null);if(input.current)input.current.value='';});}
  function show(map){setPreview(map);}
  async function saveAnnotations(atlas){
    if(preview.local){await updateLocalMap(worldKey,preview.id,atlas);const rows=await refresh();setPreview({...rows.find(row=>row.id===preview.id),key:preview.key,local:true});}
    else{await cloud.update(preview._id,atlas);setPreview({...preview,atlas});}
    setStatus('Map annotations saved.');
  }
  const cards=[...local.map(row=>({...row,key:row.id,local:true})),...(cloud?.maps||[]).map(row=>({...row,key:row._id,local:false}))];
  return <div className="map-studio"><p>Upload maps for your world, regions, towns, cities, dungeons, or encounters. Open a map to add locations, lore, routes, borders, and printable handouts.</p><p className="builder-caption">PNG, JPEG, or WebP · up to 20 MB per map · 50 maps / 200 MB per world in each library. {cloud?'New uploads save to this account world.':'Uploads stay in this browser. Save or open an account world to keep maps across devices.'} World JSON backups contain text; download original images and annotation backups separately.</p>
    {!readOnly&&<form className="map-upload-form" onSubmit={upload}><fieldset disabled={locked}><label>Choose a map image<input ref={input} type="file" required accept="image/png,image/jpeg,image/webp" onChange={e=>setSelected(e.target.files?.[0]||null)}/></label><div className="builder-grid"><label>Map name (optional)<input maxLength={160} value={name} onChange={e=>setName(e.target.value)} placeholder="Defaults to the filename"/></label><label>Map category (optional)<input maxLength={160} value={category} onChange={e=>setCategory(e.target.value)} list="map-categories" placeholder="World, region, city, dungeon…"/><datalist id="map-categories">{['World','Region','Town','City','Dungeon','Battle map','Other'].map(v=><option key={v} value={v}/>)}</datalist></label></div><label>Map notes (optional)<textarea maxLength={2000} value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Location, scale, source, or private GM notes"/></label><button disabled={!selected||locked}>{busy?'Saving map…':'Upload map'}</button></fieldset></form>}
    <p role="status" aria-live="polite">{status}</p>{cloud&&cloud.maps===undefined&&<p>Loading account maps…</p>}
    {cards.length===0&&<div className="map-empty"><h3>Your atlas starts here</h3><p>Upload your first map, or use one of the recommended editors below.</p></div>}
    <div className="map-gallery">{cards.map(map=><article key={map.key}><button type="button" className="map-preview" disabled={locked||!map.url} onClick={()=>show(map)} aria-label={'Preview '+map.name}><img loading="lazy" src={map.url||undefined} alt={map.name}/></button><h3>{map.name}</h3><small>{map.category||'Map'} · {(map.size/1048576).toFixed(1)} MB · {map.local?'This browser':'Account world'}</small>{map.caption&&<p className="notes">{map.caption}</p>}<div className="map-actions">{map.url&&<a href={map.url} target="_blank" rel="noopener noreferrer" download={map.filename||map.name}>Open / download</a>}{!readOnly&&map.local&&cloud&&<button type="button" className="secondary" disabled={locked} onClick={()=>run(async()=>{await cloud.upload(map.blob,{name:map.name,category:map.category,caption:map.caption,atlas:atlasFor(map)});await removeLocalMap(map.id);await refresh();setStatus('Map moved to your account world.');})}>Save map to account</button>}{!readOnly&&<button type="button" className="secondary" disabled={locked} onClick={()=>{if(confirm('Delete '+map.name+' from '+(map.local?'this browser':'this account world')+'? Keep a downloaded copy if you need it.'))run(async()=>{if(map.local){await removeLocalMap(map.id);await refresh();}else await cloud.remove(map._id);setStatus('Map deleted.');});}}>Delete map</button>}</div></article>)}</div>
    {preview&&<MapAtlasEditor key={preview.key} map={preview} maps={cards} world={world} readOnly={readOnly} onSave={saveAnnotations} onClose={next=>setPreview(next||null)} onBusy={value=>{setBusy(value);onBusy?.(value);}}/>}
    {!readOnly&&<MapTools/>}
  </div>;
}
export function LocalWorldMaps(props){return <MapLibrary {...props}/>;}
export function AccountWorldMaps({worldId,...props}){
  const maps=useQuery(ref('worldMaps:list'),{worldId}),uploadUrl=useMutation(ref('worldMaps:uploadUrl')),finish=useAction(ref('worldMaps:finishUpload')),remove=useMutation(ref('worldMaps:remove')),update=useMutation(ref('worldMaps:updateAtlas'));
  async function upload(file,details){await validateMapFile(file);const {url,ticket}=await uploadUrl({worldId});const response=await fetch(url,{method:'POST',headers:{'Content-Type':file.type},body:file});if(!response.ok)throw new Error('Map upload failed. Try again.');const {storageId}=await response.json();await finish({ticket,storageId,...details});}
  return <MapLibrary {...props} cloud={{maps,upload,remove:id=>remove({id}),update:(id,atlas)=>update({id,atlas})}}/>;
}
