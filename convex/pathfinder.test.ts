import {convexTest} from 'convex-test';import {test,expect} from 'vitest';import {makeFunctionReference as ref} from 'convex/server';import schema from './schema';import {fresh} from '../pathfinder-model.mjs';const modules=import.meta.glob('./**/*.ts');
import equipment from '../pathfinder-data/equipment.json';
import feats from '../pathfinder-data/feats.json';

function reorder(value:any):any {
 if(Array.isArray(value))return value.map(reorder);
 return value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,reorder(value[key])])):value;
}

test('Pathfinder catalogue choices survive cloud field reordering while changed data is rejected',async()=>{
 const t=convexTest(schema,modules),owner=await t.run(ctx=>ctx.db.insert('users',{email:'pf-roundtrip@example.test'})),client=t.withIdentity({subject:owner});
 const sword=equipment.find(row=>row.name==='Longsword'),armor=equipment.find(row=>row.name==='Chain Mail'),feat=feats.find(row=>row.name==='Unconventional Weaponry');
 const character=reorder({...fresh(),name:'Cloud fighter',background:'Warrior',boosts:{ancestry:['str','con'],background:['str','dex'],class:['str'],free:['str','dex','con','wis']},weapon:sword,armor,inventory:[sword,armor],feats:[feat]});
 const snapshot={version:1,system:'pathfinder2e',character};
 const id=await client.mutation(ref<'mutation'>('characters:save'),{snapshot});
 expect(await client.query(ref<'query'>('characters:load'),{id})).toEqual(snapshot);
 const altered=structuredClone(snapshot);altered.character.feats[0].description='Changed rules';
 await expect(client.mutation(ref<'mutation'>('characters:saveForEdit'),{id,expectedOwnerScope:owner,expectedRevision:1,snapshot:altered})).rejects.toThrow('Invalid rule data');
 altered.character.feats=character.feats;altered.character.weapon.data.damage.dice=999;
 await expect(client.mutation(ref<'mutation'>('characters:saveForEdit'),{id,expectedOwnerScope:owner,expectedRevision:1,snapshot:altered})).rejects.toThrow('Invalid equipment data');
 expect(await client.query(ref<'query'>('characters:load'),{id})).toEqual(snapshot);
});
test('Pathfinder snapshots persist privately and game boundaries are enforced',async()=>{const t=convexTest(schema,modules);const gmId=await t.run(c=>c.db.insert('users',{email:'pfgm@test.example'})),playerId=await t.run(c=>c.db.insert('users',{email:'pfplayer@test.example'}));const gm=t.withIdentity({subject:gmId}),player=t.withIdentity({subject:playerId});const character={...fresh(),name:'Test',background:'Warrior',boosts:{ancestry:['str','con'],background:['str','dex'],class:['str'],free:['str','dex','con','wis']}};const characterId=await player.mutation(ref<'mutation'>('characters:save'),{snapshot:{version:1,system:'pathfinder2e',character}});expect((await player.query(ref<'query'>('characters:load'),{id:characterId})).character.setting).toBe('pathfinder2e');await expect(gm.query(ref<'query'>('characters:load'),{id:characterId})).rejects.toThrow('not found');const other=await gm.mutation(ref<'mutation'>('privateWorkspaces:createCampaign'),{name:'5e',system:'dnd5e'});const wrongToken=await gm.mutation(ref<'mutation'>('campaigns:invite'),{campaignId:other});await expect(player.mutation(ref<'mutation'>('campaigns:join'),{token:wrongToken,characterId})).rejects.toThrow('game system');const campaignId=await gm.mutation(ref<'mutation'>('privateWorkspaces:createCampaign'),{name:'PF',system:'pathfinder2e'});const token=await gm.mutation(ref<'mutation'>('campaigns:invite'),{campaignId});await player.mutation(ref<'mutation'>('campaigns:join'),{token,characterId});expect((await player.query(ref<'query'>('campaigns:workspace'),{campaignId})).system).toBe('pathfinder2e');});
