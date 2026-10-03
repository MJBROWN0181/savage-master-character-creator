import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import vm from 'node:vm';
import sharp from 'sharp';
import {speciesNames,classData,backgrounds} from '../dnd-model.mjs';

const queuePath='design/CHARACTER-CARD-ART-QUEUE.json';
const promptPath='design/CHARACTER-CARD-ART-PROMPTS.json';
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const labels={savage:'Savage Worlds',dnd5e:'Dungeons & Dragons revised fifth edition',pathfinder2e:'Pathfinder Second Edition remastered'};
const artStyle=JSON.parse(await readFile('design/SAVAGE-MASTER-ART-STYLE.json','utf8'));
const style=artStyle.corePrompt;

if(process.argv[2]==='init'){
 const manifest=JSON.parse(await readFile('character-art.json','utf8'));
 const prior=JSON.parse(await readFile(promptPath,'utf8'));
 const jobs=[];
 const add=(system,type,id,name,description,ancestry='')=>{
  const kept=system==='dnd5e'&&['species:Human','species:Dwarf','class:Fighter','class:Wizard'].includes(type+':'+id);
  const asset=`${system}-${type}-${slug(name)}-${slug(id)}`;
  const subject=type==='settings'?'A distinctive world scene that introduces this setting. Show its world, atmosphere and adventuring equipment; not just a generic character.':type==='background'?'An adult adventurer shown in a meaningful moment from this former occupation or life experience, with recognizable appropriate tools or setting. Do not imply a fixed adventuring class.':type==='class'?'An original adult adventurer whose clothing, equipment and pose clearly communicate this specific class. Use a different character, face, pose and environment from other class cards.':type==='heritage'?`An original character with the physical and environmental details of this specific heritage. Parent ancestry: ${ancestry||'versatile heritage; use an original humanoid as a representative example'}. Make this heritage visibly distinct from the base ancestry and other heritages.`:'An original adult character accurately depicting this species or ancestry, with distinctive physical features and a meaningful homeland backdrop. Do not let clothing obscure its defining anatomy. Do not assign a compulsory class.';
  const prompt=`Use case: stylized-concept. Asset: unique ${name} ${type} character-creation card for ${labels[system]} in Savage Master. ${subject} Content supplied by this game catalogue: ${description.replace(/\s+/g,' ').slice(0,1200)}. ${style}`;
  jobs.push({system,type,id,name,ancestry,asset,prompt,status:type==='background'?'decorative':kept?'installed':'pending',...(kept?{web:manifest[system][type][id]}:{})});
 };
 const sandbox=vm.createContext({window:{},document:{addEventListener(){}},console});
 for(const file of ['data.js','settings.js'])vm.runInContext(await readFile(file,'utf8'),sandbox);
 const sw=JSON.parse(vm.runInContext('JSON.stringify({races:SWADE.RACES,settings:SETTINGS})',sandbox));
 add('savage','settings','core','Core SWADE Homebrew','A flexible tabletop adventure world for original campaigns: an explorer at a crossroads where a ruined fantasy tower, rugged frontier and distant futuristic skyline suggest different possible settings. Show one balanced landscape, no collage.');
 for(const [id,row]of Object.entries(sw.settings))add('savage','settings',id,id==='pathfinder'?'Pathfinder for Savage Worlds':row.name,row.description);
 for(const row of sw.races)add('savage','species',row.id,row.name,row.description);
 for(const setting of Object.values(sw.settings))for(const row of setting.RACES)add('savage','species',row.id,row.name,`${setting.name} setting. ${row.description}`);
 const speciesText=await readFile('dnd-species.jsx','utf8');
 for(const name of speciesNames){const description=speciesText.match(new RegExp(name+':\\{page:[^]*?(?=\\n [A-Z]|\\n};)'))?.[0]||name;add('dnd5e','species',name,name,description);}
 const classText=await readFile('dnd-reference.jsx','utf8');
 for(const name of Object.keys(classData)){const description=classText.match(new RegExp(name+":\\['([^']+)"))?.[1]||name;add('dnd5e','class',name,name,description);}
 for(const [name,row]of Object.entries(backgrounds))add('dnd5e','background',name,name,`A ${name.toLowerCase()} before becoming an adventurer, trained in ${row.skills.join(' and ')}; familiar tool: ${row.tool}.`);
 for(const [file,type]of [['ancestries','species'],['classes','class'],['heritages','heritage'],['backgrounds','background']]){
  const rows=JSON.parse(await readFile(`pathfinder-data/${file}.json`,'utf8'));
  for(const row of rows){if(type==='background'&&Object.keys(row.data.boosts).length!==2)continue;add('pathfinder2e',type,row.id,row.name,row.description,row.data.ancestry?.name||'');}
 }
 await writeFile(queuePath,JSON.stringify({policy:'One unique original illustration for every card. No reuse between games, types, species, classes, backgrounds or heritages.',generator:'Built-in image_gen',jobs},null,2)+'\n');
 console.log(JSON.stringify({total:jobs.length,pending:jobs.filter(j=>j.status==='pending').length,bySystem:Object.fromEntries(Object.keys(labels).map(s=>[s,jobs.filter(j=>j.system===s).length]))}));
}else if(process.argv[2]==='refine'){
 const queue=JSON.parse(await readFile(queuePath,'utf8'));
 for(const job of queue.jobs.filter(j=>j.status==='pending')){
  job.prompt+=' All humanoid subjects are adults and fully clothed in practical opaque travel clothing or armor covering the torso and hips. Nonsexual, family-friendly adventure illustration; no nudity or revealing costumes.';
  if(job.id==='rf_dBee')job.prompt+=' For this representative dimensional being, show one adult violet-skinned alien with four eyes and two arms, wearing a high-collared forest teal explorer coat, trousers, gloves and boots, with a closed brown travel satchel. A dimensional portal and ruined technological settlement are softly visible behind the traveler. Calm exploration, no combat.';
 }
 await writeFile(queuePath,JSON.stringify(queue,null,2)+'\n');console.log('Updated pending illustration clothing and the dimensional traveler composition.');
}else if(process.argv[2]==='next'){
 const queue=JSON.parse(await readFile(queuePath,'utf8'));
 const manifest=JSON.parse(await readFile('character-art.json','utf8'));
 const mapped=[...Object.values(manifest.games),...queue.jobs.map(j=>manifest[j.system][j.type]?.[j.id]).filter(Boolean)];
 const reused=job=>{const web=manifest[job.system][job.type]?.[job.id];return web&&mapped.filter(path=>path===web).length>1?1:0;};
 console.log(JSON.stringify(queue.jobs.filter(j=>j.status==='pending').sort((a,b)=>reused(b)-reused(a)).slice(0,Number(process.argv[3]||3))));
}else if(process.argv[2]==='install'){
 const receipts=JSON.parse(await readFile(process.argv[3],'utf8'));
 const queue=JSON.parse(await readFile(queuePath,'utf8'));
 const manifest=JSON.parse(await readFile('character-art.json','utf8'));
 const prompts=JSON.parse(await readFile(promptPath,'utf8'));
 await mkdir('design/art-source/cards',{recursive:true});await mkdir('images/art/cards',{recursive:true});
 for(const receipt of receipts){
  const job=queue.jobs.find(j=>j.asset===receipt.asset);if(!job||job.status!=='pending')throw new Error('Unknown or already installed job '+receipt.asset);
  const version=job.version||1;
  const original=`design/art-source/cards/${job.asset}-v${version}.png`,web=`/images/art/cards/${job.asset}-v${version}.webp`;
  await copyFile(receipt.source,original);
  await sharp(receipt.source).resize({width:640,withoutEnlargement:true}).webp({quality:84,effort:6}).toFile('.'+web);
  manifest[job.system][job.type][job.id]=web;job.status='installed';job.web=web;
  prompts.assets.push({name:job.asset,source:original.replace('design/',''),web,prompt:job.prompt,system:job.system,type:job.type,id:job.id});
 }
 await writeFile('character-art.json',JSON.stringify(manifest,null,2)+'\n');
 await writeFile(promptPath,JSON.stringify(prompts,null,2)+'\n');
 await writeFile(queuePath,JSON.stringify(queue,null,2)+'\n');
 console.log(JSON.stringify({installed:receipts.length,remaining:queue.jobs.filter(j=>j.status==='pending').length}));
}else if(process.argv[2]==='audit'){
 const queue=JSON.parse(await readFile(queuePath,'utf8'));
 const manifest=JSON.parse(await readFile('character-art.json','utf8'));
 const mapped=[...Object.values(manifest.games),...queue.jobs.map(j=>manifest[j.system][j.type]?.[j.id]).filter(Boolean)];
 console.log(JSON.stringify({total:queue.jobs.length,installed:queue.jobs.filter(j=>j.status==='installed').length,remaining:queue.jobs.filter(j=>j.status==='pending').length,duplicates:mapped.filter((v,i)=>mapped.indexOf(v)!==i)}));
}else throw new Error('Use init, next [count], install receipt-file, or audit.');
