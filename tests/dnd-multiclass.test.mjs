import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newDndCharacter,dndStats} from '../dnd-model.mjs';
import {classLevels,multiclassIssues} from '../dnd-multiclass.mjs';
import {spellSlotPools} from '../dnd-play.mjs';
import {dndSpellLimits,dndSpellIssues,dndChoiceError,dndTrainingLimit,dndSkillIssues,grantSpell,prepareSpell,hasDndMagic,reducesSpellChoices} from '../dnd-choice-limits.mjs';
import {dndStepIssues} from '../dnd-creation-flow.mjs';
import {validateDndCharacter} from '../dnd-validation.mjs';
import {alwaysPreparedGrants,readySpellbook} from '../dnd-granted-spells.mjs';
import index from '../dnd-rules-data/spell-index.json' with {type:'json'};
const extra=(className,level=1,subclass='')=>({className,level,subclass,order:''});
const base=()=>({...newDndCharacter(),name:'Mira',species:'Dwarf',method:'physical',scores:[13,13,13,13,13,13],languages:'Common, Elvish, Dwarvish',hp:20});
test('a noncaster skips magic but species, feats, backgrounds, and a caster multiclass retain it',()=>{
 const c=base();assert.equal(hasDndMagic(c),false);
 for(const patch of [{background:'Sage'},{species:'Elf',speciesLineage:'High Elf'},{species:'Human',originFeat:'Magic Initiate (Druid)'},{level:2,multiclass:[extra('Wizard')]}])assert.equal(hasDndMagic({...c,...patch}),true);
 const mixed={...c,level:2,multiclass:[extra('Wizard')]};assert.equal(dndSpellLimits(mixed)['class:Wizard'].cantrips,3);assert.equal(dndSpellLimits(mixed)['class:Wizard'].ready,4);assert.equal(dndSpellLimits(mixed).class.ready,0);assert.match(dndStepIssues(mixed)[3].join(),/Wizard/);
});
test('2024 shared slots allow upcasting without unlocking another class spell level',()=>{
 let c={...base(),className:'Wizard',level:5,multiclass:[extra('Cleric',2)]};
 assert.deepEqual(spellSlotPools(c).regular,[4,3,2,0,0,0,0,0,0]);assert.equal(dndSpellLimits(c).class.maxLevel,2);assert.equal(dndSpellLimits(c)['class:Cleric'].maxLevel,1);
 assert.match(dndChoiceError(c,{spellbook:grantSpell(c,'Fireball','class')}),/available levels/);
 assert.match(dndChoiceError(c,{spellbook:grantSpell(c,'Aid','class:Cleric')}),/available levels/);
 assert.equal(dndChoiceError(c,{spellbook:grantSpell(c,'Magic Missile','class')}),undefined);
 assert.deepEqual(spellSlotPools({...base(),className:'Ranger',level:7,multiclass:[extra('Sorcerer',3)]}).regular,[4,3,2,0,0,0,0,0,0]);
 assert.deepEqual(spellSlotPools({...base(),className:'Paladin',level:4,multiclass:[extra('Wizard')]}).regular,[4,2,0,0,0,0,0,0,0]);
});
test('Warlock Pact Magic remains separate and caps its spell level at five',()=>{
 const c={...base(),className:'Warlock',level:8,multiclass:[extra('Wizard',3)]};
 assert.deepEqual(spellSlotPools(c),{regular:[4,2,0,0,0,0,0,0,0],pact:[0,0,2,0,0,0,0,0,0]});
 assert.equal(dndSpellLimits(c).class.maxLevel,3);assert.equal(dndSpellLimits(c)['class:Wizard'].maxLevel,2);
 assert.equal(dndSpellLimits({...base(),className:'Warlock',level:20}).class.maxLevel,5);
});
test('class prerequisites require 13 in all current and incoming primary abilities',()=>{
 const c={...base(),className:'Fighter',level:2,multiclass:[extra('Wizard')]};assert.deepEqual(multiclassIssues(c),[]);
 assert.match(multiclassIssues({...c,scores:[13,13,13,8,13,13]}).join(),/Wizard.*Intelligence 13/);
 assert.match(multiclassIssues({...c,scores:[8,8,13,13,13,13]}).join(),/Fighter.*Strength or Dexterity/);
 assert.match(multiclassIssues({...c,multiclass:[extra('Paladin')],scores:[13,13,13,13,13,8]}).join(),/Strength and Charisma/);
 assert.match(multiclassIssues({...c,multiclass:[extra('Monk')],scores:[13,13,13,13,8,13]}).join(),/Dexterity and Wisdom/);
 assert.ok(multiclassIssues({...c,multiclass:[extra('Fighter')]}).length);
 assert.ok(dndChoiceError(c,{level:1}));assert.equal(dndStats({...c,level:5}).pb,3);
});
test('multiclass skill and Expertise grants use class levels and restricted choice pools',()=>{
 const c={...base(),level:7,multiclass:[extra('Rogue',1),extra('Wizard',1)]};
 assert.equal(dndTrainingLimit(c).total,3);assert.equal(dndTrainingLimit(c).expertise,2);assert.deepEqual(dndSkillIssues({...c,skills:['Perception','Survival','Stealth'],expertise:['Athletics','Perception']}),[]);
 assert.ok(dndSkillIssues({...c,skills:['Perception','Survival','Arcana']}).length);
 assert.equal(dndTrainingLimit({...c,background:'Sage',multiclass:[extra('Rogue',1),extra('Wizard',2)]}).expertise,3);
 assert.equal(dndTrainingLimit({...c,multiclass:[extra('Rogue',1),extra('Wizard',2)]}).expertise,2);
 assert.deepEqual(dndStats({...c,skills:[]}).saves,[5,2,4,1,1,1]);
});
test('casting subclasses retain magic and use single-class or multiclass slot rules correctly',()=>{
 const knight={...base(),level:4,subclass:'Eldritch Knight'};assert.equal(hasDndMagic(knight),true);assert.equal(dndSpellLimits(knight).class.ready,4);assert.deepEqual(spellSlotPools(knight).regular,[3,0,0,0,0,0,0,0,0]);
 const mixed={...knight,level:6,multiclass:[extra('Wizard',2)]};assert.deepEqual(spellSlotPools(mixed).regular,[4,2,0,0,0,0,0,0,0]);assert.equal(dndSpellLimits(mixed).class.maxLevel,1);assert.equal(dndSpellLimits(mixed).class.ability,3);
 const trickster={...base(),className:'Rogue',level:3,subclass:'Arcane Trickster'};assert.equal(dndSpellLimits(trickster).class.cantrips,2);assert.ok(readySpellbook(trickster).some(b=>b.name==='Mage Hand'));assert.equal(dndSpellLimits({...trickster,level:20}).class.ready,13);
});
test('Mystic Arcanum uses a separate exact-level choice and Bard Magical Secrets opens the right lists',()=>{
 const c={...base(),className:'Warlock',level:11};assert.equal(dndSpellLimits(c)['arcanum:6'].ready,1);assert.equal(dndChoiceError(c,{spellbook:grantSpell(c,'Circle of Death','arcanum:6')}),undefined);assert.match(dndChoiceError(c,{spellbook:grantSpell(c,'Fireball','arcanum:6')}),/available levels/);assert.match(dndChoiceError(c,{spellbook:grantSpell(c,'Circle of Death','class')}),/available levels/);
 const bard={...base(),className:'Bard',level:10};assert.equal(dndChoiceError(bard,{spellbook:grantSpell(bard,'Fireball','class')}),undefined);assert.equal(dndChoiceError({...bard,level:9},{spellbook:grantSpell(bard,'Fireball','class')})?.includes('available levels'),true);
});
test('the same spell can belong to two classes with independent preparation limits',()=>{
 let c={...base(),className:'Wizard',level:2,multiclass:[extra('Sorcerer')]};
 c.spellbook=grantSpell(c,'Magic Missile','class');c.spellbook=grantSpell(c,'Magic Missile','class:Sorcerer');assert.equal(c.spellbook.length,1);
 c.spellbook=prepareSpell(c,'Magic Missile',true,'class:Sorcerer');assert.equal(c.spellbook[0].grants.class.prepared,false);assert.equal(c.spellbook[0].grants['class:Sorcerer'].prepared,true);assert.deepEqual(dndSpellIssues(c),[]);
 c.spellbook=prepareSpell(c,'Magic Missile',true,'class');assert.equal(reducesSpellChoices(c.spellbook,prepareSpell(c,'Magic Missile',false,'class')),true);
 for(const name of ['Shield','Sleep']){c.spellbook=grantSpell(c,name,'class:Sorcerer');c.spellbook=prepareSpell(c,name,true,'class:Sorcerer');}
 assert.match(dndSpellIssues(c).join(),/Sorcerer.*2 prepared/);
});
test('backups validate class levels and prerequisites and preserve removed-class spells for repair',()=>{
 const c={...base(),level:2,multiclass:[extra('Wizard')],pactSlotsUsed:0};c.spellbook=grantSpell(c,'Magic Missile','class:Wizard');assert.doesNotThrow(()=>validateDndCharacter(c));
 assert.throws(()=>validateDndCharacter({...c,level:1},{draft:true}));assert.throws(()=>validateDndCharacter({...c,multiclass:[extra('Fighter')]},{draft:true}));assert.throws(()=>validateDndCharacter({...c,pactSlotsUsed:5},{draft:true}));
 const removed={...c,multiclass:[]};assert.doesNotThrow(()=>validateDndCharacter(removed,{draft:true}));assert.throws(()=>validateDndCharacter(removed));
});
test('always-ready core and SRD subclass spells are separate and contain real catalogue names',()=>{
 for(const [className,subclass] of [['Cleric','Life Domain'],['Paladin','Oath of Devotion'],['Sorcerer','Draconic'],['Warlock','Fiend'],['Druid','Circle of the Land'],['Ranger','Hunter']])for(const land of ['Arid','Polar','Temperate','Tropical']){
  const c={...base(),className,level:20,subclass,land};for(const g of alwaysPreparedGrants(c))for(const name of g.names)assert.ok(index[name],name);assert.ok(readySpellbook(c).every(b=>b.prepared));
 }
 const c={...base(),className:'Cleric',subclass:'Life Domain',level:3};assert.equal(alwaysPreparedGrants(c)[0].names.length,4);assert.equal(dndSpellLimits(c).class.ready,6);assert.match(dndChoiceError(c,{spellbook:grantSpell(c,'Bless','class')}),/always ready/);
 assert.equal(classLevels({...c,level:4,multiclass:[extra('Wizard') ]})[0].level,3);
});
