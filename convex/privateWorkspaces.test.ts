import {convexTest} from 'convex-test';
import {expect,test} from 'vitest';
import {makeFunctionReference} from 'convex/server';
import schema from './schema';
const modules=import.meta.glob('./**/*.ts');
const create=makeFunctionReference<'mutation'>('privateWorkspaces:createCampaign');
const save=makeFunctionReference<'mutation'>('privateWorkspaces:saveJournal');
const list=makeFunctionReference<'query'>('privateWorkspaces:listJournals');
test('private journals remain author-only even for a campaign GM',async()=>{
 const t=convexTest(schema,modules);const a=await t.run(ctx=>ctx.db.insert('users',{email:'gm@example.test'}));const b=await t.run(ctx=>ctx.db.insert('users',{email:'player@example.test'}));const gm=t.withIdentity({subject:a}),player=t.withIdentity({subject:b});
 const campaign=await gm.mutation(create,{name:'Private game'});
 await expect(player.mutation(save,{campaignId:campaign,kind:'gm',text:'Unauthorized'})).rejects.toThrow('access denied');
 await t.run(ctx=>ctx.db.insert('campaignMembers',{campaignId:campaign,userId:b,role:'player'}));
 const entry=await player.mutation(save,{campaignId:campaign,kind:'player',text:'Personal memory'});
 expect(await gm.query(list,{})).toEqual([]);expect(await t.query(list,{})).toEqual([]);
 await expect(gm.mutation(save,{id:entry,campaignId:campaign,kind:'gm',text:'Overwrite'})).rejects.toThrow('Journal not found');
 await expect(player.mutation(save,{campaignId:campaign,kind:'gm',text:'Still denied'})).rejects.toThrow('access denied');
 await expect(t.mutation(save,{kind:'player',text:'Guest'})).rejects.toThrow('Sign in');
});
