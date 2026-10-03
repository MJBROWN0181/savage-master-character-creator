import test from 'node:test';
import assert from 'node:assert/strict';
import {newDndCharacter} from '../dnd-model.mjs';
import {dndLanguages,speciesLanguages,dndLanguageRules,chosenLanguages,knownLanguages,syncDndLanguages,dndLanguageIssues} from '../dnd-languages.mjs';
import {dndChoiceError} from '../dnd-choice-limits.mjs';
import {dndStepIssues} from '../dnd-creation-flow.mjs';
import {journeyChapters} from '../character-journey.mjs';
import {validateDndCharacter} from '../dnd-validation.mjs';

test('every supported species starts with Common and its species language within three starting languages',()=>{
 assert.equal(dndLanguages.length,19);
 for(const [species,language] of Object.entries(speciesLanguages)){
  const c=syncDndLanguages({...newDndCharacter(),species});
  assert.ok(knownLanguages(c).includes('Common'));
  assert.ok(knownLanguages(c).includes(language));
  assert.equal(dndLanguageRules(c).starting,species==='Human'?2:1);
  assert.equal(knownLanguages(c).length+dndLanguageRules(c).starting,3);
  const choices=['Common Sign Language','Goblin'].slice(0,dndLanguageRules(c).starting);
  assert.deepEqual(dndLanguageIssues(syncDndLanguages(c,{languageChoices:choices}),{complete:true}),[]);
 }
});
test('species and class changes replace automatic languages without losing explicit player choices',()=>{
 const dwarf=syncDndLanguages({...newDndCharacter(),species:'Dwarf'},{languageChoices:['Elvish']});
 const orc=syncDndLanguages(dwarf,{species:'Orc'});
 assert.deepEqual(knownLanguages(orc),['Common','Orc','Elvish']);
 const druid=syncDndLanguages(orc,{className:'Druid'});
 assert.ok(knownLanguages(druid).includes('Druidic'));
 assert.deepEqual(knownLanguages(syncDndLanguages(druid,{className:'Fighter'})),['Common','Orc','Elvish']);
 assert.deepEqual(knownLanguages(syncDndLanguages(orc,{languageChoices:[]})),['Common','Orc']);
});
test('standard and rare language choices obey separate starting and class allowances',()=>{
 const dwarf=syncDndLanguages({...newDndCharacter(),species:'Dwarf'});
 assert.match(dndChoiceError(dwarf,{languageChoices:['Elvish','Giant']}),/allows 1 language/);
 assert.match(dndChoiceError(dwarf,{languageChoices:['Celestial']}),/Rare language/);
 assert.equal(dndChoiceError(dwarf,{languageChoices:['Elvish']}),undefined);
 const rogue=syncDndLanguages(dwarf,{className:'Rogue',languageChoices:['Celestial']});
 assert.match(dndLanguageIssues(rogue,{complete:true}).join(' '),/more different starting language/);
 assert.deepEqual(dndLanguageIssues(syncDndLanguages(rogue,{languageChoices:['Elvish','Celestial']}),{complete:true}),[]);
 assert.match(dndChoiceError(rogue,{languageChoices:['Celestial','Sylvan']}),/Rare language/);
});
test('Rogue, Druid, and Ranger grants use actual class levels in a multiclass build',()=>{
 const c=syncDndLanguages({...newDndCharacter(),species:'Dwarf',level:5,multiclass:[{className:'Rogue',level:1,subclass:'',order:''},{className:'Druid',level:1,subclass:'',order:'Warden'},{className:'Ranger',level:1,subclass:'',order:''}]});
 assert.deepEqual(knownLanguages(c),['Common','Dwarvish','Druidic','Thieves’ Cant']);
 assert.equal(dndLanguageRules(c).bonus,1);
 const ranger=syncDndLanguages(c,{multiclass:c.multiclass.map(r=>r.className==='Ranger'?{...r,level:2}:r)});
 assert.equal(dndLanguageRules(ranger).bonus,3);
 assert.deepEqual(dndLanguageIssues(syncDndLanguages(ranger,{languageChoices:['Elvish','Celestial','Abyssal','Primordial']}),{complete:true}),[]);
});
test('legacy language text migrates without duplicates and extra choices can be repaired gradually',()=>{
 const c=syncDndLanguages({...newDndCharacter(),species:'Dwarf',languages:" common; dwarvish\nELVISH, Elvish, Goblin, Sylvan, Secret Tongue"});
 assert.deepEqual(chosenLanguages(c),['Elvish','Goblin','Sylvan','Secret Tongue']);
 assert.match(dndLanguageIssues(c).join(' '),/Secret Tongue/);
 assert.equal(dndChoiceError(c,{languageChoices:['Elvish','Goblin','Sylvan']}),undefined);
 assert.match(dndChoiceError(c,{languageChoices:[...chosenLanguages(c),'Giant']}),/unsupported/);
 assert.deepEqual(dndLanguageIssues(syncDndLanguages(c,{languageChoices:['Elvish']}),{complete:true}),[]);
 const rogue=syncDndLanguages({...newDndCharacter(),className:'Rogue',languages:"Common, Thieves' Cant, Elvish"});
 assert.equal(knownLanguages(rogue).filter(n=>n==='Thieves’ Cant').length,1);
 const longLegacy=syncDndLanguages({...newDndCharacter(),languages:'X'.repeat(1000)});
 validateDndCharacter(longLegacy,{draft:true});assert.ok(chosenLanguages(longLegacy).includes('X'.repeat(1000)));
 assert.deepEqual(chosenLanguages({...newDndCharacter(),languages:'Common, elf, Aquan, Auran'}),['Elvish','Primordial']);
});
test('language problems go to the language chapter and remain visible after class grants are removed',()=>{
 const c=syncDndLanguages({...newDndCharacter(),species:'Dwarf',className:'Rogue'},{languageChoices:['Elvish','Celestial']});
 const fighter=syncDndLanguages(c,{className:'Fighter'});
 const chapters=journeyChapters('dnd5e',dndStepIssues(fighter),{species:true,class:true,background:true});
 assert.ok(chapters[6].missing.some(m=>/Rare language/.test(m)));
 assert.ok(!chapters[7].missing.some(m=>/language/i.test(m)));
});
test('backups preserve explicit language choices and full validation rejects bypassed limits',()=>{
 const base={...newDndCharacter(),name:'Mira',species:'Dwarf'};
 const valid=syncDndLanguages(base,{languageChoices:['Elvish']});
 const copy=JSON.parse(JSON.stringify(valid));validateDndCharacter(copy);
 assert.deepEqual(chosenLanguages(copy),['Elvish']);
 assert.throws(()=>validateDndCharacter(syncDndLanguages(base,{languageChoices:['Elvish','Giant']})));
 assert.throws(()=>validateDndCharacter(syncDndLanguages(base,{languageChoices:['Celestial']})));
 assert.throws(()=>validateDndCharacter({...valid,languages:'Common'}));
 validateDndCharacter(syncDndLanguages(base,{languageChoices:['Elvish','Giant']}),{draft:true});
});
