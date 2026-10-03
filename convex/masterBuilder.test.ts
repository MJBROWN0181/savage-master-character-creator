import {convexTest} from 'convex-test';
import {expect,test} from 'vitest';
import {makeFunctionReference} from 'convex/server';
import schema from './schema';
import {newWorld} from '../builder-model.mjs';
const modules=import.meta.glob('./**/*.ts');
const save=makeFunctionReference<'mutation'>('masterBuilder:save'),list=makeFunctionReference<'query'>('masterBuilder:list'),load=makeFunctionReference<'query'>('masterBuilder:load');
test('worlds stay owner-only and survive private save, update, and load',async()=>{
  const t=convexTest(schema,modules),a=await t.run(ctx=>ctx.db.insert('users',{email:'builder@example.test'})),b=await t.run(ctx=>ctx.db.insert('users',{email:'other@example.test'}));
  const owner=t.withIdentity({subject:a}),other=t.withIdentity({subject:b});
  const world=newWorld();world.name='The Hidden Coast';world.rules.base='original';world.rules.name='Coastal Tales';world.secrets='The tide is alive';
  const id=await owner.mutation(save,{world});expect(await owner.query(load,{id})).toEqual(world);
  expect(await owner.query(list,{})).toMatchObject([{_id:id,name:world.name,baseRules:'Coastal Tales'}]);
  expect(await other.query(list,{})).toEqual([]);expect(await t.query(list,{})).toEqual([]);
  await expect(other.query(load,{id})).rejects.toThrow('World not found');await expect(t.query(load,{id})).rejects.toThrow('World not found');
  await expect(other.mutation(save,{id,world})).rejects.toThrow('World not found');await expect(t.mutation(save,{world})).rejects.toThrow('Sign in');
  world.premise='Travel where the tide remembers.';expect(await owner.mutation(save,{id,world})).toBe(id);expect((await owner.query(load,{id})).premise).toBe(world.premise);expect(await owner.query(list,{})).toHaveLength(1);
});
test('server requires a named world and valid rule foundation, independent of client checks',async()=>{
  const t=convexTest(schema,modules),user=await t.run(ctx=>ctx.db.insert('users',{})),owner=t.withIdentity({subject:user});
  const world=newWorld();world.name='A world';await expect(owner.mutation(save,{world})).rejects.toThrow();
  world.rules.base='other';await expect(owner.mutation(save,{world})).rejects.toThrow('Name your rule set');
  world.rules.name='My system';world.customFields=[{id:'a',label:'',value:'Hidden detail'}];await expect(owner.mutation(save,{world})).rejects.toThrow('label');
  world.customFields=[];world.rules.notes='x'.repeat(10001);await expect(owner.mutation(save,{world})).rejects.toThrow('Invalid world');
  expect(await owner.query(list,{})).toEqual([]);
});
