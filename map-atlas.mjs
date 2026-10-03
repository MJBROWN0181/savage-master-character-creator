export const atlasLayers=[{id:'places',name:'Locations',color:'#d2a347',public:true,visible:true},{id:'travel',name:'Travel routes',color:'#3388b1',public:true,visible:true},{id:'politics',name:'Borders & factions',color:'#af659e',public:true,visible:true},{id:'secrets',name:'GM secrets',color:'#cf655b',public:false,visible:true}];
export function newAtlas(id=crypto.randomUUID()){return {version:1,id,parentMapId:'',publicTitle:'',playerSafeBase:false,layers:atlasLayers.map(l=>({...l})),markers:[],routes:[],scale:null,travel:{rate:0,period:'day'}};}
export function validateAtlas(a){
  const fail=()=>{throw new Error('Invalid map annotations.');},record=x=>x&&typeof x==='object'&&!Array.isArray(x),text=(x,max)=>typeof x==='string'&&x.length<=max;
  const keys=(x,allowed)=>record(x)&&Object.keys(x).every(k=>allowed.includes(k));
  const id=x=>text(x,120)&&!!x.trim(),point=p=>keys(p,['x','y'])&&Number.isFinite(p.x)&&p.x>=0&&p.x<=1&&Number.isFinite(p.y)&&p.y>=0&&p.y<=1;
  if(!keys(a,['version','id','parentMapId','publicTitle','playerSafeBase','layers','markers','routes','scale','travel'])||a.version!==1||!id(a.id)||!text(a.parentMapId,120)||a.parentMapId===a.id||!text(a.publicTitle,160)||typeof a.playerSafeBase!=='boolean'||JSON.stringify(a).length>300000)fail();
  if(!Array.isArray(a.layers)||a.layers.length<1||a.layers.length>20)fail();
  const layerIds=new Set();
  for(const l of a.layers){if(!keys(l,['id','name','color','public','visible'])||!id(l.id)||layerIds.has(l.id)||!text(l.name,80)||!l.name.trim()||!/^#[0-9a-fA-F]{6}$/.test(l.color)||typeof l.public!=='boolean'||typeof l.visible!=='boolean')fail();layerIds.add(l.id);}
  if(!Array.isArray(a.markers)||a.markers.length>200||!Array.isArray(a.routes)||a.routes.length>100)fail();
  const ids=new Set();
  for(const m of a.markers){if(!keys(m,['id','x','y','name','type','layerId','public','notes','gmNotes','targetMapId','worldField'])||!id(m.id)||ids.has(m.id)||!point({x:m.x,y:m.y})||!text(m.name,160)||!m.name.trim()||!text(m.type,80)||!layerIds.has(m.layerId)||typeof m.public!=='boolean'||!text(m.notes,10000)||!text(m.gmNotes,10000)||!text(m.targetMapId,120)||!text(m.worldField,160))fail();ids.add(m.id);}
  for(const r of a.routes){if(!keys(r,['id','name','kind','layerId','public','points','factor','override'])||!id(r.id)||ids.has(r.id)||!text(r.name,160)||!r.name.trim()||r.kind!==undefined&&!['travel','border'].includes(r.kind)||!layerIds.has(r.layerId)||typeof r.public!=='boolean'||!Array.isArray(r.points)||r.points.length<(r.kind==='border'?3:2)||r.points.length>100||r.points.some(p=>!point(p))||!Number.isFinite(r.factor)||r.factor<=0||r.factor>100||!text(r.override,200))fail();ids.add(r.id);}
  if(a.scale!==null&&(!keys(a.scale,['a','b','distance','unit'])||!point(a.scale.a)||!point(a.scale.b)||a.scale.a.x===a.scale.b.x&&a.scale.a.y===a.scale.b.y||!Number.isFinite(a.scale.distance)||a.scale.distance<=0||a.scale.distance>1e12||!text(a.scale.unit,40)||!a.scale.unit.trim()))fail();
  if(!keys(a.travel,['rate','period'])||!Number.isFinite(a.travel.rate)||a.travel.rate<0||a.travel.rate>1e12||!text(a.travel.period,40)||!a.travel.period.trim())fail();
  return a;
}
export function atlasFor(map){return map.atlas||newAtlas(map.id||map._id);}
// Keep numbered badges legible at the artwork boundary without changing map coordinates.
export function mapBadgePoint(point,width,height,padding){
  const xInset=Math.min(padding,width/2),yInset=Math.min(padding,height/2);
  return {x:Math.max(xInset,Math.min(width-xInset,point.x*width)),y:Math.max(yInset,Math.min(height-yInset,point.y*height))};
}
export function exportAtlas(atlas,audience='player'){
  validateAtlas(atlas);
  if(!['player','gm'].includes(audience))throw new Error('Choose a player or GM copy.');
  if(audience==='player'&&!atlas.playerSafeBase)throw new Error('Use a base image without secrets and mark it safe for player exports first.');
  const layers=atlas.layers.filter(l=>l.visible&&(audience==='gm'||l.public)),ids=new Set(layers.map(l=>l.id));
  const markers=atlas.markers.filter(m=>ids.has(m.layerId)&&(audience==='gm'||m.public)).map(m=>audience==='gm'?{...m}:{id:m.id,x:m.x,y:m.y,name:m.name,type:m.type,layerId:m.layerId,notes:m.notes});
  const routes=atlas.routes.filter(r=>ids.has(r.layerId)&&(audience==='gm'||r.public)).map(r=>audience==='gm'?{...r}:{id:r.id,name:r.name,kind:r.kind||'travel',layerId:r.layerId,points:r.points.map(p=>({...p}))});
  // Player output has no GM text, world-record references, hidden names, map links,
  // or GM travel overrides. Exporters receive only this projection.
  return {title:atlas.publicTitle||'Map',layers,markers,routes,...(audience==='gm'?{scale:atlas.scale,travel:atlas.travel}:{})};
}
export function routeDistance(points,scale,aspect=1){
  if(!scale||!Number.isFinite(aspect)||aspect<=0)return null;
  const distance=(a,b)=>Math.hypot((a.x-b.x)*aspect,a.y-b.y),reference=distance(scale.a,scale.b);
  if(!reference)return null;
  let length=0;for(let i=1;i<points.length;i++)length+=distance(points[i-1],points[i]);return length/reference*scale.distance;
}
export function routeSummary(route,atlas,aspect){
  const distance=routeDistance(route.points,atlas.scale,aspect);
  if(distance===null)return 'Set a map scale to measure this route.';
  const length=`${Number(distance.toFixed(2))} ${atlas.scale.unit}`;
  const periods=Number((distance/atlas.travel.rate*route.factor).toFixed(2)),unit=atlas.travel.period;
  const plural=unit==='watch'?'watches':unit.endsWith('s')?unit:unit+'s';
  return length+(route.override?` · ${route.override}`:atlas.travel.rate>0?` · ${periods} ${periods===1?unit:plural} at your travel rate`:'');
}
export function validateMapParents(id,atlas,maps){
  let parent=atlas.parentMapId;const seen=new Set([id]);
  while(parent){if(seen.has(parent))throw new Error('Map connections cannot form a parent loop.');seen.add(parent);parent=maps.find(m=>atlasFor(m).id===parent)?.atlas?.parentMapId||'';}
}
export const printPapers={letter:{name:'US Letter',width:8.5,height:11},a4:{name:'A4',width:8.2677,height:11.6929},a3:{name:'A3',width:11.6929,height:16.5354}};
export function printLayout({paper='letter',orientation='landscape',mode='fit',width=20,aspect=1}){
  const p=printPapers[paper];if(!p||!['portrait','landscape'].includes(orientation)||!['fit','poster'].includes(mode)||mode==='poster'&&(!Number.isFinite(width)||width<1||width>200)||!Number.isFinite(aspect)||aspect<=0)throw new Error('Choose valid print dimensions.');
  const pageWidth=(orientation==='landscape'?p.height:p.width)-0.8,pageHeight=(orientation==='landscape'?p.width:p.height)-1.2;
  const mapWidth=mode==='fit'?Math.min(pageWidth,pageHeight*aspect):width,mapHeight=mapWidth/aspect,overlap=mode==='fit'?0:0.15;
  const columns=Math.max(1,Math.ceil((mapWidth-overlap)/(pageWidth-overlap)-1e-8)),rows=Math.max(1,Math.ceil((mapHeight-overlap)/(pageHeight-overlap)-1e-8));
  if(columns*rows>100)throw new Error('This poster would need more than 100 pages. Reduce its print width.');
  return {paper,orientation,mapWidth,mapHeight,pageWidth,pageHeight,overlap,columns,rows,pages:columns*rows};
}
