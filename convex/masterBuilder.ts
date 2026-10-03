import {getAuthUserId} from '@convex-dev/auth/server';
import {mutationGeneric as mutation,queryGeneric as query} from 'convex/server';
import {v} from 'convex/values';
import {validateWorld,ruleSetName} from '../builder-model.mjs';

export const list=query({args:{},handler:async ctx=>{
  const ownerId=await getAuthUserId(ctx);if(!ownerId)return [];
  const rows=await ctx.db.query('worldBuilds').withIndex('by_owner',q=>q.eq('ownerId',ownerId)).collect();
  return rows.sort((a,b)=>b.updatedAt-a.updatedAt).map(({_id,name,baseRules,updatedAt})=>({_id,name,baseRules,updatedAt}));
}});
export const load=query({args:{id:v.id('worldBuilds')},handler:async(ctx,{id})=>{
  const ownerId=await getAuthUserId(ctx),row=await ctx.db.get(id);
  if(!ownerId||!row||row.ownerId!==ownerId)throw new Error('World not found.');
  return row.world;
}});
export const save=mutation({args:{id:v.optional(v.id('worldBuilds')),world:v.any()},handler:async(ctx,{id,world})=>{
  const ownerId=await getAuthUserId(ctx);if(!ownerId)throw new Error('Sign in to save your world.');
  if(id){const row=await ctx.db.get(id);if(!row||row.ownerId!==ownerId)throw new Error('World not found.');}
  validateWorld(world);
  const data={ownerId,name:world.name.trim(),baseRules:ruleSetName(world),world,updatedAt:Date.now()};
  if(id){await ctx.db.patch(id,data);return id;}
  return ctx.db.insert('worldBuilds',data);
}});
