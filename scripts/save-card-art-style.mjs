import {readFile,writeFile} from 'node:fs/promises';

const style=JSON.parse(await readFile('design/SAVAGE-MASTER-ART-STYLE.json','utf8'));
for(const path of ['design/CHARACTER-CARD-ART-QUEUE.json','design/CHARACTER-CARD-ART-PROMPTS.json']){
 const data=JSON.parse(await readFile(path,'utf8'));
 data.styleId=style.id;
 data.styleGuide=style.guide;
 await writeFile(path,JSON.stringify(data,null,2)+'\n');
}
const path='scripts/character-art-work.mjs';
let script=await readFile(path,'utf8');
script=script.replace(/^const style='[^\n]*';$/m,"const artStyle=JSON.parse(await readFile('design/SAVAGE-MASTER-ART-STYLE.json','utf8'));\nconst style=artStyle.corePrompt;");
await writeFile(path,script);
for(const reference of style.references) await readFile(reference);
console.log(JSON.stringify({style:style.name,references:style.references.length}));
