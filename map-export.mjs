import {exportAtlas,printLayout,routeSummary,mapBadgePoint} from './map-atlas.mjs';
export function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
export function mapKeyHtml(projection){
  return `<h2>${escapeHtml(projection.title)} - location key</h2>`+projection.markers.map((m,i)=>`<section><h3>${i+1}. ${escapeHtml(m.name)}${m.type?` (${escapeHtml(m.type)})`:''}</h3><p>${escapeHtml(m.notes)}</p>${m.gmNotes?`<p><strong>GM only:</strong> ${escapeHtml(m.gmNotes)}</p>`:''}</section>`).join('')+(projection.routes.length?`<h3>Routes & borders</h3><ul>${projection.routes.map(r=>`<li>${escapeHtml(r.name)}${r.summary||r.override?` — ${escapeHtml(r.summary||r.override)}`:''}</li>`).join('')}</ul>`:'');
}
export function printMapHtml(dataUrl,projection,layout){
  if(!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(dataUrl))throw new Error('Invalid rendered map.');
  const l=printLayout(layout),pages=[];
  for(let y=0;y<l.rows;y++)for(let x=0;x<l.columns;x++)pages.push(`<div class="sheet"><div class="crop" style="width:${l.pageWidth}in;height:${l.pageHeight}in"><img alt="Map" src="${dataUrl}" style="width:${l.mapWidth}in;height:${l.mapHeight}in;left:${-x*(l.pageWidth-l.overlap)}in;top:${-y*(l.pageHeight-l.overlap)}in"></div><footer>${escapeHtml(projection.title)} · row ${y+1}, column ${x+1} · Print at 100% <span class="ruler">1 inch</span></footer></div>`);
  return `<!doctype html><html><head><meta charset="UTF-8"><title>${escapeHtml(projection.title)}</title><style>@page{size:${l.paper==='letter'?'letter':l.paper.toUpperCase()} ${l.orientation};margin:.4in}*{box-sizing:border-box}body{margin:0;font:12px system-ui;color:#111}h2,h3{font-family:Georgia,serif}p{white-space:pre-wrap;overflow-wrap:anywhere}.sheet{break-after:page;width:${l.pageWidth}in}.crop{position:relative;overflow:hidden;border:1px dashed #aaa}.crop img{position:absolute;max-width:none}footer{height:.35in;padding-top:.05in;font-size:9px;display:flex;align-items:center;justify-content:space-between}.ruler{display:inline-block;border:1px solid black;border-top:0;width:1in;text-align:center;height:.16in}.key section{break-inside:avoid}section h3{margin-bottom:4px}.key p{margin-top:0}</style></head><body>${pages.join('')}<div class="key">${mapKeyHtml(projection)}</div></body></html>`;
}
async function imageFor(map){
  const response=await fetch(map.url);if(!response.ok)throw new Error('Could not read this map for export.');
  const url=URL.createObjectURL(await response.blob());
  try{const image=new Image();image.src=url;await image.decode();return image;}finally{URL.revokeObjectURL(url);}
}
export async function renderMap(map,atlas,audience){
  const projection=exportAtlas(atlas,audience);if(audience==='gm')projection.title=map.name;
  const image=await imageFor(map),ratio=Math.min(1,8000/image.naturalWidth,8000/image.naturalHeight,Math.sqrt(40000000/(image.naturalWidth*image.naturalHeight))),width=Math.max(1,Math.round(image.naturalWidth*ratio)),height=Math.max(1,Math.round(image.naturalHeight*ratio));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image export is unavailable in this browser.');
  ctx.drawImage(image,0,0,width,height);const font=Math.max(12,Math.round(width/70)),color=id=>projection.layers.find(l=>l.id===id)?.color||'#d2a347';
  ctx.lineWidth=Math.max(2,width/450);ctx.lineJoin='round';ctx.lineCap='round';
  for(const r of projection.routes){ctx.beginPath();r.points.forEach((p,i)=>{if(i)ctx.lineTo(p.x*width,p.y*height);else ctx.moveTo(p.x*width,p.y*height);});if(r.kind==='border'){ctx.closePath();ctx.fillStyle=color(r.layerId)+'22';ctx.fill();}ctx.strokeStyle=color(r.layerId);ctx.setLineDash(r.kind==='border'?[ctx.lineWidth*3,ctx.lineWidth*2]:[]);ctx.stroke();}
  ctx.setLineDash([]);ctx.font=`bold ${font}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';
  projection.markers.forEach((m,i)=>{const radius=Math.max(font*.8,font*String(i+1).length*.34),stroke=Math.max(1,font/10),{x,y}=mapBadgePoint(m,width,height,radius+stroke);ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fillStyle=color(m.layerId);ctx.fill();ctx.strokeStyle='#ffffff';ctx.lineWidth=stroke;ctx.stroke();ctx.fillStyle='#151b20';ctx.fillText(String(i+1),x,y);});
  const aspect=image.naturalWidth/image.naturalHeight;
  if(audience==='gm')projection.routes=projection.routes.map(r=>({...r,summary:r.kind==='border'?'Border / region':routeSummary(r,atlas,aspect)}));
  return {canvas,projection,aspect,reduced:ratio<1};
}
export function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.hidden=true;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function downloadMapKey(map,atlas,audience){
  const p=exportAtlas(atlas,audience);if(audience==='gm')p.title=map.name;
  downloadBlob(new Blob([`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(audience)} map key</title><style>p{white-space:pre-wrap;overflow-wrap:anywhere}body{font:16px system-ui;max-width:800px;padding:24px}section{break-inside:avoid}</style></head><body>${mapKeyHtml(p)}</body></html>`],{type:'text/html'}),`${audience}-map-key.html`);
  return `${audience==='gm'?'Private GM':'Player'} location key downloaded.`;
}
export async function downloadMap(map,atlas,audience){
  const {canvas,projection,reduced}=await renderMap(map,atlas,audience),blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Map export failed.');
  const stem=(projection.title||'Map').replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,80);
  downloadBlob(blob,`${stem}-${audience}.png`);
  return reduced?'Map exported. The image was reduced to fit the export size limit; your original is unchanged.':'Map exported. Download a location key or print the map with its key when needed.';
}
export async function printMap(map,atlas,audience,options){
  const {canvas,projection,aspect,reduced}=await renderMap(map,atlas,audience),html=printMapHtml(canvas.toDataURL('image/png'),projection,{...options,aspect}),frame=document.createElement('iframe');
  frame.title='Printable map';frame.style.cssText='position:fixed;width:1px;height:1px;left:-10000px;border:0';
  try{await new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=reject;frame.srcdoc=html;document.body.append(frame);});const images=[...frame.contentDocument.images];await Promise.all(images.map(image=>image.decode()));frame.contentWindow.onafterprint=()=>frame.remove();frame.contentWindow.focus();frame.contentWindow.print();}
  catch{frame.remove();throw new Error('Could not open map printing. Download the map and key instead.');}
  return reduced?'Print preview opened. The image was reduced to fit the export size limit.':'Print preview opened. Choose Save as PDF or your printer, and print at 100% scale.';
}
