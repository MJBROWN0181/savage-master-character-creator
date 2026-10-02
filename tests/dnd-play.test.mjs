import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newDndCharacter,dndStats} from '../dnd-model.mjs';
import {combatStats,spellSlots} from '../dnd-play.mjs';
import {validateDndCharacter} from '../dnd-validation.mjs';
const weapon=(name,patch={})=>({name,ability:'auto',proficient:true,twoHanded:false,attackBonus:0,damageBonus:0,...patch});
test('armor handles Dexterity limits, negative modifiers, shield and a final override',()=>{
 const c=newDndCharacter();c.armor='Half Plate Armor';c.shield=true;c.acBonus=1;c.scores[1]=18;c.boosts[1]=0;assert.equal(dndStats(c).ac,20);
 c.scores[1]=8;assert.equal(dndStats(c).ac,17);c.armor='Plate Armor';assert.equal(dndStats(c).ac,21);c.ac=24;assert.equal(dndStats(c).ac,24);
});
test('weapon totals use proficiency, Finesse, range, bonuses and versatile damage',()=>{
 const c=newDndCharacter();c.level=5;c.weapons=[weapon('Longsword',{twoHanded:true,attackBonus:1,damageBonus:1}),weapon('Dagger'),weapon('Shortbow',{proficient:false})];
 const a=combatStats(c,dndStats(c)).attacks;assert.equal(a[0].attack,7);assert.equal(a[0].damage,'1d10 Slashing');assert.equal(a[0].damageBonus,4);assert.equal(a[1].ability,0);assert.equal(a[2].ability,1);assert.equal(a[2].attack,2);
 c.scores[1]=18;assert.equal(combatStats(c,dndStats(c)).attacks[1].ability,1);
});
test('unarmored class defenses respect class and shield restrictions',()=>{
 const c=newDndCharacter();c.className='Monk';c.defense='monk';c.scores[4]=16;assert.equal(dndStats(c).ac,15);c.shield=true;assert.equal(dndStats(c).ac,14);c.className='Barbarian';c.defense='barbarian';assert.equal(dndStats(c).ac,15);c.className='Fighter';assert.equal(dndStats(c).ac,14);
});
test('spell slots distinguish full casters, revised half casters and Pact Magic',()=>{
 const c=newDndCharacter();assert.deepEqual(spellSlots(c),Array(9).fill(0));c.className='Wizard';c.level=5;assert.deepEqual(spellSlots(c),[4,3,2,0,0,0,0,0,0]);c.level=20;assert.deepEqual(spellSlots(c),[4,3,3,3,3,2,2,1,1]);c.className='Paladin';c.level=1;assert.equal(spellSlots(c)[0],2);c.level=5;assert.deepEqual(spellSlots(c),[4,2,0,0,0,0,0,0,0]);c.className='Warlock';c.level=1;assert.deepEqual(spellSlots(c),[1,0,0,0,0,0,0,0,0]);c.level=11;assert.deepEqual(spellSlots(c),[0,0,0,0,3,0,0,0,0]);
});
test('old characters remain valid and new play data survives backups with bounds enforced',()=>{
 const c=newDndCharacter();c.name='Keeper';for(const k of ['weapons','armor','shield','defense','acBonus','spellbook','slotsUsed'])delete c[k];validateDndCharacter(c);assert.equal(dndStats(c).ac,12);
 c.weapons=[weapon('Longsword')];c.spellbook=[{name:'Cure Wounds',prepared:true}];c.slotTotals=[2,0,0,0,0,0,0,0,0];c.slotsUsed=[1,0,0,0,0,0,0,0,0];validateDndCharacter(JSON.parse(JSON.stringify(c)));c.weapons[0].attackBonus=Infinity;assert.throws(()=>validateDndCharacter(c));c.weapons=[];c.spellbook.push(c.spellbook[0]);assert.throws(()=>validateDndCharacter(c));
});
test('personal spell book retains full effects and high-level scaling beyond excerpts',()=>{
 const spells=JSON.parse(fs.readFileSync(new URL('../dnd-rules-data/spells.json',import.meta.url)));
 assert.ok(spells.every(s=>s.fullDescription&&s.fullDescription.length>=s.description.length));const fireball=spells.find(s=>s.name==='Fireball');assert.match(fireball.fullDescription,/8d6/);assert.match(fireball.fullDescription,/Higher-Level/);const wish=spells.find(s=>s.name==='Wish');assert.ok(wish.fullDescription.length>2000);
});
