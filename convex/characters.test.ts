import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import {newDndCharacter} from '../dnd-model.mjs';

const modules = import.meta.glob("./**/*.ts");
test('5e cloud languages retain included grants and reject excess or rare choices without a class grant',async()=>{
 const t=convexTest(schema,modules),owner=await t.run(ctx=>ctx.db.insert('users',{email:'languages@example.test'})),client=t.withIdentity({subject:owner});
 const character={...newDndCharacter(),name:'Mira',species:'Dwarf',languageChoices:['Elvish'],languages:'Common, Dwarvish, Elvish'},snapshot={version:1,system:'dnd5e',character};
 const id=await client.mutation(api.characters.save,{snapshot});expect((await client.query(api.characters.load,{id})).character).toEqual(character);
 for(const choices of [['Elvish','Giant'],['Celestial']])await expect(client.mutation(api.characters.save,{id,snapshot:{...snapshot,character:{...character,languageChoices:choices,languages:['Common','Dwarvish',...choices].join(', ')}}})).rejects.toThrow('Invalid 5e character');
 await expect(client.mutation(api.characters.save,{id,snapshot:{...snapshot,character:{...character,languages:'Common'}}})).rejects.toThrow('Invalid 5e character');
 expect((await client.query(api.characters.load,{id})).character).toEqual(character);
});
test('5e cloud saves reject skill, Expertise, and spell choices over their actual grants',async()=>{
 const t=convexTest(schema,modules),owner=await t.run(ctx=>ctx.db.insert('users',{email:'limits@example.test'})),client=t.withIdentity({subject:owner});
 const character={...newDndCharacter(),name:'Limit check',skills:['Perception','Survival','Stealth','History']},snapshot={version:1,system:'dnd5e',character};
 await expect(client.mutation(api.characters.save,{snapshot})).rejects.toThrow('Invalid 5e character');
 character.skills=['Perception','Survival','Stealth'];character.expertise=['Perception'];await expect(client.mutation(api.characters.save,{snapshot})).rejects.toThrow('Invalid 5e character');
 character.expertise=[];character.className='Wizard';character.skills=[];character.spellbook=['Acid Splash','Chill Touch','Mage Hand','Fire Bolt'].map(name=>({name,prepared:false}));await expect(client.mutation(api.characters.save,{snapshot})).rejects.toThrow('Invalid 5e character');
});
test('combat loadout and personal spell book persist with slot use and reject malformed updates',async()=>{
 const t=convexTest(schema,modules),owner=await t.run(ctx=>ctx.db.insert('users',{email:'spellbook@example.test'})),client=t.withIdentity({subject:owner});
 const character=newDndCharacter();character.name='Keeper';character.starting={mode:'gm',gmGold:50};character.inventory=[{name:'Longsword',page:91,quantity:1,paidCp:1500}];character.armor='Chain Mail';character.shield=true;character.weapons=[{name:'Longsword',ability:'auto',proficient:true,twoHanded:false,attackBonus:1,damageBonus:1}];character.spellbook=[{name:'Magic Missile',prepared:true}];character.slotsUsed=[1,0,0,0,0,0,0,0,0];
 character.className='Wizard';
 const snapshot={version:1,system:'dnd5e',character},id=await client.mutation(api.characters.save,{snapshot});expect(await client.query(api.characters.load,{id})).toEqual(snapshot);
 character.slotsUsed[0]=-1;await expect(client.mutation(api.characters.save,{id,snapshot})).rejects.toThrow('Invalid 5e character');expect((await client.query(api.characters.load,{id})).character.slotsUsed[0]).toBe(1);
 character.slotsUsed[0]=1;character.inventory[0].quantity=4;await expect(client.mutation(api.characters.save,{id,snapshot})).rejects.toThrow('Invalid 5e character');expect((await client.query(api.characters.load,{id})).character.inventory[0].quantity).toBe(1);
});
test('5e sheets share owner permissions and reject invalid ability allocations',async()=>{const t=convexTest(schema,modules);const owner=await t.run(ctx=>ctx.db.insert('users',{email:'dnd@example.test'}));const other=await t.run(ctx=>ctx.db.insert('users',{email:'other@example.test'}));const client=t.withIdentity({subject:owner});const character=newDndCharacter();character.name='Aster';const snap={version:1,system:'dnd5e',character};const id=await client.mutation(api.characters.save,{snapshot:snap});expect((await client.query(api.characters.list,{}))[0].setting).toBe('dnd5e');expect(await client.query(api.characters.load,{id})).toEqual(snap);await expect(t.withIdentity({subject:other}).query(api.characters.load,{id})).rejects.toThrow('Character not found');character.boosts=[2,2,2,2,2,2];await expect(client.mutation(api.characters.save,{id,snapshot:snap})).rejects.toThrow('Invalid 5e character');});

