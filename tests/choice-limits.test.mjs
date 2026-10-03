import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newDndCharacter} from '../dnd-model.mjs';
import {dndTrainingLimit,dndChoiceError,dndSkillIssues,dndSpellIssues,grantSpell,prepareSpell} from '../dnd-choice-limits.mjs';
import {fresh} from '../pathfinder-model.mjs';
import {pfChoiceError,pfFeatError} from '../pathfinder-choice-limits.mjs';
import {pfTrainingRequirements,pfStepIssues} from '../pathfinder-creation-flow.mjs';
import feats from '../pathfinder-data/feats.json' with {type:'json'};
import spells from '../dnd-rules-data/spell-index.json' with {type:'json'};
import pfSpells from '../pathfinder-data/spells.json' with {type:'json'};

test('D&D class lists and species allowances cannot be exceeded',()=>{
 const c={...newDndCharacter(),species:'Dwarf',skills:['Perception','Survival']};
 assert.equal(dndTrainingLimit(c).total,2);assert.match(dndChoiceError(c,{skills:[...c.skills,'Stealth']}),/allow 2/);
 assert.match(dndChoiceError({...c,skills:[]},{skills:['Arcana']}),/class list/);
 assert.equal(dndChoiceError({...c,species:'Human'},{skills:[...c.skills,'Arcana']}),undefined);
 assert.equal(dndTrainingLimit({...c,species:'Human',originFeat:'Skilled'}).total,6);
 assert.equal(dndTrainingLimit({...c,className:'Barbarian',level:3}).total,3);
 assert.match(dndSkillIssues({...c,species:'Elf',skills:['Perception','Arcana','History']}).join(),/class list/);
});
test('Expertise changes with class and level and never grants untrained skills',()=>{
 const c={...newDndCharacter(),className:'Rogue',skills:['Perception','Stealth','Acrobatics','Deception']};
 assert.equal(dndTrainingLimit(c).expertise,2);assert.match(dndChoiceError(c,{expertise:['Perception','Stealth','Acrobatics']}),/2 Expertise/);
 assert.equal(dndTrainingLimit({...c,level:6}).expertise,4);
 assert.match(dndChoiceError({...c,className:'Fighter',skills:['Perception','Survival','Stealth']},{expertise:['Stealth']}),/0 Expertise/);
 assert.match(dndChoiceError(c,{expertise:['Arcana']}),/already proficient/);
});
test('D&D spells keep class and Magic Initiate limits independent, including shared spells',()=>{
 let c={...newDndCharacter(),className:'Wizard',background:'Sage',spellbook:[]};
 const cantrips=Object.entries(spells).filter(([,r])=>r.level===0&&r.classes.includes('Wizard')).map(([n])=>n);
 for(const n of cantrips.slice(0,3))c.spellbook=grantSpell(c,n,'class');
 assert.equal(dndSpellIssues(c).length,0);assert.match(dndChoiceError(c,{spellbook:grantSpell(c,cantrips[3],'class')}),/3 cantrips/);
 c.spellbook=grantSpell(c,cantrips[0],'background');c.spellbook=grantSpell(c,cantrips[3],'background');assert.equal(dndSpellIssues(c).length,0);
 assert.equal(c.spellbook.filter(b=>b.name===cantrips[0]).length,1);assert.match(dndChoiceError(c,{spellbook:grantSpell(c,cantrips[4],'background')}),/2 cantrips/);
 const ranked=Object.entries(spells).filter(([,r])=>r.level===1&&r.classes.includes('Wizard')).map(([n])=>n);
 for(const n of ranked.slice(0,5))c.spellbook=grantSpell(c,n,'class');
 for(const n of ranked.slice(0,4))c.spellbook=prepareSpell(c,n,true);
 assert.equal(dndSpellIssues(c).length,0);assert.match(dndChoiceError(c,{spellbook:prepareSpell(c,ranked[4],true)}),/4 prepared/);
 const high=Object.entries(spells).find(([,r])=>r.level===2&&r.classes.includes('Wizard'))[0];assert.match(dndChoiceError(c,{spellbook:grantSpell(c,high,'class')}),/available levels/);
});
test('species spell access changes with lineage and level',()=>{
 let c={...newDndCharacter(),species:'Tiefling',speciesLineage:'Infernal'};
 c.spellbook=grantSpell(c,'Fire Bolt','species');assert.equal(dndSpellIssues(c).length,0);
 assert.match(dndChoiceError(c,{spellbook:grantSpell(c,'Darkness','species')}),/granted list/);
 c.level=5;assert.equal(dndChoiceError(c,{spellbook:grantSpell(c,'Darkness','species')}),undefined);
});
test('Pathfinder trained skills track Intelligence and heritage and reject excess',()=>{
 const c={...fresh(),background:'Warrior',heritage:'Skilled Human',boosts:{ancestry:['int','str'],background:['str','int'],class:['str'],free:['str','int','con','dex']}};
 assert.equal(pfTrainingRequirements(c).required,8);
 const available=['Acrobatics','Arcana','Athletics','Crafting','Deception','Diplomacy','Medicine','Nature','Occultism'];
 assert.match(pfChoiceError(c,{ranks:Object.fromEntries(available.map(n=>[n,1]))}),/8 additional/);
 assert.match(pfStepIssues({...c,ranks:Object.fromEntries(available.map(n=>[n,1]))})[2].join(),/8 additional/);
});
test('Pathfinder feat slots honor category, level, and Natural Ambition',()=>{
 const c={...fresh(),heritage:'Versatile Human'},classes=feats.filter(f=>f.data.category==='class'&&f.data.level.value===1&&f.data.traits.value.includes('fighter'));
 c.feats=[classes[0]];assert.equal(pfFeatError(c),undefined);assert.match(pfChoiceError(c,{feats:[...c.feats,classes[1]]}),/no remaining class/);
 c.feats.push(feats.find(f=>f.name==='Natural Ambition'));assert.equal(pfChoiceError(c,{feats:[...c.feats,classes[1]]}),undefined);
});
test('Pathfinder spell preparations cannot exceed the rank budget',()=>{
 const c={...fresh(),className:'Wizard'},spell=pfSpells.find(r=>r.data.level.value===1&&!r.data.traits.value.some(t=>['cantrip','focus'].includes(t)));
 c.spellbook=[spell];c.castingState={...c.castingState,slots:{1:{max:2,used:0}},preparations:[]};
 assert.match(pfChoiceError(c,{castingState:{...c.castingState,slots:{1:{max:3,used:0}}}}),/grants 2/);
 assert.match(pfChoiceError(c,{castingState:{...c.castingState,preparations:Array.from({length:3},()=>({rank:1,spellId:spell.id,used:false}))}}),/Too many prepared/);
});

test('Pathfinder prepared books retain extra learned cantrips while daily selection stays capped',()=>{
 const cantrips=pfSpells.filter(r=>r.data.traits.value.includes('cantrip')&&r.data.traits.traditions.includes('arcane')).slice(0,6),c={...fresh(),className:'Wizard',spellbook:cantrips};
 c.castingState={...c.castingState,cantrips:cantrips.slice(0,5).map(r=>r.id)};
 assert.equal(pfChoiceError(c,{spellbook:cantrips}),undefined);
 assert.match(pfChoiceError(c,{castingState:{...c.castingState,cantrips:cantrips.map(r=>r.id)}}),/5 daily cantrips/);
 assert.match(pfChoiceError(c,{castingState:{...c.castingState,mode:'spontaneous'}}),/uses prepared/);
 assert.match(pfChoiceError(c,{castingState:{...c.castingState,tradition:'divine'}}),/uses the arcane/);
});
