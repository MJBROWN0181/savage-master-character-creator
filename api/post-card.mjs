import {ImageResponse} from '@vercel/og';
import React from 'react';
import {publicPost,postId} from '../server/public-post.mjs';
export function cardElement(post){
  const e=React.createElement;
  return e('div',{style:{display:'flex',flexDirection:'column',width:'100%',height:'100%',padding:'52px 66px',background:'#111d20',color:'#eee9df',border:'8px solid #c6ab74',fontFamily:'sans-serif'}},
    e('div',{style:{display:'flex',justifyContent:'space-between',fontSize:23,color:'#c6ab74'}},e('span',null,'AROUND THE FIRE'),e('span',null,'Savage Master')),
    e('div',{style:{display:'flex',fontSize:post.title.length>65?38:46,fontWeight:700,lineHeight:1.13,marginTop:30,overflowWrap:'anywhere'}},post.title),
    e('div',{style:{display:'flex',fontSize:25,lineHeight:1.4,whiteSpace:'pre-wrap',marginTop:24,flexGrow:1,overflow:'hidden',overflowWrap:'anywhere'}},post.body.length>350?post.body.slice(0,347)+'...':post.body),
    e('div',{style:{display:'flex',justifyContent:'space-between',fontSize:21,marginTop:25,color:'#a0d4c1'}},e('span',null,`${post.author.name} · ${post.game}`),e('span',null,'smsheets.com')));
}
export async function serveCard(req,res,options={}){
  try{
    const post=await publicPost(postId(req),options.convexUrl);
    if(!post){res.statusCode=404;res.setHeader('Cache-Control','no-store');res.end('Post unavailable');return;}
    const image=new ImageResponse(cardElement(post),{width:1200,height:630});
    res.setHeader('Content-Type','image/png');res.setHeader('Cache-Control','public, max-age=60, s-maxage=60');res.end(Buffer.from(await image.arrayBuffer()));
  }catch{res.statusCode=503;res.setHeader('Cache-Control','no-store');res.end('Preview unavailable');}
}
export default function handler(req,res){return serveCard(req,res);}
