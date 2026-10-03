import {publicPost,postId,shareHtml} from '../server/public-post.mjs';
export async function serveShare(req,res,options={}){
  const id=postId(req);
  try{
    const post=await publicPost(id,options.convexUrl);
    res.statusCode=post?200:404;res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');
    res.end(shareHtml(post,id,options.origin||'https://smsheets.com'));
  }catch{res.statusCode=503;res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','text/plain');res.end('This post is temporarily unavailable.');}
}
export default function handler(req,res){return serveShare(req,res);}
