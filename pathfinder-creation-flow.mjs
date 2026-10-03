import {issues as pfIssues, stats, skillIncreaseLevels, validateProgress} from './pathfinder-model.mjs';
import pfClasses from './pathfinder-data/classes.json' with {type:'json'};
import pfBackgrounds from './pathfinder-data/backgrounds.json' with {type:'json'};
import heritages from './pathfinder-data/heritages.json' with {type:'json'};
import progression from './pathfinder-data/spell-progression.json' with {type:'json'};

import {makeChapters} from './creation-flow.mjs';
import {pfChoiceError,pfFeatError,pfDailyCantrips,pfRemainingFeatSlots} from './pathfinder-choice-limits.mjs';
export function pfTrainingRequirements(c){
 const cl=pfClasses.find(r=>r.name===c.className),bg=pfBackgrounds.find(r=>r.name===c.background);
 const duplicateGrants=cl.data.trainedSkills.value.filter(name=>bg?.data.trainedSkills.value.includes(name)).length;
 const skillChoices=cl.data.rules.filter(rule=>rule.key==='ChoiceSet'&&Array.isArray(rule.choices)&&rule.choices.every(choice=>choice.label?.startsWith('PF2E.Skill.')));
 const required=Math.max(0,cl.data.trainedSkills.additional+stats(c).mods.int+duplicateGrants+skillChoices.length+(c.heritage==='Skilled Human'?1:0)+(c.feats.some(f=>f.name==='Skill Training')?1:0));
 return {required,skillChoices,granted:new Set([...cl.data.trainedSkills.value,...(bg?.data.trainedSkills.value||[])])};
}
export function pfStepIssues(c){
 const out=Array.from({length:6},()=>[]);
 for(const message of pfIssues(c))out[/name|background\.$/.test(message)?0:/boost|attribute/.test(message)?1:4].push(message);
 if(!c.heritage)out[0].push('Choose a heritage for your ancestry.');
 else if(heritages.find(r=>r.name===c.heritage)?.data.ancestry?.name&&heritages.find(r=>r.name===c.heritage).data.ancestry.name!==c.ancestry)out[0].push('Choose a heritage that matches your ancestry.');
 const cl=pfClasses.find(r=>r.name===c.className),bg=pfBackgrounds.find(r=>r.name===c.background);
 const {required,skillChoices,granted}=pfTrainingRequirements(c);
 const chosen=Object.entries(c.ranks).filter(([name,rank])=>rank&&!granted.has(name.toLowerCase())).length;
 const trainingError=pfChoiceError(c,{ranks:c.ranks}),featError=pfFeatError(c);if(trainingError)out[2].push(trainingError);if(featError)out[2].push(featError);
 if(!featError)for(const slot of pfRemainingFeatSlots(c))out[2].push(`Choose your level ${slot.level} ${slot.category} feat.`);
 if(chosen<required)out[2].push(`Choose ${required-chosen} more additional trained skill(s). Review any class or heritage skill grants as well.`);
 for(const rule of skillChoices)if(!rule.choices.some(choice=>granted.has(choice.value)||Object.entries(c.ranks).some(([name,rank])=>rank&&name.toLowerCase()===choice.value)))out[2].push(`Choose the class-granted skill: ${rule.choices.map(choice=>choice.value).join(' or ')}.`);
 if(!c.feats.some(f=>f.data.category==='ancestry'&&f.data.traits.value.includes(c.ancestry.toLowerCase())))out[2].push('Choose a level-one ancestry feat for your ancestry (or an ancestry granted by a feature).');
 if(cl.data.classFeatLevels.value.includes(1)&&!c.feats.some(f=>f.data.category==='class'&&f.data.traits.value.includes(c.className.toLowerCase())))out[2].push('Choose a level-one class feat for your class.');
 for(const level of skillIncreaseLevels(c))if(!c.skillAdvances?.some(a=>a.level===level))out[2].push(`Choose your level ${level} skill increase.`);
 try{validateProgress(c);}catch(e){out[2].push(e.message);}
 const guide=progression[c.className]?.[c.level];
 if(guide){
  for(const patch of [{spellbook:c.spellbook},...(c.castingState?[{castingState:c.castingState}]:[])]){const error=pfChoiceError(c,patch);if(error)out[3].push(error);}
  const cantrips=pfDailyCantrips(c).length;
  if(cantrips<guide.cantrips)out[3].push(`Add ${guide.cantrips-cantrips} more daily cantrip(s).`);
  guide.slots.forEach((max,i)=>{if(max&&(c.castingState?.slots?.[i+1]?.max||0)<max)out[3].push(`Set at least ${max} base rank ${i+1} spell slots using your class table.`);});
  const ranked=c.spellbook.filter(r=>!r.data.traits.value.some(t=>['cantrip','focus'].includes(t)));
  if(guide.slots.some(Boolean)&&!ranked.length)out[3].push('Add ranked spells to your book or repertoire.');
  if(c.castingState?.mode==='prepared')for(const [rank,slot] of Object.entries(c.castingState.slots||{}))if(c.castingState.preparations.filter(p=>p.rank===Number(rank)).length<slot.max)out[3].push(`Prepare spells for your remaining rank ${rank} slots.`);
 }
 return out;
}
export const pfChapters=c=>makeChapters('pathfinder2e',pfStepIssues(c));
