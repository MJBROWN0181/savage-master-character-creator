import {readFile,writeFile} from 'node:fs/promises';
const path='design/CHARACTER-CARD-ART-QUEUE.json';
const queue=JSON.parse(await readFile(path,'utf8'));
const job=queue.jobs.find(j=>j.name==='Dog Kholo');
if(!job.dogBuildRefined){
 job.previousWeb=job.web;
 job.version=2;
 job.status='pending';
 job.dogBuildRefined=true;
 const style=JSON.parse(await readFile('design/SAVAGE-MASTER-ART-STYLE.json','utf8'));
 job.prompt=`Unique Dog Kholo heritage card for Pathfinder Second Edition. Show a nimble, lean dog-like hyena humanoid with a long narrow muzzle, lightly spotted tawny fur and slender limbs. This is the lightly built prehistoric dog-like heritage, visibly unlike the stocky broad-headed base Kholo. Exactly two arms and two legs. The adult traveler is running on all fours along an open dry grassland trail, hands empty, head turned slightly toward the viewer, wearing an opaque teal travel tunic and brown trousers with small snug pouches. No bulky armor, no broad muscular torso, no castle, no forest. Full-body diagonal action with all four limbs readable. ${style.corePrompt}`;
 await writeFile(path,JSON.stringify(queue,null,2)+'\n');
}
console.log('Dog Kholo heritage build refined.');
