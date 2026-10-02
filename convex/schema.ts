import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  friendships:defineTable({pair:v.string(),senderId:v.id('users'),recipientId:v.id('users'),status:v.union(v.literal('pending'),v.literal('accepted'),v.literal('declined')),createdAt:v.number(),updatedAt:v.number()}).index('by_pair',['pair']).index('by_sender',['senderId']).index('by_recipient',['recipientId']),
  friendBlocks:defineTable({ownerId:v.id('users'),blockedId:v.id('users')}).index('by_owner_blocked',['ownerId','blockedId']).index('by_owner',['ownerId']),
  profiles: defineTable({ownerId:v.id('users'),handle:v.string(),displayName:v.string(),bio:v.string(),games:v.array(v.string()),memory:v.string(),roles:v.array(v.union(v.literal('player'),v.literal('gm'))),links:v.array(v.object({label:v.string(),url:v.string(),kind:v.union(v.literal('social'),v.literal('shop'))})),favorites:v.array(v.object({characterId:v.id('characters'),imageId:v.optional(v.id('_storage'))})),highlights:v.array(v.object({journalId:v.id('privateJournals'),excerpt:v.string()})),avatarId:v.optional(v.id('_storage')),backgroundId:v.optional(v.id('_storage')),appearance:v.object({background:v.string(),accent:v.string(),font:v.string(),layout:v.string(),sections:v.array(v.string())}),ageConfirmedAt:v.number(),updatedAt:v.number(),reviewStatus:v.union(v.literal('private'),v.literal('pending'),v.literal('approved'),v.literal('rejected')),publicSnapshot:v.optional(v.any())}).index('by_owner',['ownerId']).index('by_handle',['handle']).index('by_review',['reviewStatus']),
  profileMedia: defineTable({ownerId:v.id('users'),storageId:v.id('_storage'),createdAt:v.number()}).index('by_storage',['storageId']).index('by_owner',['ownerId']),
  profileReports: defineTable({profileId:v.id('profiles'),reporterId:v.id('users'),reason:v.string(),createdAt:v.number()}).index('by_profile_reporter',['profileId','reporterId']),
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
