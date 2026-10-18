import { getAuthUserId } from "@convex-dev/auth/server";
import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { validateCharacterSnapshot } from "./characterValidation";
import {campaignCharacter,characterSystem,editError,editRecord,validateForEdit} from './characterEditing';

const systemValidator=v.union(v.literal('savageWorlds'),v.literal('dnd5e'),v.literal('pathfinder2e'));
export const editorIdentity=query({args:{},handler:ctx=>getAuthUserId(ctx)});
export const loadForEdit=query({
 args:{id:v.optional(v.id('characters')),campaignId:v.optional(v.id('campaigns')),expectedSystem:systemValidator},
 handler:async(ctx,{id,campaignId,expectedSystem})=>{
  const ownerId=await getAuthUserId(ctx);if(!ownerId)editError('SIGN_IN_REQUIRED');
  if(Number(!!id)+Number(!!campaignId)!==1)editError('INVALID_LOCATOR');
  const row=campaignId?await campaignCharacter(ctx,campaignId,ownerId):await ctx.db.get(id!);
  if(!row||row.ownerId!==ownerId)editError('CHARACTER_UNAVAILABLE');
  if(characterSystem(row)!==expectedSystem)editError('SYSTEM_MISMATCH');
  validateForEdit(row.snapshot);return editRecord(row);
 }
});
export const saveForEdit=mutation({
 args:{id:v.optional(v.id('characters')),expectedRevision:v.optional(v.number()),expectedOwnerScope:v.id('users'),snapshot:v.any()},
 handler:async(ctx,{id,expectedRevision,expectedOwnerScope,snapshot})=>{
  const ownerId=await getAuthUserId(ctx);if(!ownerId)editError('SIGN_IN_REQUIRED');
  if(ownerId!==expectedOwnerScope)editError('ACCOUNT_CHANGED');
  const row=id?await ctx.db.get(id):null;
  if(id&&(!row||row.ownerId!==ownerId))editError('CHARACTER_UNAVAILABLE');
  if(id&&(!Number.isSafeInteger(expectedRevision)||expectedRevision!<0))editError('UPDATE_REQUIRED');
  if(row&&(row.revision??0)!==expectedRevision)editError('CHARACTER_CONFLICT');
  if(!id&&expectedRevision!==undefined)editError('INVALID_LOCATOR');
  validateForEdit(snapshot);
  const system=characterSystem({snapshot,setting:snapshot.character.setting??undefined});
  if(row&&characterSystem(row)!==system)editError('SYSTEM_MISMATCH');
  const revision=(row?.revision??0)+1,updatedAt=Date.now();
  const data={snapshot,name:snapshot.character.name.trim().slice(0,120),setting:typeof snapshot.character.setting==='string'?snapshot.character.setting:undefined,revision,updatedAt};
  if(id)await ctx.db.patch(id,data);else id=await ctx.db.insert('characters',{ownerId,...data});
  return {id,revision,updatedAt};
 }
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await getAuthUserId(ctx);
    if (!ownerId) return [];
    const rows = await ctx.db.query("characters").withIndex("by_owner", q => q.eq("ownerId", ownerId)).collect();
    return rows.map(({ _id, name, setting, updatedAt }) => ({ _id, name, setting, updatedAt }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const load = query({
  args: { id: v.id("characters") },
  handler: async (ctx, { id }) => {
    const ownerId = await getAuthUserId(ctx);
    if (!ownerId) throw new Error("Sign in to load a character.");
    const row = await ctx.db.get(id);
    if (!row || row.ownerId !== ownerId) throw new Error("Character not found.");
    return row.snapshot;
  },
});

export const save = mutation({
  args: { id: v.optional(v.id("characters")), snapshot: v.any() },
  handler: async (ctx, { id, snapshot }) => {
    const ownerId = await getAuthUserId(ctx);
    if (!ownerId) throw new Error("Sign in to save a character.");
    validateCharacterSnapshot(snapshot);
    const data = {
      name: snapshot.character.name.trim().slice(0, 120),
      setting: typeof snapshot.character.setting === "string" ? snapshot.character.setting : undefined,
      snapshot,
      updatedAt: Date.now(),
    };
    if (id) {
      const row = await ctx.db.get(id);
      if (!row || row.ownerId !== ownerId) throw new Error("Character not found.");
      editError('UPDATE_REQUIRED','Update the app before saving this character to your account. Your device draft is still here.');
    }
    return await ctx.db.insert("characters", { ownerId, ...data, revision:1 });
  },
});
