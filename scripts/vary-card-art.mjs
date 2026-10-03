import {readFile,writeFile} from 'node:fs/promises';
const path='design/CHARACTER-CARD-ART-QUEUE.json';
const queue=JSON.parse(await readFile(path,'utf8'));
const compositions=[
 'Three-quarter side view, seated beside a lantern in a location appropriate to this subject. Quiet, thoughtful scene.',
 'Full figure walking across an appropriate landscape, looking toward the viewer. Strong diagonal movement.',
 'Waist-up close portrait, facing left, with a soft uncluttered background appropriate to this subject. No distant castle.',
 'A character performing a simple everyday activity associated with this subject, side profile, in an appropriate sheltered interior.',
 'A figure seen from the knees upward, facing right, in an appropriate environment at dusk. No tree framing the left edge.',
 'An original older adult character with distinctive weathered features, standing calmly beside equipment appropriate to this subject.',
 'A seated figure examining a relevant object, hands clearly placed, with an appropriate scenic overlook behind.',
 'An original sturdy adult character with a broad face, approaching through an appropriate misty landscape.'
];
queue.jobs.forEach((job,index)=>{
 if(job.status!=='pending'||job.artDirection)return;
 const direction=compositions[index%compositions.length];
 const gender=['class','background'].includes(job.type)?(index%3===0?' Show an original adult man.':index%3===1?' Show an original adult woman.':' Show an original androgynous adult.') : '';
 job.artDirection=direction+gender;
 job.prompt+=' Standalone artwork: invent a new face and costume rather than repeating the character in previous outputs. Composition direction, adapted to the anatomy and culture of this exact card: '+job.artDirection;
});
await writeFile(path,JSON.stringify(queue,null,2)+'\n');
