import {classLevel} from './dnd-multiclass.mjs';

// Revised 2024 language tables. Species inclusion is this workshop's table rule:
// the species language fills one of the two starting choices, alongside Common.
export const dndLanguages=[
 ['Common','standard','A shared language used throughout the worlds of D&D.'],
 ['Common Sign Language','standard','A shared signed language originating in Sigil.'],
 ['Draconic','standard','A language originating with dragons.'],
 ['Dwarvish','standard','A language originating with dwarves.'],
 ['Elvish','standard','A language originating with elves.'],
 ['Giant','standard','A language originating with giants.'],
 ['Gnomish','standard','A language originating with gnomes.'],
 ['Goblin','standard','A language originating with goblinoids.'],
 ['Halfling','standard','A language originating with halflings.'],
 ['Orc','standard','A language originating with orcs.'],
 ['Abyssal','rare','A language of demons from the Abyss.'],
 ['Celestial','rare','A language of celestial beings.'],
 ['Deep Speech','rare','A language associated with aberrations.'],
 ['Druidic','rare','The secret language of druid circles.'],
 ['Infernal','rare','A language of devils from the Nine Hells.'],
 ['Primordial','rare','An elemental language. Includes Aquan, Auran, Ignan, and Terran; speakers of these dialects can understand one another.'],
 ['Sylvan','rare','A language originating in the Feywild.'],
 ["Thieves’ Cant",'rare','A secret language used by criminal guilds.'],
 ['Undercommon','rare','A language originating in the Underdark.']
].map(([name,kind,description])=>({name,kind,description}));
export const speciesLanguages={Dragonborn:'Draconic',Dwarf:'Dwarvish',Elf:'Elvish',Gnome:'Gnomish',Goliath:'Giant',Halfling:'Halfling',Human:'Common',Orc:'Orc',Tiefling:'Infernal'};
const key=s=>s.trim().toLowerCase().replace(/[’‘]/g,"'");
const canonical=new Map(dndLanguages.map(r=>[key(r.name),r.name]));
for(const [alias,name] of Object.entries({elf:'Elvish',elven:'Elvish',dwarf:'Dwarvish',dwarven:'Dwarvish',gnome:'Gnomish',"thieves cant":'Thieves’ Cant',aquan:'Primordial',auran:'Primordial',ignan:'Primordial',terran:'Primordial'}))canonical.set(alias,name);
export const canonicalLanguage=s=>canonical.get(key(s))||s.trim();
const unique=names=>[...new Set(names.map(canonicalLanguage).filter(Boolean))];
export function dndLanguageRules(c){
 const species=speciesLanguages[c.species]||'Common',included=[{name:'Common',reason:'Every character'}];
 if(species!=='Common')included.push({name:species,reason:`${c.species} species`});
 if(classLevel(c,'Druid')>=1)included.push({name:'Druidic',reason:'Druid level 1'});
 if(classLevel(c,'Rogue')>=1)included.push({name:'Thieves’ Cant',reason:'Rogue level 1'});
 const bonuses=[];
 if(classLevel(c,'Rogue')>=1)bonuses.push({label:'Rogue',count:1});
 if(classLevel(c,'Ranger')>=2)bonuses.push({label:'Ranger level 2',count:2});
 const starting=species==='Common'?2:1,bonus=bonuses.reduce((sum,r)=>sum+r.count,0);
 return {species,included,starting,bonus,bonuses,total:starting+bonus};
}
export function chosenLanguages(c){
 const automatic=new Set(dndLanguageRules(c).included.map(r=>r.name));
 return unique(c.languageChoices??(c.languages||'').split(/[,;\n]/)).filter(n=>!automatic.has(n));
}
export const knownLanguages=c=>unique([...dndLanguageRules(c).included.map(r=>r.name),...chosenLanguages(c)]);
export function syncDndLanguages(c,patch={}){
 // Retain explicit choices when origins/classes change; replace automatic grants.
 const choices='languageChoices' in patch?patch.languageChoices:'languages' in patch?patch.languages.split(/[,;\n]/):c.languageChoices??chosenLanguages(c);
 const next={...c,...patch,languageChoices:unique(choices)};
 return {...next,languages:knownLanguages(next).join(', ')};
}
export function dndLanguageIssues(c,{complete=false}={}){
 const rules=dndLanguageRules(c),choices=chosenLanguages(c),issues=[];
 const unknown=choices.filter(n=>!canonical.has(key(n)));
 if(unknown.length)issues.push(`Replace unsupported starting languages: ${unknown.join(', ')}. Put GM-approved custom languages in feature notes.`);
 if(choices.length>rules.total)issues.push(`Your build allows ${rules.total} language choice${rules.total===1?'':'s'}, in addition to included languages. Remove ${choices.length-rules.total}.`);
 const rare=choices.filter(n=>dndLanguages.find(r=>r.name===n)?.kind==='rare');
 if(rare.length>rules.bonus)issues.push(`Rare language choices require a class grant. Your build allows ${rules.bonus} rare language choice${rules.bonus===1?'':'s'}.`);
 if(complete){
  const standard=choices.filter(n=>dndLanguages.find(r=>r.name===n)?.kind==='standard').length;
  if(standard<rules.starting)issues.push(`Choose ${rules.starting-standard} more different starting language${rules.starting-standard===1?'':'s'} from the standard choices.`);
  if(choices.length<rules.total&&standard>=rules.starting)issues.push(`Choose ${rules.total-choices.length} more language${rules.total-choices.length===1?'':'s'} granted by your class.`);
 }
 return issues;
}
