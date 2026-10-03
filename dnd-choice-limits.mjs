import {alwaysPreparedGrants} from './dnd-granted-spells.mjs';
import {chosenLanguages,dndLanguageIssues} from './dnd-languages.mjs';
import {backgrounds,classTraining,skillAbilities} from './dnd-model.mjs';
import {spellGuidance} from './dnd-spell-guidance.mjs';
import spellIndex from './dnd-rules-data/spell-index.json' with {type:'json'};
import {spellSlots} from './dnd-play.mjs';
import {classLevels,classLevel,multiclassIssues,castingAbilityFor,subclassSpellGuide,thirdCaster} from './dnd-multiclass.mjs';

const skillList=name=>classTraining[name].includes('any')?Object.keys(skillAbilities):classTraining[name].split(':')[1].split('.')[0].split(',').map(s=>s.trim());
const scholar=['Arcana','History','Investigation','Medicine','Nature','Religion'];
// Match each chosen skill to a distinct granted choice, including restricted secondary classes.
function fits(choices,slots){const assigned=Array(slots.length).fill(null);function place(name,seen){for(let i=0;i<slots.length;i++)if(!seen.has(i)&&slots[i].includes(name)){seen.add(i);if(assigned[i]===null||place(assigned[i],seen)){assigned[i]=name;return true;}}return false;}return choices.every(name=>place(name,new Set()));}
export function dndTrainingLimit(c){
 const classes=classLevels(c),all=Object.keys(skillAbilities),groups=[],expertiseSlots=[];
 const add=(names,count)=>groups.push(...Array.from({length:count},()=>names));
 let base=0,free=(c.species==='Human'?1:0)+(c.species==='Human'&&c.originFeat==='Skilled'?3:0);
 classes.forEach((r,i)=>{let count=i===0?Number(classTraining[r.className].match(/Choose (?:any )?(\d+)/)[1]):['Bard','Ranger','Rogue'].includes(r.className)?1:0;
  if(r.className==='Barbarian'&&r.level>=3)count++;base+=count;add(skillList(r.className),count);
  if(r.className==='Bard'&&r.level>=3&&/lore/i.test(r.subclass))free+=3;
  const exp=r.className==='Rogue'?(r.level>=6?4:2):r.className==='Bard'?(r.level>=9?4:r.level>=2?2:0):r.className==='Ranger'?(r.level>=9?3:r.level>=2?1:0):r.className==='Wizard'&&r.level>=2&&[...backgrounds[c.background].skills,...c.skills].some(n=>scholar.includes(n))?1:0;
  expertiseSlots.push(...Array.from({length:exp},()=>r.className==='Wizard'?scholar:all));
 });
 const keen=c.species==='Elf'?1:0;add(all,free);add(['Insight','Perception','Survival'],keen);
 return {allowed:skillList(c.className),base,free,keen,total:groups.length,expertise:expertiseSlots.length,groups,expertiseSlots};
}
export function dndSkillIssues(c){
 const l=dndTrainingLimit(c),bg=backgrounds[c.background].skills,chosen=[...new Set(c.skills.filter(n=>!bg.includes(n)))],issues=[];
 if(chosen.length>l.total)issues.push(`Your ${c.className} and ${c.species} allow ${l.total} additional skill choices. Remove ${chosen.length-l.total}.`);
 if(!fits(chosen,l.groups))issues.push('Choose skills from your class lists; only free species or feat choices can use other skills. Elf Keen Senses needs Insight, Perception, or Survival.');
 if(c.expertise.length>l.expertise)issues.push(`Your class levels allow ${l.expertise} Expertise choices.`);
 if(c.expertise.some(n=>!bg.includes(n)&&!c.skills.includes(n)))issues.push('Expertise requires an already proficient skill.');
 if(!fits(c.expertise,l.expertiseSlots))issues.push('Wizard Scholar Expertise must use Arcana, History, Investigation, Medicine, Nature, or Religion; other classes use their own Expertise allowances.');
 return issues;
}
export function dndSpellLimits(c){
 const origin=backgrounds[c.background].feat.match(/Magic Initiate \((\w+)\)/)?.[1];
 const human=c.species==='Human'?c.originFeat?.match(/Magic Initiate \((\w+)\)/)?.[1]:null;
 const innate={Drow:['Dancing Lights','Faerie Fire','Darkness'],'High Elf':['Prestidigitation','Detect Magic','Misty Step'],'Wood Elf':['Druidcraft','Longstrider','Pass without Trace'],'Forest Gnome':['Minor Illusion','Speak with Animals'],'Rock Gnome':['Mending','Prestidigitation'],Abyssal:['Poison Spray','Ray of Sickness','Hold Person'],Chthonic:['Chill Touch','False Life','Ray of Enfeeblement'],Infernal:['Fire Bolt','Hellish Rebuke','Darkness']};
 const lineage=innate[c.speciesLineage]||[],names=c.species==='Tiefling'?['Thaumaturgy',...lineage.filter((_,i)=>i===0||c.level>=(i===1?3:5))]:c.species==='Elf'?lineage.filter((_,i)=>i===0||c.level>=(i===1?3:5)):c.species==='Gnome'?lineage:[];
 const classGrants=Object.fromEntries(classLevels(c).map(r=>{const guide=spellGuidance[r.className]?.levels[r.level-1]||subclassSpellGuide(r),maxLevel=spellSlots({className:r.className,level:r.level,subclass:r.subclass}).reduce((max,n,i)=>n?i+1:max,0);return [r.source,{label:`${r.className} (level ${r.level})`,className:r.className,level:r.level,ability:thirdCaster(r)?3:castingAbilityFor(r.className),list:thirdCaster(r)?'Wizard':r.className,lists:r.className==='Bard'&&r.level>=10?['Bard','Cleric','Druid','Wizard']:undefined,cantrips:(guide?.cantrips||0)+(r.className==='Cleric'&&r.order==='Thaumaturge'||r.className==='Druid'&&r.order==='Magician'?1:0),ready:guide?.prepared||0,learned:r.className==='Wizard'?Infinity:guide?.prepared||0,bookMinimum:r.className==='Wizard'?6+2*(r.level-1):0,maxLevel}];}));
 const warlock=classLevel(c,'Warlock'),arcanum=Object.fromEntries([[11,6],[13,7],[15,8],[17,9]].filter(([level])=>warlock>=level).map(([,rank])=>['arcanum:'+rank,{label:`Warlock Mystic Arcanum (level ${rank})`,list:'Warlock',ability:5,cantrips:0,ready:1,learned:1,minLevel:rank,maxLevel:rank}]));
 return {...classGrants,...arcanum,background:{label:'Background Magic Initiate',list:origin,ability:c.grantAbilities?.background??castingAbilityFor(origin)??3,abilityChoice:true,cantrips:origin?2:0,ready:origin?1:0,learned:origin?1:0,maxLevel:1},origin:{label:'Human Origin feat',list:human,ability:c.grantAbilities?.origin??castingAbilityFor(human)??3,abilityChoice:true,cantrips:human?2:0,ready:human?1:0,learned:human?1:0,maxLevel:1},species:{label:'Species magic',ability:c.grantAbilities?.species??(c.species==='Tiefling'?5:3),abilityChoice:true,names,cantrips:names.filter(n=>spellIndex[n]?.level===0).length,ready:names.filter(n=>spellIndex[n]?.level>0).length,learned:names.filter(n=>spellIndex[n]?.level>0).length,maxLevel:2}};
}
export function spellEligible(limit,name){const row=spellIndex[name];return !!row&&(limit.names?limit.names.includes(name):(row.level>0?limit.lists||[limit.list]:[limit.list]).some(n=>row.classes.includes(n))&&row.level<=limit.maxLevel&&row.level>=(limit.minLevel||0));}
export const spellGrants=b=>b.grants||{[b.source||'class']:{prepared:b.prepared}};
export const spellsForGrant=(rows,source)=>rows.filter(b=>Object.hasOwn(spellGrants(b),source)).map(b=>({...b,prepared:spellGrants(b)[source].prepared}));
export function grantSpell(c,name,source){const book=c.spellbook||[],old=book.find(b=>b.name===name),grants={...(old?spellGrants(old):{}),[source]:{prepared:!(source==='class'||source.startsWith('class:'))&&spellIndex[name]?.level>0}};const entry={name,grants,prepared:Object.values(grants).some(g=>g.prepared)};return old?book.map(b=>b.name===name?entry:b):[...book,entry];}
export function prepareSpell(c,name,ready,source='class'){return (c.spellbook||[]).map(b=>{if(b.name!==name)return b;const grants={...spellGrants(b)};if(!grants[source])return b;grants[source]={prepared:ready};return {...b,grants,prepared:Object.values(grants).some(g=>g.prepared)};});}
export function dndSpellIssues(c){
 const limits=dndSpellLimits(c),issues=[];
 for(const source of Object.keys(limits)){
  const limit=limits[source],fixed=alwaysPreparedGrants(c).find(g=>g.className===limit.className)?.names||[],rows=spellsForGrant(c.spellbook||[],source),cantrips=rows.filter(b=>spellIndex[b.name]?.level===0),leveled=rows.filter(b=>spellIndex[b.name]?.level>0);
  if(rows.some(b=>fixed.includes(b.name)))issues.push(`${limit.label} already has these feature spells always ready. Remove their duplicate class choices to choose other spells.`);
  if(rows.some(b=>limit.names?!limit.names.includes(b.name):!spellEligible(limit,b.name)))issues.push(`Choose ${limit.label} spells from your granted list and available levels.`);
  if(cantrips.length>limit.cantrips)issues.push(`Your ${limit.label} grant allows ${limit.cantrips} cantrips.`);
  if(leveled.filter(b=>b.prepared).length>limit.ready)issues.push(`Your ${limit.label} grant allows ${limit.ready} prepared spells.`);
  if(leveled.length>limit.learned)issues.push(`Your ${limit.label} grant allows ${limit.learned} learned spells.`);
 }
 if((c.spellbook||[]).some(b=>Object.keys(spellGrants(b)).some(s=>!limits[s])))issues.push('Choose a supported source for each spell grant.');
 return issues;
}
export function reducesSpellChoices(before,after){const old=new Map(before.map(b=>[b.name,spellGrants(b)]));let reduced=after.length<before.length;for(const b of after){const grants=old.get(b.name);if(!grants)return false;for(const [source,g] of Object.entries(spellGrants(b))){if(!grants[source]||g.prepared&&!grants[source].prepared)return false;if(grants[source].prepared&&!g.prepared)reduced=true;}if(Object.keys(spellGrants(b)).length<Object.keys(grants).length)reduced=true;}return reduced;}
export function dndChoiceError(c,patch){
 const next={...c,...patch};
 if(patch.multiclass||'level' in patch){const issue=multiclassIssues(next,{abilities:false})[0];if(issue)return issue;}
 if('level' in patch&&(!Number.isInteger(next.level)||next.level<1||next.level>20))return 'Choose a whole character level from 1 to 20.';
 if(patch.skills||patch.expertise)return dndSkillIssues(next)[0];
 if(patch.spellbook)return dndSpellIssues(next)[0];
 if('languages' in patch||'languageChoices' in patch){const before=chosenLanguages(c),after=chosenLanguages('languageChoices' in patch?next:{...next,languageChoices:undefined});if(after.length<before.length&&after.every(n=>before.includes(n)))return;return dndLanguageIssues({...next,languageChoices:after})[0];}
 if(patch.boosts&&(next.boosts.reduce((a,b)=>a+b,0)>3||next.boosts.some((n,i)=>n&&!backgrounds[next.background].abilities.includes(i))))return 'Your background allows three bonus points on its listed abilities: +2/+1 or +1/+1/+1.';
 if(patch.scores&&next.method==='points'){const cost=scores=>scores.reduce((sum,n)=>sum+({8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9}[n]??100),0);if(cost(next.scores)>27&&cost(next.scores)>=cost(c.scores))return 'Point buy allows 27 points. Lower another score before increasing this one.';}
}

export const hasDndMagic=c=>Object.values(dndSpellLimits(c)).some(l=>l.cantrips||l.ready)||(c.spellbook||[]).length>0;
