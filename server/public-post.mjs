export const defaultConvex = 'https://striped-jaguar-856.convex.cloud';
export async function publicPost(id,convexUrl=process.env.CONVEX_PUBLIC_URL||process.env.VITE_CONVEX_URL||defaultConvex){
  if(typeof id!=='string'||!/^[a-z0-9]{20,64}$/.test(id))return null;
  const url=new URL(convexUrl);
  if(url.protocol!=='https:'||!url.hostname.endsWith('.convex.cloud'))throw new Error('Unavailable deployment');
  const result=await fetch(`${url.origin}/api/query`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:'chronicles:post',args:{id},format:'json'}),redirect:'error',signal:AbortSignal.timeout(8000)});
  if(!result.ok)throw new Error('Unavailable post');
  const data=await result.json();
  if(data.status!=='success')throw new Error('Unavailable post');
  return data.value?.public===false?null:data.value;
}
export function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function postId(req){return typeof req.query?.post==='string'?req.query.post:new URL(req.url,'http://localhost').searchParams.get('post');}
export function shareHtml(post,id,origin='https://smsheets.com'){
  const title=escapeHtml(post?.title||'Post unavailable'),description=escapeHtml(post?post.body.slice(0,240):'This post is private, removed, or no longer available.'),url=`${origin}/p/${encodeURIComponent(id||'')}`,image=`${origin}/api/post-card?post=${encodeURIComponent(id||'')}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Around the Fire</title><meta name="description" content="${description}">${post?`<link rel="canonical" href="${escapeHtml(url)}"><meta property="og:type" content="article"><meta property="og:site_name" content="Savage Master"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${escapeHtml(url)}"><meta property="og:image" content="${escapeHtml(image)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${title} — ${escapeHtml(post.author.name)}"><meta name="twitter:card" content="summary_large_image">`:''}<script src="/appearance.js"></script><link rel="stylesheet" href="/app-design.css"><link rel="stylesheet" href="/shared-post.css"><script src="/workspace-shell.js" defer></script></head><body><main><p>Around the Fire · Savage Master</p><article><h1>${title}</h1>${post?`<p>By <a href="/profile?user=${encodeURIComponent(post.author.handle)}">${escapeHtml(post.author.name)}</a> · ${escapeHtml(post.game)}</p><p style="white-space:pre-wrap">${escapeHtml(post.body)}</p><a href="/chronicles?post=${encodeURIComponent(id)}">Open this post to follow, react, and share</a>`:`<p>${description}</p>`}</article><p><a href="/chronicles">Gather Around the Fire</a></p></main></body></html>`;
}
