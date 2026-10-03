import {readFile,writeFile} from 'node:fs/promises';
const path='design/CHARACTER-CARD-ART-QUEUE.json';
const queue=JSON.parse(await readFile(path,'utf8'));
for(const job of queue.jobs.filter(j=>j.type==='background')){
 job.status='decorative';
 job.presentation='Title with subtle CSS artwork; no individual illustration required.';
}
queue.policy='Unique original illustrations for game, setting, species, class and heritage cards. Background choices use lightweight decorative title cards, as requested on 2026-10-03; existing source art is retained.';
await writeFile(path,JSON.stringify(queue,null,2)+'\n');
console.log(JSON.stringify({remaining:queue.jobs.filter(j=>j.status==='pending').length,decorativeBackgrounds:queue.jobs.filter(j=>j.status==='decorative').length}));
