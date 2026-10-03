import classes from './pathfinder-data/classes.json' with {type:'json'};
import progression from './pathfinder-data/spell-progression.json' with {type:'json'};
import backgrounds from './pathfinder-data/backgrounds.json' with {type:'json'};
import {validateProgress} from './pathfinder-model.mjs';
import {pfTrainingRequirements} from './pathfinder-creation-flow.mjs';

export function pfFeatSlots(c){
 const cl=classes.find(r=>r.name===c.className).data,slots=[];
 for(const category of ['ancestry','class','skill','general'])for(const level of cl[category+'FeatLevels'].value.filter(n=>n<=c.level))slots.push({category,level});
 if(c.heritage==='Versatile Human')slots.push({category:'general',level:1});
 for(const feat of c.feats){if(feat.name==='Natural Ambition')slots.push({category:'class',level:1});if(feat.name==='General Training')slots.push({category:'general',level:1});if(feat.name==='Ancestral Paragon')slots.push({category:'ancestry',level:1});}
 return slots;
}
function allocateFeats(c){
 if(new Set(c.feats.map(f=>f.id)).size!==c.feats.length)return 'This feat is already selected.';
 const fits=(f,s)=>f.data.level.value<=s.level&&(f.data.category===s.category||s.category==='general'&&f.data.category==='skill');
 const slots=pfFeatSlots(c),ordered=[...c.feats].sort((a,b)=>b.data.level.value-a.data.level.value);
 // Give skill feats their own slots before consuming flexible general slots.
 for(const f of ordered){if(f.data.level.value>c.level)return 'This feat is above your character level.';if(['ancestry','class'].includes(f.data.category)&&!f.data.traits.value.includes((f.data.category==='ancestry'?c.ancestry:c.className).toLowerCase()))return `Choose feats for your ${f.data.category==='ancestry'?c.ancestry:c.className}, or remove this choice.`;const i=slots.findIndex(s=>fits(f,s)&&s.category===f.data.category),j=i>=0?i:slots.findIndex(s=>fits(f,s));if(j<0)return `Your level ${c.level} ${c.className} has no remaining ${f.data.category} feat slots for this choice. Remove a feat to change it.`;slots.splice(j,1);}
 return slots;
}
export function pfFeatError(c){const result=allocateFeats(c);return typeof result==='string'?result:undefined;}
export function pfRemainingFeatSlots(c){const result=allocateFeats(c);return Array.isArray(result)?result:[];}
export function pfChoiceError(c,patch){
 const n={...c,...patch};
 if('level' in patch&&(!Number.isInteger(n.level)||n.level<1||n.level>20))return 'Choose a whole character level from 1 to 20.';
 if(patch.ranks){const {required,granted}=pfTrainingRequirements(n),count=Object.entries(n.ranks).filter(([k,v])=>v&&!granted.has(k.toLowerCase())).length;if(count>required)return `Your class, Intelligence, background, and heritage allow ${required} additional trained skills. Remove a skill before choosing another.`;try{validateProgress(n);}catch(e){return e.message;}}
 if(patch.feats)return pfFeatError(n);
 if(patch.boosts){for(const [key,count] of Object.entries({ancestry:2,background:2,class:1,free:4}))if(n.boosts[key].length>count||new Set(n.boosts[key]).size!==n.boosts[key].length)return `${key} allows ${count} different attribute boosts.`;const cl=classes.find(r=>r.name===n.className);if(n.boosts.class.length&&!cl.data.keyAbility.value.includes(n.boosts.class[0]))return 'Choose one of your class key attributes.';const bg=backgrounds.find(r=>r.name===n.background);if(bg&&n.boosts.background.length===2&&!n.boosts.background.some(a=>bg.data.boosts['0'].value.includes(a)))return 'One background boost must use an attribute listed by your background.';}
 if(patch.advancement||patch.skillAdvances||patch.castingState){try{validateProgress(n);}catch(e){return e.message;}}
 const guide=progression[n.className]?.[n.level];
 if(guide&&(patch.castingState||patch.spellbook)){
  const mode=['Bard','Sorcerer','Oracle'].includes(n.className)?'spontaneous':'prepared',tradition={Bard:'occult',Cleric:'divine',Druid:'primal',Wizard:'arcane',Oracle:'divine'}[n.className];
  if(n.castingState?.mode!==mode)return `${n.className} uses ${mode} spellcasting. Choose spells within that class's allowance.`;
  if(tradition&&n.castingState?.tradition!==tradition)return `${n.className} uses the ${tradition} spell tradition.`;
  if(patch.spellbook&&n.spellbook.some(r=>!r.data.traits.value.includes('focus')&&!r.data.traits.traditions.includes(n.castingState?.tradition)))return 'Choose spells from your granted tradition. Record additional restricted grants with their source.';
 }
 if(guide&&patch.castingState){for(const [rank,slot] of Object.entries(n.castingState.slots))if(slot.max>(guide.slots[rank-1]||0))return `Your level ${n.level} ${n.className} grants ${guide.slots[rank-1]||0} base rank ${rank} spell slots.`;}
 if(guide&&(patch.spellbook||patch.castingState)){const daily=pfDailyCantrips(n);if(daily.length>guide.cantrips)return `Your class allows ${guide.cantrips} daily cantrips.`;if(n.castingState?.mode==='spontaneous')for(let rank=1;rank<=10;rank++){const count=n.spellbook.filter(r=>(n.castingState.repertoireRanks?.[r.id]||r.data.level.value)===rank&&!r.data.traits.value.some(t=>['cantrip','focus'].includes(t))).length;if(count>(guide.slots[rank-1]||0))return `Your repertoire allows ${guide.slots[rank-1]||0} base rank ${rank} spells.`;}}
}
export function pfDailyCantrips(c){return c.castingState?.cantrips??c.spellbook.filter(r=>r.data.traits.value.includes('cantrip')).map(r=>r.id);}
