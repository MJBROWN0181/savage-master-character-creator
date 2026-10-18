import {convexTest} from 'convex-test';
import {expect,test} from 'vitest';
import {makeFunctionReference as ref} from 'convex/server';
import schema from './schema';
import {newDndCharacter} from '../dnd-model.mjs';
import {fresh} from '../pathfinder-model.mjs';
const modules=import.meta.glob('./**/*.ts');
const query=(name:string)=>ref<'query'>('characters:'+name);
const mutation=(name:string)=>ref<'mutation'>('characters:'+name);
const sw=(setting:string|null=null)=>({version:1,character:{name:'Scout',setting,concept:'',notes:'Private memory',race:null,heritageChoice:null,attributes:{agility:4,smarts:4,spirit:4,strength:4,vigor:4},skills:{athletics:4,commonKnowledge:4,notice:4,persuasion:4,stealth:4},hindrancePointsSpent:{attributes:0,edges:0,skills:0},funds:500,edges:[],hindrances:[],languages:[],bonusRules:[],gear:[],powers:[]}});
async function setup(){const t=convexTest(schema,modules);const owner=await t.run(c=>c.db.insert('users',{email:'editor@example.test'}));const other=await t.run(c=>c.db.insert('users',{email:'other@example.test'}));return {t,owner,other,a:t.withIdentity({subject:owner}),b:t.withIdentity({subject:other})};}

