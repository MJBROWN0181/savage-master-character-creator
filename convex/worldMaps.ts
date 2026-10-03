import {getAuthUserId} from '@convex-dev/auth/server';
import {mutationGeneric as mutation,queryGeneric as query,internalMutationGeneric as internalMutation,internalQueryGeneric as internalQuery,actionGeneric as action,makeFunctionReference as ref} from 'convex/server';
import {v} from 'convex/values';
import {MAP_FILE_LIMIT,MAP_WORLD_LIMIT,validMapHeader} from '../map-files.mjs';
import {newAtlas,validateAtlas,validateMapParents} from '../map-atlas.mjs';
const details={name:v.string(),category:v.string(),caption:v.string(),atlas:v.optional(v.any())};
async function ownWorld(ctx:any,worldId:any){const ownerId=await getAuthUserId(ctx),world=await ctx.db.get(worldId);if(!ownerId||!world||world.ownerId!==ownerId)throw new Error('World not found.');return ownerId;}
function checkDetails(d:{name:string;category:string;caption:string}){if(!d.name.trim()||d.name.length>160||d.category.length>160||d.caption.length>2000)throw new Error('Name your map and keep its caption under 2,000 characters.');}
export const list=query({args:{worldId:v.id('worldBuilds')},handler:async(ctx,{worldId})=>{
  await ownWorld(ctx,worldId);const rows=await ctx.db.query('worldMaps').withIndex('by_world',q=>q.eq('worldId',worldId)).collect();
  return Promise.all(rows.map(async row=>({...row,url:await ctx.storage.getUrl(row.storageId)})));
}});
export const uploadUrl=mutation({args:{worldId:v.id('worldBuilds')},handler:async(ctx,{worldId})=>{
  const ownerId=await ownWorld(ctx,worldId);
  const rows=await ctx.db.query('worldMaps').withIndex('by_world',q=>q.eq('worldId',worldId)).collect();
  if(rows.length>=50)throw new Error('This world has reached its 50-map limit.');
  const ticket=await ctx.db.insert('mapUploadTickets',{ownerId,worldId,expiresAt:Date.now()+15*60*1000});
  return {ticket,url:await ctx.storage.generateUploadUrl()};
}});
export const uploadInfo=internalQuery({args:{ticket:v.id('mapUploadTickets'),storageId:v.id('_storage')},handler:async(ctx,{ticket,storageId})=>{
  const upload=await ctx.db.get(ticket),ownerId=await getAuthUserId(ctx);
  if(!ownerId||!upload||upload.ownerId!==ownerId||upload.expiresAt<Date.now())throw new Error('Upload expired. Try again.');
  await ownWorld(ctx,upload.worldId);
  if(await ctx.db.query('worldMaps').withIndex('by_storage',q=>q.eq('storageId',storageId)).unique()||await ctx.db.query('profileMedia').withIndex('by_storage',q=>q.eq('storageId',storageId)).unique())throw new Error('File already registered.');
  const info=await ctx.db.system.get(storageId);
  if(!info||info._creationTime<upload._creationTime||info.size>MAP_FILE_LIMIT||!['image/png','image/jpeg','image/webp'].includes(info.contentType||''))throw new Error('Choose a PNG, JPEG, or WebP map up to 20 MB.');
  return {upload,info};
}});
export const attach=internalMutation({args:{ticket:v.id('mapUploadTickets'),storageId:v.id('_storage'),...details},handler:async(ctx,args)=>{
  checkDetails(args);const {upload,info}=await ctx.runQuery(ref<'query'>('worldMaps:uploadInfo'),{ticket:args.ticket,storageId:args.storageId});
  const rows=await ctx.db.query('worldMaps').withIndex('by_world',q=>q.eq('worldId',upload.worldId)).collect();
  if(rows.length>=50||rows.reduce((n,r)=>n+r.size,0)+info.size>MAP_WORLD_LIMIT)throw new Error('This world has reached its map limit: 50 maps or 200 MB.');
  const atlas=args.atlas||newAtlas(String(args.storageId));validateAtlas(atlas);
  if(rows.some(r=>(r.atlas?.id||String(r._id))===atlas.id))throw new Error('This map is already in this world.');
  validateMapParents(atlas.id,atlas,rows);
  const id=await ctx.db.insert('worldMaps',{ownerId:upload.ownerId,worldId:upload.worldId,storageId:args.storageId,name:args.name.trim(),category:args.category,caption:args.caption,size:info.size,type:info.contentType!,createdAt:Date.now(),atlas});
  await ctx.db.delete(args.ticket);return id;
}});
export const finishUpload=action({args:{ticket:v.id('mapUploadTickets'),storageId:v.id('_storage'),...details},handler:async(ctx,args):Promise<any>=>{
  checkDetails(args);const {info}=await ctx.runQuery(ref<'query'>('worldMaps:uploadInfo'),{ticket:args.ticket,storageId:args.storageId});
  const blob=await ctx.storage.get(args.storageId);
  if(!blob||!validMapHeader(new Uint8Array(await blob.slice(0,16).arrayBuffer()),info.contentType))throw new Error('The file is not a supported map image.');
  return ctx.runMutation(ref<'mutation'>('worldMaps:attach'),args);
}});
export const remove=mutation({args:{id:v.id('worldMaps')},handler:async(ctx,{id})=>{
  const row=await ctx.db.get(id);if(!row||row.ownerId!==await getAuthUserId(ctx))throw new Error('Map not found.');
  await ctx.storage.delete(row.storageId);await ctx.db.delete(id);
}});
export const updateAtlas=mutation({args:{id:v.id('worldMaps'),atlas:v.any()},handler:async(ctx,{id,atlas})=>{
  const row=await ctx.db.get(id);if(!row||row.ownerId!==await getAuthUserId(ctx))throw new Error('Map not found.');
  validateAtlas(atlas);if(atlas.id!==(row.atlas?.id||String(row._id)))throw new Error('The map identity cannot change.');
  const maps=await ctx.db.query('worldMaps').withIndex('by_world',q=>q.eq('worldId',row.worldId)).collect();validateMapParents(atlas.id,atlas,maps);
  await ctx.db.patch(id,{atlas});
}});
