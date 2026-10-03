import {classLevels,multiclassIssues} from './dnd-multiclass.mjs';
import {dndLanguageIssues} from './dnd-languages.mjs';
import {dndTrainingLimit,dndSkillIssues,dndSpellIssues,dndSpellLimits,spellsForGrant} from './dnd-choice-limits.mjs';
import {creationIssues, backgrounds} from './dnd-model.mjs';
import spellIndex from './dnd-rules-data/spell-index.json' with {type:'json'};
import {makeChapters} from './creation-flow.mjs';
export function dndStepIssues(c){
 const out=Array.from({length:6},()=>[]);
 out[1].push(...multiclassIssues(c));
 for(const message of creationIssues(c))out[/name/.test(message)?0:/array|Point buy|background abilities/.test(message)?1:4].push(message);
 const count=dndTrainingLimit(c).total;
 out[2].push(...dndSkillIssues(c));out[3].push(...dndSpellIssues(c));
 const chosen=c.skills.filter(n=>!backgrounds[c.background].skills.includes(n)).length;
 if(chosen<count)out[2].push(`Choose ${count-chosen} more skill proficienc${count-chosen===1?'y':'ies'} (${count} class/species choices in total).`);
 const expertise=dndTrainingLimit(c).expertise;if(c.expertise.length<expertise)out[2].push(`Choose ${expertise-c.expertise.length} more Expertise choice(s) granted by your class and level.`);
 out[2].push(...dndLanguageIssues(c,{complete:true}));
 if(c.species==='Human'&&!c.originFeat&&!c.features.trim())out[2].push('Record your Human bonus Origin feat and any other feature choices in Features, feats, species traits & chosen options.');
 for(const r of classLevels(c)){if(r.className==='Druid'&&r.level>=3&&/^(land|circle of the land)$/i.test(r.subclass?.trim())&&!r.land)out[2].push('Choose your Circle of the Land terrain.');if(r.level>=3&&!r.subclass?.trim())out[2].push(`Record your ${r.className} subclass and its choices.`);if(['Cleric','Druid'].includes(r.className)&&!r.order)out[2].push(`Choose your ${r.className} class order to determine its granted cantrips and training.`);}
 if(['Elf','Gnome','Tiefling'].includes(c.species)&&!c.speciesLineage)out[2].push('Choose your species lineage to determine its granted spells.');
 for(const [source,limit] of Object.entries(dndSpellLimits(c))){
  if(!limit.cantrips&&!limit.ready)continue;
  const rows=spellsForGrant(c.spellbook||[],source),cantrips=rows.filter(b=>spellIndex[b.name]?.level===0).length,ready=rows.filter(b=>b.prepared&&spellIndex[b.name]?.level>0).length;
  if(cantrips<limit.cantrips)out[3].push(`Choose ${limit.cantrips-cantrips} more ${limit.label} cantrip(s).`);
  if(ready<limit.ready)out[3].push(`Mark ${limit.ready-ready} more ${limit.label} spell(s) ready to cast.`);
  if(limit.bookMinimum&&rows.filter(b=>spellIndex[b.name]?.level>0).length<limit.bookMinimum)out[3].push(`Record at least ${limit.bookMinimum} leveled Wizard spells in your book.`);
 }
 return out;
}
export const dndChapters=c=>makeChapters('dnd5e',dndStepIssues(c));
