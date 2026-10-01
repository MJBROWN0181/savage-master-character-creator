import { getAuthUserId } from '@convex-dev/auth/server';
import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server';
import { v } from 'convex/values';
export const createCampaign=mutation({args:{name:v.string()},handler:async(ctx,{name})=>{
 const ownerId=await getAuthUserId(ctx);if(!ownerId)throw new Error('Sign in.');
 if(!name.trim()||name.length>160)throw new Error('Invalid campaign name.');
 return ctx.db.insert('campaigns',{ownerId,name:name.trim(),updatedAt:Date.now()});
}});
export const listJournals=query({args:{},handler:async(ctx)=>{
 const ownerId=await getAuthUserId(ctx);if(!ownerId)return [];
 return ctx.db.query('privateJournals').withIndex('by_owner',q=>q.eq('ownerId',ownerId)).collect();
}});
export const saveJournal=mutation({args:{id:v.optional(v.id('privateJournals')),campaignId:v.optional(v.id('campaigns')),kind:v.union(v.literal('gm'),v.literal('player')),text:v.string()},handler:async(ctx,args)=>{
 const ownerId=await getAuthUserId(ctx);if(!ownerId)throw new Error('Sign in.');
 if(!args.text.trim()||args.text.length>30000)throw new Error('Invalid journal entry.');
 if(args.id){const old=await ctx.db.get(args.id);if(!old||old.ownerId!==ownerId)throw new Error('Journal not found.');}
 if(args.campaignId){const campaign=await ctx.db.get(args.campaignId);if(!campaign)throw new Error('Campaign not found.');
 const member=await ctx.db.query('campaignMembers').withIndex('by_campaign_user',q=>q.eq('campaignId',args.campaignId!)).filter(q=>q.eq(q.field('userId'),ownerId)).unique();
 if(campaign.ownerId!==ownerId&&(!member||args.kind==='gm'&&member.role!=='gm'))throw new Error('Campaign access denied.');}
 const data={ownerId,campaignId:args.campaignId,kind:args.kind,text:args.text,updatedAt:Date.now()};
 if(args.id){await ctx.db.patch(args.id,data);return args.id;}return ctx.db.insert('privateJournals',data);
}});
