import {ConvexError} from 'convex/values';
import type {QueryCtx} from './_generated/server';
import type {Doc,Id} from './_generated/dataModel';
import {validateCharacterSnapshot} from './characterValidation';

export type CharacterSystem='savageWorlds'|'dnd5e'|'pathfinder2e';
export function editError(code:string,message=code):never {throw new ConvexError({code,message});}
export function characterSystem(row:{setting?:string;snapshot:any}):CharacterSystem {
 const explicit=row.snapshot?.system;
 if(explicit!==undefined&&!['savageWorlds','dnd5e','pathfinder2e'].includes(explicit))editError('SYSTEM_MISMATCH');
 const markers=[row.setting,row.snapshot?.character?.setting].filter(x=>x!==undefined);
 const systems=markers.map(x=>x==='dnd5e'||x==='pathfinder2e'?x:'savageWorlds');
 const system=explicit||systems[0]||'savageWorlds';
 if(systems.some(s=>s!==system))editError('SYSTEM_MISMATCH');
 return system;
}
export function validateForEdit(snapshot:any){
 try{validateCharacterSnapshot(snapshot);}catch(error){editError('INVALID_CHARACTER',error instanceof Error?error.message:'Invalid character.');}
}
export async function campaignCharacter(ctx:Pick<QueryCtx,'db'>,campaignId:Id<'campaigns'>,ownerId:Id<'users'>){
 const campaign=await ctx.db.get(campaignId);
 const member=await ctx.db.query('campaignMembers').withIndex('by_campaign_user',q=>q.eq('campaignId',campaignId).eq('userId',ownerId)).unique();
 if(!campaign||(campaign.ownerId!==ownerId&&!member))editError('CAMPAIGN_UNAVAILABLE');
 if(!campaign.system)editError('CAMPAIGN_SYSTEM_REQUIRED');
 if(!member?.characterId)editError('NO_CHARACTER');
 const row=await ctx.db.get(member.characterId);
 if(!row||row.ownerId!==ownerId)editError('CHARACTER_UNAVAILABLE');
 if(characterSystem(row)!==campaign.system)editError('SYSTEM_MISMATCH');
 return row;
}
export async function myCharacterSummary(ctx:Pick<QueryCtx,'db'>,campaignId:Id<'campaigns'>,ownerId:Id<'users'>){
 try{const row=await campaignCharacter(ctx,campaignId,ownerId);validateForEdit(row.snapshot);return {state:'ready',id:row._id,name:row.name,system:characterSystem(row)};}
 catch(error){if(error instanceof ConvexError)return {state:(error.data as {code:string}).code};throw error;}
}
export function editRecord(row:Doc<'characters'>){return {id:row._id,ownerScope:row.ownerId,system:characterSystem(row),revision:row.revision??0,updatedAt:row.updatedAt,snapshot:row.snapshot};}