test('multiclass backups keep class spell sources and reject invalid class levels or spell access',async()=>{
 const t=convexTest(schema,modules),owner=await t.run(ctx=>ctx.db.insert('users',{email:'multiclass@example.test'})),client=t.withIdentity({subject:owner});
 const character={...newDndCharacter(),name:'Mira',species:'Dwarf',method:'physical',scores:[13,13,13,13,13,13],level:2,hp:20,multiclass:[{className:'Wizard',level:1,subclass:'',order:''}],spellbook:[{name:'Magic Missile',prepared:true,grants:{'class:Wizard':{prepared:true}}}]};
 const snapshot={version:1,system:'dnd5e',character},id=await client.mutation(api.characters.save,{snapshot});expect((await client.query(api.characters.load,{id})).character).toEqual(character);
 await expect(client.mutation(api.characters.save,{id,snapshot:{...snapshot,character:{...character,level:1}}})).rejects.toThrow('Invalid 5e character');
 await expect(client.mutation(api.characters.save,{id,snapshot:{...snapshot,character:{...character,spellbook:[{name:'Fireball',prepared:true,grants:{'class:Wizard':{prepared:true}}}]}}})).rejects.toThrow('Invalid 5e character');expect((await client.query(api.characters.load,{id})).character).toEqual(character);
});

function snapshot(name: string) {
  return { version: 1, character: { name, setting: "deadlands", concept:'',notes:'',race:null,heritageChoice:null,attributes:{agility:4,smarts:4,spirit:4,strength:4,vigor:4},skills:{athletics:4,commonKnowledge:4,notice:4,persuasion:4,stealth:4},hindrancePointsSpent:{attributes:0,edges:0,skills:0},funds:500,edges:[],hindrances:[],languages:[],bonusRules:[],gear:[],powers:[] } };
}

test("players can only list, load, and update their own characters", async () => {
  const t = convexTest(schema, modules);
  const aliceId = await t.run(ctx => ctx.db.insert("users", { email: "alice@example.test" }));
  const bobId = await t.run(ctx => ctx.db.insert("users", { email: "bob@example.test" }));
  const alice = t.withIdentity({ subject: aliceId });
  const bob = t.withIdentity({ subject: bobId });

  const id = await alice.mutation(api.characters.save, { snapshot: snapshot("Scout") });
  expect((await alice.query(api.characters.list, {})).map(c => c.name)).toEqual(["Scout"]);
  expect(await alice.query(api.characters.load, { id })).toEqual(snapshot("Scout"));
  expect(await bob.query(api.characters.list, {})).toEqual([]);
  await expect(bob.query(api.characters.load, { id })).rejects.toThrow("Character not found");
  await expect(bob.mutation(api.characters.save, { id, snapshot: snapshot("Stolen") })).rejects.toThrow("Character not found");
  expect((await alice.query(api.characters.load, { id })).character.name).toBe("Scout");
  await alice.mutation(api.characters.save, { id, snapshot: snapshot("Ranger") });
  expect((await alice.query(api.characters.load, { id })).character.name).toBe("Ranger");
});

test("signed-out users cannot write or load a character", async () => {
  const t = convexTest(schema, modules);
  await expect(t.mutation(api.characters.save, { snapshot: snapshot("Guest") })).rejects.toThrow("Sign in");
  expect(await t.query(api.characters.list, {})).toEqual([]);
});

test('rejects malformed and injected identifiers before storing',async()=>{
  const t=convexTest(schema,modules);const user=await t.run(ctx=>ctx.db.insert('users',{email:'validator@example.test'}));const client=t.withIdentity({subject:user});
  const bad=snapshot('Bad');bad.character.edges=["x');alert(1)//"] as never[];
  await expect(client.mutation(api.characters.save,{snapshot:bad})).rejects.toThrow('Invalid character');
  await expect(client.mutation(api.characters.save,{snapshot:{version:1,character:{name:'Incomplete'}}})).rejects.toThrow('Invalid character');
  expect(await client.query(api.characters.list,{})).toEqual([]);
});
