import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  adventures:defineTable({campaignId:v.id('campaigns'),title:v.string(),updatedAt:v.number()}).index('by_campaign',['campaignId']),
  scenes:defineTable({adventureId:v.id('adventures'),title:v.string(),notes:v.string(),updatedAt:v.number()}).index('by_adventure',['adventureId']),
  campaignInvites:defineTable({campaignId:v.id('campaigns'),token:v.string(),expiresAt:v.number()}).index('by_token',['token']),
  campaigns: defineTable({ownerId:v.id('users'),name:v.string(),updatedAt:v.number()}).index('by_owner',['ownerId']),
  campaignMembers: defineTable({campaignId:v.id('campaigns'),userId:v.id('users'),role:v.union(v.literal('gm'),v.literal('player')),characterId:v.optional(v.id('characters'))}).index('by_campaign_user',['campaignId','userId']).index('by_user',['userId']),
  privateJournals: defineTable({ownerId:v.id('users'),campaignId:v.optional(v.id('campaigns')),kind:v.union(v.literal('gm'),v.literal('player')),text:v.string(),updatedAt:v.number()}).index('by_owner',['ownerId']),
  characters: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    setting: v.optional(v.string()),
    snapshot: v.any(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),
});
