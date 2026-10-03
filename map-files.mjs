export const MAP_FILE_LIMIT=20*1024*1024;
export const MAP_WORLD_LIMIT=200*1024*1024;
export function validMapHeader(bytes,type){
  if(bytes.length<16)return false;
  const starts=values=>values.every((v,i)=>bytes[i]===v);
  if(type==='image/png')return starts([137,80,78,71,13,10,26,10]);
  if(type==='image/jpeg')return starts([255,216,255]);
  if(type==='image/webp')return starts([82,73,70,70])&&[87,69,66,80].every((v,i)=>bytes[i+8]===v);
  return false;
}
export async function validateMapFile(file){
  if(file.size>MAP_FILE_LIMIT||!validMapHeader(new Uint8Array(await file.slice(0,16).arrayBuffer()),file.type))throw new Error('Choose a PNG, JPEG, or WebP map up to 20 MB. Export other map formats as an image first.');
}
let database;
function db(){return database??=new Promise((resolve,reject)=>{const req=indexedDB.open('savage-master-world-maps',1);req.onupgradeneeded=()=>req.result.createObjectStore('maps',{keyPath:'id'}).createIndex('by_world','worldKey');req.onsuccess=()=>resolve(req.result);req.onerror=()=>{database=undefined;reject(req.error);};});}
async function operation(mode,action){const database=await db();return new Promise((resolve,reject)=>{const tx=database.transaction('maps',mode),req=action(tx.objectStore('maps'));let result;req.onsuccess=()=>{result=req.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
export function listLocalMaps(worldKey){return operation('readonly',store=>store.index('by_world').getAll(worldKey));}
export async function saveLocalMap(worldKey,file,details){
  await validateMapFile(file);const rows=await listLocalMaps(worldKey);
  if(rows.length>=50||rows.reduce((sum,r)=>sum+r.size,0)+file.size>MAP_WORLD_LIMIT)throw new Error('This browser world has reached its map limit: 50 maps or 200 MB.');
  const atlas=details.atlas||newAtlas();validateAtlas(atlas);
  return operation('readwrite',store=>store.put({id:crypto.randomUUID(),worldKey,blob:file,size:file.size,type:file.type,filename:file.name,...details,atlas,createdAt:Date.now()}));
}
export async function updateLocalMap(worldKey,id,atlas){
  validateAtlas(atlas);const maps=await listLocalMaps(worldKey),map=maps.find(m=>m.id===id);
  if(!map)throw new Error('Map not found.');
  if(atlas.id!==(map.atlas?.id||map.id))throw new Error('The map identity cannot change.');
  validateMapParents(atlas.id,atlas,maps);
  return operation('readwrite',store=>store.put({...map,atlas}));
}
export function removeLocalMap(id){return operation('readwrite',store=>store.delete(id));}
import {newAtlas,validateAtlas,validateMapParents} from './map-atlas.mjs';
