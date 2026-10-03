import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newDndCharacter} from '../dnd-model.mjs';
import {fresh} from '../pathfinder-model.mjs';
import {dndStepIssues,dndChapters} from '../dnd-creation-flow.mjs';
import {pfStepIssues,pfChapters} from '../pathfinder-creation-flow.mjs';
import {firstMissing,validCompletions,advanceCompletions} from '../creation-flow.mjs';
import feats from '../pathfinder-data/feats.json' with {type:'json'};
import heritages from '../pathfinder-data/heritages.json' with {type:'json'};
import spells from '../dnd-rules-data/spells.json' with {type:'json'};
import {spellLevel,spellClasses} from '../dnd-spells.mjs';
import {spellGuidance} from '../dnd-spell-guidance.mjs';
import spellIndex from '../dnd-rules-data/spell-index.json' with {type:'json'};
import pfSpells from '../pathfinder-data/spells.json' with {type:'json'};
import pfSpellProgression from '../pathfinder-data/spell-progression.json' with {type:'json'};

const fighter=()=>({...newDndCharacter(),name:'Mira',skills:['Perception','Survival','Stealth'],languages:'Common, Elvish, Dwarvish',features:'Human Origin feat: Alert; gaming set: dice.'});
const pfFighter=()=>({...fresh(),name:'Aster',heritage:'Versatile Human',background:'Warrior',boosts:{ancestry:['str','con'],background:['str','dex'],class:['str'],free:['str','dex','con','wis']},ranks:{Athletics:1,Acrobatics:1,Survival:1,Medicine:1},feats:[feats.find(f=>f.data.category==='ancestry'&&f.data.level.value===1&&f.data.traits.value.includes('human')),feats.find(f=>f.data.category==='class'&&f.data.level.value===1&&f.data.traits.value.includes('fighter')),feats.find(f=>f.data.category==='general'&&f.data.level.value===1)]});
test('timeline checks appear after advancing, survive a return visit, and clear for missing choices',()=>{
 const chapters=dndChapters(fighter());
 assert.deepEqual(validCompletions(chapters,[]),[]);
 const completed=advanceCompletions(chapters,[],2);
 assert.deepEqual(completed,[0,1]);
 assert.deepEqual(validCompletions(chapters,completed),[0,1]);
 chapters[0].missing=['Enter a name.'];
 assert.deepEqual(validCompletions(chapters,completed),[1]);
 assert.deepEqual(validCompletions(chapters,[0,1,5]),[1]);
 assert.deepEqual(advanceCompletions(chapters,completed,5),[1]);
 assert.deepEqual(validCompletions(chapters,[1,1,-1,6,'1']),[1]);
});
test('small creation spell index matches the full rules catalogue',()=>{
 assert.equal(Object.keys(spellIndex).length,spells.length);
 for(const row of spells)assert.deepEqual(spellIndex[row.name],{level:spellLevel(row),classes:spellClasses(row)});
});
test('completed noncaster can reach the shop and sheet without choosing magic',()=>{
 const c=fighter();assert.deepEqual(dndStepIssues(c).flat(),[]);assert.equal(firstMissing(dndChapters(c),5),-1);assert.equal(dndChapters(c)[4].title,'Equipment shop');
});
test('older valid 5e backups without optional spellbook data still open',()=>{
 const c=fighter();delete c.spellbook;assert.deepEqual(dndStepIssues(c).flat(),[]);
});
test('forward moves recheck changed earlier chapters, and equipment does not mask training',()=>{
 const c=fighter();c.name='';assert.equal(firstMissing(dndChapters(c),5),0);c.name='Mira';c.skills=[];assert.equal(firstMissing(dndChapters(c),5),2);c.skills=['Perception','Survival','Stealth'];c.languages='Common, Common, Elvish';assert.match(dndStepIssues(c)[2].join(' '),/different starting language/);
});
test('Bard any-three training and Human additional choice are both counted',()=>{
 const c=fighter();c.className='Bard';assert.match(dndStepIssues(c)[2].join(' '),/1 more skill/);c.skills.push('Investigation');assert.deepEqual(dndStepIssues(c)[2],[]);
});
test('Wizard guide requires cantrips, prepared spells and a complete spellbook',()=>{
 const c=fighter();c.className='Wizard';const guide=spellGuidance.Wizard.levels[0];assert.ok(dndStepIssues(c)[3].length>=3);
 const available=spells.filter(r=>spellClasses(r).includes('Wizard'));
 c.spellbook=[...available.filter(r=>spellLevel(r)===0).slice(0,guide.cantrips),...available.filter(r=>spellLevel(r)===1).slice(0,6)].map((r,i)=>({name:r.name,prepared:i>=guide.cantrips&&i<guide.cantrips+guide.prepared}));assert.deepEqual(dndStepIssues(c)[3],[]);
});
test('Magic Initiate background does not disappear on a noncaster path',()=>{
 const c=fighter();c.background='Sage';assert.equal(dndStepIssues(c)[3].length,2);
});
test('Pathfinder requires heritage, trained choices and matching origin feats',()=>{
 assert.match(pfStepIssues(fresh())[0].join(' '),/heritage/);const c=pfFighter();assert.deepEqual(pfStepIssues(c).flat(),[]);assert.equal(pfChapters(c)[1].title,'Attributes');c.ranks={};assert.match(pfStepIssues(c)[2].join(' '),/4 more/);c.heritage=heritages.find(h=>h.data.ancestry?.name&&h.data.ancestry.name!=='Human').name;assert.match(pfStepIssues(c)[0].join(' '),/matches/);
});
test('Pathfinder overspending is assigned to the shop chapter',()=>{
 const c=pfFighter();c.allowanceCp=0;c.inventory=[{id:'test',data:{price:{value:{gp:1}}}}];assert.match(pfStepIssues(c)[4].join(' '),/allowance/);
});
test('Pathfinder prepared caster cannot advance until daily spells and slots are ready',()=>{
 const c=pfFighter();c.className='Wizard';c.boosts.class=['int'];const guide=pfSpellProgression.Wizard[1];
 assert.ok(pfStepIssues(c)[3].length>=3);
 const cantrips=pfSpells.filter(r=>r.data.traits.value.includes('cantrip')&&r.data.traits.traditions.includes('arcane')).slice(0,guide.cantrips);
 const spell=pfSpells.find(r=>r.data.level.value===1&&!r.data.traits.value.some(t=>['cantrip','focus'].includes(t))&&r.data.traits.traditions.includes('arcane'));
 c.spellbook=[...cantrips,spell];c.castingState.slots={1:{max:guide.slots[0],used:0}};
 c.castingState.preparations=Array.from({length:guide.slots[0]},()=>({spellId:spell.id,rank:1,used:false}));assert.deepEqual(pfStepIssues(c)[3],[]);
 c.castingState.preparations.pop();assert.match(pfStepIssues(c)[3].join(' '),/Prepare spells/);
});

