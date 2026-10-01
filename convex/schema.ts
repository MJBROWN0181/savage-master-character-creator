import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  campaigns: defineTable({ownerId:v.id('users'),name:v.string(),updatedAt:v.number()}).index('by_owner',['ownerId']),
  campaignMembers: defineTable({campaignId:v.id('campaigns'),userId:v.id('users'),role:v.union(v.literal('gm'),v.literal('player'))}).index('by_campaign_user',['campaignId','userId']),
  privateJournals: defineTable({ownerId:v.id('users'),campaignId:v.optional(v.id('campaigns')),kind:v.union(v.literal('gm'),v.literal('player')),text:v.string(),updatedAt:v.number()}).index('by_owner',['ownerId']),
  characters: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    setting: v.optional(v.string()),
    snapshot: v.any(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),
});
