import {readFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const manifest=JSON.parse(await readFile('character-art.json','utf8'));
const queue=JSON.parse(await readFile('design/CHARACTER-CARD-ART-QUEUE.json','utf8'));
const paths=[];
const walk=value=>{if(typeof value==='string'&&value.startsWith('/images/'))paths.push(value);else if(value&&typeof value==='object')Object.values(value).forEach(walk);};
walk(manifest);
const hashes=new Map();
for(const path of paths){
 const bytes=await readFile('.'+path),metadata=await sharp(bytes).metadata();
 if(metadata.width!==640||!metadata.height)throw new Error('Unexpected image dimensions: '+path);
 const hash=createHash('sha256').update(bytes).digest('hex');
 if(hashes.has(hash))throw new Error('Reused image bytes: '+path+' and '+hashes.get(hash));
 hashes.set(hash,path);
}
for(const job of queue.jobs.filter(j=>j.status==='installed'&&j.web.includes(j.asset))){
 await access(`design/art-source/cards/${job.asset}-v${job.version||1}.png`);
}
console.log(JSON.stringify({mappedImages:paths.length,uniqueImages:hashes.size,missing:0,pending:queue.jobs.filter(j=>j.status==='pending').length}));
