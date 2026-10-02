import {convexTest} from 'convex-test';
import {expect,test} from 'vitest';
import {makeFunctionReference as ref} from 'convex/server';
import schema from './schema';
const modules=import.meta.glob('./**/*.ts');
test('campaign invitations attach only owned characters and keep GM scenes private',async()=>{
 const t=convexTest(schema,modules);
 const gmId=await t.run(c=>c.db.insert('users',{email:'gm@test.example'})),playerId=await t.run(c=>c.db.insert('users',{email:'player@test.example'}));
 const gm=t.withIdentity({subject:gmId}),player=t.withIdentity({subject:playerId});
 const campaignId=await gm.mutation(ref<'mutation'>('privateWorkspaces:createCampaign'),{name:'Test campaign'});
 const adventureId=await gm.mutation(ref<'mutation'>('campaigns:addAdventure'),{campaignId,title:'Test adventure'});
 await gm.mutation(ref<'mutation'>('campaigns:saveScene'),{adventureId,title:'Secret',notes:'Hidden villain'});
 await expect(player.query(ref<'query'>('campaigns:workspace'),{campaignId})).rejects.toThrow('access denied');
 const characterId=await t.run(c=>c.db.insert('characters',{ownerId:playerId,name:'Hero',snapshot:{},updatedAt:Date.now()}));
 const token=await gm.mutation(ref<'mutation'>('campaigns:invite'),{campaignId});
 await expect(gm.mutation(ref<'mutation'>('campaigns:join'),{token,characterId})).rejects.toThrow('own saved character');
 await player.mutation(ref<'mutation'>('campaigns:join'),{token,characterId});
 const workspace=await player.query(ref<'query'>('campaigns:workspace'),{campaignId});
 expect(workspace.scenes).toEqual([]);expect(workspace.party[0].characterName).toBe('Hero');
 expect((await player.query(ref<'query'>('campaigns:list'),{})).length).toBe(1);
 await expect(player.mutation(ref<'mutation'>('campaigns:addAdventure'),{campaignId,title:'Denied'})).rejects.toThrow('access denied');
 await expect(player.mutation(ref<'mutation'>('campaigns:join'),{token,characterId})).rejects.toThrow('expired or invalid');
});

test('campaign systems persist and reject mismatched characters without consuming invitations',async()=>{const t=convexTest(schema,modules);const gmId=await t.run(c=>c.db.insert('users',{email:'systemgm@test.example'})),playerId=await t.run(c=>c.db.insert('users',{email:'systemplayer@test.example'}));const gm=t.withIdentity({subject:gmId}),player=t.withIdentity({subject:playerId});const campaignId=await gm.mutation(ref<'mutation'>('privateWorkspaces:createCampaign'),{name:'5e campaign',system:'dnd5e'});expect((await gm.query(ref<'query'>('campaigns:workspace'),{campaignId})).system).toBe('dnd5e');const wrong=await t.run(c=>c.db.insert('characters',{ownerId:playerId,name:'Wrong',setting:'Core SWADE',snapshot:{},updatedAt:0}));const correct=await t.run(c=>c.db.insert('characters',{ownerId:playerId,name:'Right',setting:'dnd5e',snapshot:{},updatedAt:0}));const token=await gm.mutation(ref<'mutation'>('campaigns:invite'),{campaignId});await expect(player.mutation(ref<'mutation'>('campaigns:join'),{token,characterId:wrong})).rejects.toThrow('game system');await player.mutation(ref<'mutation'>('campaigns:join'),{token,characterId:correct});await expect(player.mutation(ref<'mutation'>('campaigns:setSystem'),{campaignId,system:'savageWorlds'})).rejects.toThrow('access denied');await expect(gm.mutation(ref<'mutation'>('campaigns:setSystem'),{campaignId,system:'savageWorlds'})).rejects.toThrow('already has');});