import {journeyChapters as mapJourney,restoredJourneyStep} from '../character-journey.mjs';
const journeyChapters=(system,c,selections)=>mapJourney(system,system==='dnd5e'?dndStepIssues(c):pfStepIssues(c),selections);
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('card journeys require explicit origins while name is only required at the final story chapter',()=>{
 for(const [system,c] of [['dnd5e',newDndCharacter()],['pathfinder2e',fresh()]]){
  const chapters=journeyChapters(system,c,{});
  assert.equal(chapters.length,12);assert.equal(chapters[0].id,'species');assert.equal(chapters[1].id,'class');
  assert.match(chapters[0].missing.join(' '),/from a card/);assert.match(chapters[1].missing.join(' '),/from a card/);
  assert.match(chapters[10].missing.join(' '),/name/);assert.ok(!chapters.slice(0,10).flatMap(ch=>ch.missing).some(m=>/name/.test(m)));
 }
});
test('separate chapters assign training, language, magic and shop problems to the correct task',()=>{
 const c=fighter();c.skills=[];c.languages='Common';c.features='';c.name='';
 const chapters=journeyChapters('dnd5e',c,{species:true,class:true,background:true});
 assert.match(chapters[5].missing.join(' '),/skill/);assert.match(chapters[6].missing.join(' '),/languages/);assert.match(chapters[7].missing.join(' '),/Origin feat/);assert.deepEqual(chapters[8].missing,[]);assert.equal(firstMissing(chapters,5),-1);
 c.level=3;assert.match(journeyChapters('dnd5e',c)[3].missing.join(' '),/maximum HP/);
 const pf=pfFighter();pf.ranks={};assert.match(journeyChapters('pathfinder2e',pf)[6].missing.join(' '),/trained skill/);pf.feats=[];assert.match(journeyChapters('pathfinder2e',pf)[7].missing.join(' '),/ancestry feat/);
});
test('old workshops migrate their current task and new twelve-chapter drafts retain their position',()=>{
 assert.deepEqual([0,1,2,3,4,5].map(n=>restoredJourneyStep('dnd5e',n,3)),[0,4,5,8,9,11]);
 assert.deepEqual([0,1,2,3,4,5].map(n=>restoredJourneyStep('pathfinder2e',n,0)),[0,5,6,8,9,11]);
 for(let n=0;n<12;n++)assert.equal(restoredJourneyStep('dnd5e',n,4),n);
 assert.equal(restoredJourneyStep('dnd5e',99,4),0);
});
test('biography and portrait prompts keep each game and user story distinct',()=>{
 const window={};vm.runInNewContext(readFileSync(new URL('../story-help.js',import.meta.url),'utf8'),{window});
 for(const [system,name] of [['savage','Savage Worlds'],['dnd5e','Dungeons & Dragons'],['pathfinder2e','Pathfinder Second Edition']]){
  const c={system,name:'Aster',species:'Human',bio:'A wandering healer',setting:'My world'};
  assert.match(window.smStory.prompt(c,'bio'),new RegExp(name));assert.match(window.smStory.prompt(c,'bio'),/A wandering healer/);assert.match(window.smStory.prompt(c,'bio'),/Do not invent mechanical bonuses/);
  assert.match(window.smStory.prompt(c,'portrait'),/original fantasy character portrait/);
 }
});
