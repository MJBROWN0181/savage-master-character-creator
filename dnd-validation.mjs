import {multiclassIssues,classLevels} from './dnd-multiclass.mjs';
import {dndLanguageIssues,knownLanguages} from './dnd-languages.mjs';
import {classData,backgrounds,speciesNames,skillAbilities,creationIssues} from './dnd-model.mjs';
import {weapons,armors} from './dnd-play.mjs';
import {dndSkillIssues,dndSpellIssues} from './dnd-choice-limits.mjs';
export function validateDndCharacter(c,{draft=false}={}){
 const fail=()=>{throw new Error('Invalid 5e character.');};
 if(!c||typeof c!=='object'||Array.isArray(c)||JSON.stringify(c).length>190000)fail();
 const text=(k,max)=>typeof c[k]==='string'&&c[k].length<=max;
 if(c.setting!=='dnd5e'||c.rules!=='srd-5.2.1'||!Object.hasOwn(classData,c.className)||!Object.hasOwn(backgrounds,c.background)||!speciesNames.includes(c.species)||!['standard','points','physical'].includes(c.method))fail();
 for(const [k,max] of [['name',120],['concept',10000],['notes',30000],['equipment',10000],['spells',10000],['features',10000],['languages',2000],['alignment',200],['subclass',200]])if(!text(k,max))fail();
 // Keep old free-text drafts available for explicit repair after migration.
 if(c.languageChoices!==undefined&&(!Array.isArray(c.languageChoices)||c.languageChoices.length>500||c.languageChoices.some(n=>typeof n!=='string'||!n.trim()||n.length>1000)||c.languageChoices.join(', ').length>1800||new Set(c.languageChoices).size!==c.languageChoices.length))fail();
 if(!Number.isInteger(c.level)||c.level<1||c.level>20)fail();
 if(c.multiclass!==undefined){if(!Array.isArray(c.multiclass)||c.multiclass.length>11||c.multiclass.some(r=>!r||!Object.hasOwn(classData,r.className)||!Number.isInteger(r.level)||r.level<1||r.level>19||typeof r.subclass!=='string'||r.subclass.length>200||typeof r.order!=='string'||!['',...({Cleric:['Protector','Thaumaturge'],Druid:['Warden','Magician']}[r.className]||[])].includes(r.order))||multiclassIssues(c,{abilities:false}).length)fail();}
 for(const r of [c,...(c.multiclass||[])])if(r.land!==undefined&&!['','Arid','Polar','Temperate','Tropical'].includes(r.land))fail();
 if(c.grantAbilities!==undefined&&(!c.grantAbilities||typeof c.grantAbilities!=='object'||Array.isArray(c.grantAbilities)||Object.entries(c.grantAbilities).some(([k,v])=>!['background','origin','species'].includes(k)||![3,4,5].includes(v))))fail();
 if(c.pactSlotsUsed!==undefined&&(!Number.isInteger(c.pactSlotsUsed)||c.pactSlotsUsed<0||c.pactSlotsUsed>4))fail();

 for(const key of ['originFeat','order','speciesLineage'])if(c[key]!==undefined&&(typeof c[key]!=='string'||c[key].length>100))fail();
 if(c.originFeat&&!['Alert','Healer','Lucky','Musician','Savage Attacker','Skilled','Tavern Brawler','Tough','Magic Initiate (Cleric)','Magic Initiate (Druid)','Magic Initiate (Wizard)'].includes(c.originFeat))fail();
 if(c.order&&!({Cleric:['Protector','Thaumaturge'],Druid:['Warden','Magician']}[c.className]||[]).includes(c.order))fail();
 if(c.speciesLineage&&!({Elf:['Drow','High Elf','Wood Elf'],Gnome:['Forest Gnome','Rock Gnome'],Tiefling:['Abyssal','Chthonic','Infernal']}[c.species]||[]).includes(c.speciesLineage))fail();
 if(!Array.isArray(c.scores)||c.scores.length!==6||c.scores.some(n=>!Number.isInteger(n)||n<3||n>18))fail();
 if(!Array.isArray(c.boosts)||c.boosts.length!==6||c.boosts.some(n=>!Number.isInteger(n)||n<0||n>2))fail();
 for(const key of ['skills','expertise'])if(!Array.isArray(c[key])||c[key].length>18||new Set(c[key]).size!==c[key].length||c[key].some(n=>!Object.hasOwn(skillAbilities,n)))fail();
 const trained=new Set([...backgrounds[c.background].skills,...c.skills]);if(c.expertise.some(n=>!trained.has(n)))fail();
 for(const [k,min,max,nullable] of [['ac',1,50,true],['hp',1,10000,true],['currentHp',0,10000,true],['tempHp',0,10000,false],['speed',0,300,false]])if(!(nullable&&c[k]===null)&&(!Number.isInteger(c[k])||c[k]<min||c[k]>max))fail();
 const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
 if(c.armor!==undefined&&c.armor!==''&&!armors.some(a=>a.name===c.armor))fail();
 if(c.shield!==undefined&&typeof c.shield!=='boolean')fail();
 if(c.defense!==undefined&&!['normal','monk','barbarian'].includes(c.defense))fail();
 if(c.acBonus!==undefined&&!integer(c.acBonus,-20,20))fail();
 if(c.weapons!==undefined&&(!Array.isArray(c.weapons)||c.weapons.length>20||c.weapons.some(w=>!w||!weapons.some(r=>r.name===w.name)||!['auto','str','dex','con','int','wis','cha'].includes(w.ability)||typeof w.proficient!=='boolean'||typeof w.twoHanded!=='boolean'||!integer(w.attackBonus,-20,20)||!integer(w.damageBonus,-20,20))))fail();
 if(c.spellbook!==undefined&&(!Array.isArray(c.spellbook)||c.spellbook.length>339||new Set(c.spellbook.map(r=>r?.name)).size!==c.spellbook.length||c.spellbook.some(r=>!r||typeof r.name!=='string'||r.name.length>120||typeof r.prepared!=='boolean')))fail();
 for(const b of c.spellbook||[])if(b.grants!==undefined){if(!b.grants||typeof b.grants!=='object'||Array.isArray(b.grants)||!Object.keys(b.grants).length||Object.entries(b.grants).some(([key,g])=>!['background','origin','species','class',...Object.keys(classData).map(n=>'class:'+n),...[6,7,8,9].map(n=>'arcanum:'+n)].includes(key)||!g||typeof g.prepared!=='boolean')||b.prepared!==Object.values(b.grants).some(g=>g.prepared))fail();}
 for(const k of ['slotTotals','slotsUsed'])if(c[k]!==undefined&&!(k==='slotTotals'&&c[k]===null)&&(!Array.isArray(c[k])||c[k].length!==9||c[k].some(n=>!integer(n,0,20))))fail();
 if(c.castingAbility!==undefined&&![3,4,5].includes(c.castingAbility))fail();
 if(c.concentration!==undefined&&(typeof c.concentration!=='string'||c.concentration.length>120))fail();
 if(c.starting!==undefined){const a=c.starting;if(!a||!['gear','money','gm'].includes(a.mode))fail();
  if(a.mode==='gear'&&!integer(a.kit,0,1))fail();
  if(a.mode==='gm'&&a.gmGold!==null&&!integer(a.gmGold,0,1000000))fail();
  if(a.mode==='money'){if(!['srd','higher','custom'].includes(a.method))fail();if(a.method==='higher'&&(!Array.isArray(a.rolls)||a.rolls.length>1||a.rolls.some(n=>!integer(n,0,10))))fail();if(a.method==='custom'&&(!integer(a.count,1,10)||!integer(a.sides,2,20)||!integer(a.multiplier,1,1000)||!integer(a.flat,0,1000000)||!Array.isArray(a.rolls)||a.rolls.length>a.count||a.rolls.some(n=>!integer(n,0,a.sides))))fail();}
 }
 if(c.inventory!==undefined&&(!Array.isArray(c.inventory)||c.inventory.length>200||c.inventory.some(r=>!r||typeof r.name!=='string'||r.name.length>200||!integer(r.page,1,364)||!integer(r.quantity,1,10000)||!integer(r.paidCp,0,100000000))))fail();
 if(c.loadoutFromKit!==undefined&&(typeof c.loadoutFromKit!=='boolean'||c.loadoutFromKit&&c.starting?.mode!=='gear'))fail();
 if(!draft&&(multiclassIssues(c).length||creationIssues(c).length||dndSkillIssues(c).length||dndSpellIssues(c).length||dndLanguageIssues(c).length||c.languageChoices!==undefined&&c.languages!==knownLanguages(c).join(', ')))fail();
 const safe=(v,depth=0)=>{if(depth>12)fail();if(v&&typeof v==='object')for(const k of Object.keys(v)){if(['__proto__','prototype','constructor'].includes(k))fail();safe(v[k],depth+1);}};safe(c);
}