test('old clients cannot overwrite an existing character; legacy raw load and create stay compatible',async()=>{
 const {a}=await setup(),snapshot=sw(),id=await a.mutation(mutation('save'),{snapshot});
 await expect(a.mutation(mutation('save'),{id,snapshot:{...snapshot,character:{...snapshot.character,name:'Silent overwrite'}}})).rejects.toThrow('UPDATE_REQUIRED');
 expect(await a.query(query('load'),{id})).toEqual(snapshot);
});
test.each([
 ['savageWorlds',sw()],['savageWorlds',sw('pathfinder')],
 ['dnd5e',{version:1,system:'dnd5e',character:{...newDndCharacter(),name:'Mage'}}],
 ['pathfinder2e',{version:1,system:'pathfinder2e',character:{...fresh(),name:'Seer',background:'Warrior',boosts:{ancestry:['str','con'],background:['str','dex'],class:['str'],free:['str','dex','con','wis']}}}],
])('campaign locator opens the caller\'s exact %s character without writing',async(system,snapshot)=>{
 const {t,a,b,owner}=await setup();
 const saved=await a.mutation(mutation('saveForEdit'),{snapshot,expectedOwnerScope:owner});
 const campaignId=await b.mutation(ref<'mutation'>('privateWorkspaces:createCampaign'),{name:'Table',system});
 const memberId=await t.run(c=>c.db.insert('campaignMembers',{campaignId,userId:owner,characterId:saved.id,role:'player'}));
 const loaded=await a.query(query('loadForEdit'),{campaignId,expectedSystem:system});
 expect(loaded).toMatchObject({id:saved.id,revision:1,ownerScope:owner,system,snapshot});
 const workspace=await a.query(ref<'query'>('campaigns:workspace'),{campaignId});
 expect(workspace.myCharacter).toEqual({state:'ready',id:saved.id,name:snapshot.character.name,system});
 expect(workspace.party[0]).not.toHaveProperty('snapshot');expect(workspace.scenes).toEqual([]);
 await expect(b.query(query('loadForEdit'),{id:saved.id,expectedSystem:system})).rejects.toThrow('CHARACTER_UNAVAILABLE');
 await expect(b.query(query('loadForEdit'),{campaignId,expectedSystem:system})).rejects.toThrow('NO_CHARACTER');
 expect((await a.query(query('loadForEdit'),{id:saved.id,expectedSystem:system})).revision).toBe(1);
 await t.run(c=>c.db.delete(memberId));
 await expect(a.query(query('loadForEdit'),{campaignId,expectedSystem:system})).rejects.toThrow('CAMPAIGN_UNAVAILABLE');
 await a.mutation(mutation('saveForEdit'),{id:saved.id,expectedRevision:1,expectedOwnerScope:owner,snapshot});
});
test('only one independent update based on a revision wins and a stale draft cannot replace it',async()=>{
 const {a,owner}=await setup(),snapshot=sw(),created=await a.mutation(mutation('saveForEdit'),{snapshot,expectedOwnerScope:owner});
 const payloads=['First','Second'].map(name=>({...snapshot,character:{...snapshot.character,name}}));
 const results=await Promise.allSettled(payloads.map(snapshot=>a.mutation(mutation('saveForEdit'),{id:created.id,expectedRevision:1,expectedOwnerScope:owner,snapshot})));
 expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 expect(results.filter(r=>r.status==='rejected')).toHaveLength(1);
 const winner=results.findIndex(r=>r.status==='fulfilled'),loaded=await a.query(query('loadForEdit'),{id:created.id,expectedSystem:'savageWorlds'});
 expect(loaded.revision).toBe(2);expect(loaded.snapshot).toEqual(payloads[winner]);
 await expect(a.mutation(mutation('saveForEdit'),{id:created.id,expectedRevision:1,expectedOwnerScope:owner,snapshot})).rejects.toThrow('CHARACTER_CONFLICT');
 expect(await a.query(query('load'),{id:created.id})).toEqual(payloads[winner]);
});
test('legacy revision zero migrates lazily and invalid revisions or changed owners never write',async()=>{
 const {t,a,b,owner,other}=await setup(),snapshot=sw();
 const id=await t.run(c=>c.db.insert('characters',{ownerId:owner,name:'Scout',snapshot,updatedAt:0}));
 expect((await a.query(query('loadForEdit'),{id,expectedSystem:'savageWorlds'})).revision).toBe(0);
 for(const expectedRevision of [undefined,-1,0.5,2])await expect(a.mutation(mutation('saveForEdit'),{id,expectedRevision,expectedOwnerScope:owner,snapshot})).rejects.toThrow();
 await expect(b.mutation(mutation('saveForEdit'),{expectedOwnerScope:owner,snapshot})).rejects.toThrow('ACCOUNT_CHANGED');
 await expect(b.mutation(mutation('saveForEdit'),{id,expectedRevision:0,expectedOwnerScope:other,snapshot})).rejects.toThrow('CHARACTER_UNAVAILABLE');
 expect(await a.mutation(mutation('saveForEdit'),{id,expectedRevision:0,expectedOwnerScope:owner,snapshot})).toMatchObject({id,revision:1});
 expect(await a.query(query('editorIdentity'),{})).toBe(owner);expect(await t.query(query('editorIdentity'),{})).toBeNull();
 await expect(t.query(query('loadForEdit'),{id,expectedSystem:'savageWorlds'})).rejects.toThrow('SIGN_IN_REQUIRED');
 await expect(t.mutation(mutation('saveForEdit'),{expectedOwnerScope:owner,snapshot})).rejects.toThrow('SIGN_IN_REQUIRED');
});
test('campaign empty/deleted/mismatched attachments and contradictory markers stay unavailable',async()=>{
 const {t,a,b,owner}=await setup(),snapshot=sw(),created=await a.mutation(mutation('saveForEdit'),{snapshot,expectedOwnerScope:owner});
 const campaignId=await b.mutation(ref<'mutation'>('privateWorkspaces:createCampaign'),{name:'Unselected'});
 await t.run(c=>c.db.insert('campaignMembers',{campaignId,userId:owner,characterId:created.id,role:'player'}));
 await expect(a.query(query('loadForEdit'),{campaignId,expectedSystem:'savageWorlds'})).rejects.toThrow('CAMPAIGN_SYSTEM_REQUIRED');
 await t.run(c=>c.db.patch(campaignId,{system:'dnd5e'}));
 await expect(a.query(query('loadForEdit'),{campaignId,expectedSystem:'dnd5e'})).rejects.toThrow('SYSTEM_MISMATCH');
 await t.run(c=>c.db.delete(created.id));
 await expect(a.query(query('loadForEdit'),{campaignId,expectedSystem:'dnd5e'})).rejects.toThrow('CHARACTER_UNAVAILABLE');
 await expect(a.query(query('loadForEdit'),{expectedSystem:'dnd5e'})).rejects.toThrow('INVALID_LOCATOR');
 await expect(a.query(query('loadForEdit'),{id:created.id,campaignId,expectedSystem:'dnd5e'})).rejects.toThrow('INVALID_LOCATOR');
 await expect(a.mutation(mutation('saveForEdit'),{expectedOwnerScope:owner,snapshot:{...snapshot,system:'dnd5e'}})).rejects.toThrow('INVALID_CHARACTER');
});
test('guarded saves preserve validators and prevent engine changes but allow Savage setting edits',async()=>{
 const {a,owner}=await setup(),snapshot=sw(),created=await a.mutation(mutation('saveForEdit'),{snapshot,expectedOwnerScope:owner});
 await expect(a.mutation(mutation('saveForEdit'),{id:created.id,expectedOwnerScope:owner,expectedRevision:1,snapshot:{version:1,system:'dnd5e',character:{...newDndCharacter(),name:'Other engine'}}})).rejects.toThrow('SYSTEM_MISMATCH');
 await expect(a.mutation(mutation('saveForEdit'),{id:created.id,expectedOwnerScope:owner,expectedRevision:1,snapshot:{...snapshot,character:{...snapshot.character,attributes:{...snapshot.character.attributes,vigor:999}}}})).rejects.toThrow('INVALID_CHARACTER');
 await a.mutation(mutation('saveForEdit'),{id:created.id,expectedOwnerScope:owner,expectedRevision:1,snapshot:sw('pathfinder')});
 expect((await a.query(query('load'),{id:created.id})).character.setting).toBe('pathfinder');
});
