import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  supportTickets: defineTable({
    ownerId: v.optional(v.id('users')), requestId: v.string(), reference: v.string(),
    kind: v.union(v.literal('bug'), v.literal('help')), title: v.string(), body: v.string(), email: v.string(), diagnostics: v.optional(v.string()),
    status: v.union(v.literal('open'), v.literal('in_progress'), v.literal('resolved')),
    createdAt: v.number(), updatedAt: v.number(), reply: v.optional(v.string()),
    notification: v.union(v.literal('pending'), v.literal('sent'), v.literal('failed'), v.literal('unconfigured')),
  }).index('by_owner_created', ['ownerId', 'createdAt']).index('by_email_created', ['email', 'createdAt']).index('by_created', ['createdAt']).index('by_request', ['requestId']),
  chronicleTomeReports: defineTable({tomeId:v.id("chronicleTomes"),ownerId:v.id("users"),reason:v.string(),createdAt:v.number()}).index("by_tome_owner",["tomeId","ownerId"]),

  chroniclePreferences: defineTable({ownerId:v.id("users"),allowFollowers:v.boolean()}).index("by_owner",["ownerId"]),
  chronicleFollows: defineTable({ownerId:v.id("users"),targetId:v.id("users")}).index("by_owner_target",["ownerId","targetId"]).index("by_owner",["ownerId"]).index('by_target',['targetId']),
  chronicleTomes: defineTable({ownerId:v.id("users"),name:v.string(),description:v.string(),createdAt:v.number(),hidden:v.optional(v.boolean()),visibility:v.optional(v.union(v.literal('public'),v.literal('private')))}).index("by_owner",["ownerId"]),
  chronicleMembers: defineTable({tomeId:v.id("chronicleTomes"),ownerId:v.id("users"),status:v.optional(v.union(v.literal('invited'),v.literal('accepted')))}).index("by_tome_owner",["tomeId","ownerId"]).index('by_owner',['ownerId']),
  guildMessages: defineTable({guildId:v.id('chronicleTomes'),ownerId:v.id('users'),body:v.string(),createdAt:v.number(),requestId:v.string(),hidden:v.optional(v.boolean())}).index('by_guild_created',['guildId','createdAt']).index('by_owner_request',['ownerId','requestId']).index('by_owner_created',['ownerId','createdAt']),
  guildEvents: defineTable({guildId:v.id('chronicleTomes'),ownerId:v.id('users'),title:v.string(),description:v.string(),startsAt:v.number(),endsAt:v.number(),timezone:v.string(),cancelled:v.boolean(),createdAt:v.number()}).index('by_guild_start',['guildId','startsAt']).index('by_owner',['ownerId']),
  guildRsvps: defineTable({eventId:v.id('guildEvents'),ownerId:v.id('users'),choice:v.union(v.literal('going'),v.literal('maybe'))}).index('by_event_owner',['eventId','ownerId']).index('by_owner',['ownerId']),
  bazaarListings: defineTable({ownerId:v.id('users'),category:v.string(),game:v.string(),title:v.string(),description:v.string(),price:v.string(),contactUrl:v.optional(v.string()),imageId:v.optional(v.id('_storage')),status:v.union(v.literal('open'),v.literal('closed')),createdAt:v.number(),updatedAt:v.number(),hidden:v.boolean()}).index('by_created',['createdAt']).index('by_owner',['ownerId']).index('by_category',['category','createdAt']).index('by_owner_status',['ownerId','status']),
  bazaarReports: defineTable({listingId:v.id('bazaarListings'),ownerId:v.id('users'),reason:v.string(),createdAt:v.number()}).index('by_listing_owner',['listingId','ownerId']),

  chroniclePosts: defineTable({originalPostId:v.optional(v.id("chroniclePosts")),publicationKey:v.optional(v.string()),publishedBy:v.optional(v.id("users")),ownerId:v.id("users"),title:v.string(),body:v.string(),game:v.string(),kind:v.string(),tomeId:v.optional(v.id("chronicleTomes")),createdAt:v.number(),toastCount:v.number(),hidden:v.boolean()}).index("by_created",["createdAt"]).index("by_owner",["ownerId"]).index("by_publication",["publicationKey"]).index("by_original_owner",["originalPostId","ownerId"]),
  chronicleToasts: defineTable({postId:v.id("chroniclePosts"),ownerId:v.id("users")}).index("by_post_owner",["postId","ownerId"]),
  chronicleReports: defineTable({postId:v.id("chroniclePosts"),ownerId:v.id("users"),reason:v.string(),createdAt:v.number()}).index("by_post_owner",["postId","ownerId"]),

  billingSubscriptions: defineTable({
    ownerId: v.id('users'), tier: v.union(v.literal('chronicle'), v.literal('storykeeper')),
    environment: v.union(v.literal('sandbox'), v.literal('live')), planId: v.string(),
    requestId: v.string(), status: v.string(), createdAt: v.number(),
    subscriptionId: v.optional(v.string()), approvalUrl: v.optional(v.string()),
    paidThrough: v.optional(v.number()), paymentId: v.optional(v.string()),
    syncedAt: v.optional(v.number()), syncStartedAt: v.optional(v.number()),
  }).index('by_owner', ['ownerId']).index('by_subscription', ['subscriptionId']).index('by_payment', ['paymentId']),
  billingEvents: defineTable({eventId: v.string(), receivedAt: v.number()}).index('by_event', ['eventId']),
  billingPaymentBlocks: defineTable({transactionId: v.string(), createdAt: v.number()}).index('by_transaction', ['transactionId']),
  worldBuilds:defineTable({ownerId:v.id('users'),name:v.string(),baseRules:v.string(),world:v.any(),updatedAt:v.number()}).index('by_owner',['ownerId']),
  worldMaps:defineTable({ownerId:v.id('users'),worldId:v.id('worldBuilds'),storageId:v.id('_storage'),name:v.string(),category:v.string(),caption:v.string(),size:v.number(),type:v.string(),createdAt:v.number(),atlas:v.optional(v.any())}).index('by_world',['worldId']).index('by_storage',['storageId']),
  mapUploadTickets:defineTable({ownerId:v.id('users'),worldId:v.id('worldBuilds'),expiresAt:v.number()}),
  friendships:defineTable({pair:v.string(),senderId:v.id('users'),recipientId:v.id('users'),status:v.union(v.literal('pending'),v.literal('accepted'),v.literal('declined')),createdAt:v.number(),updatedAt:v.number()}).index('by_pair',['pair']).index('by_sender',['senderId']).index('by_recipient',['recipientId']),
  friendBlocks:defineTable({ownerId:v.id('users'),blockedId:v.id('users')}).index('by_owner_blocked',['ownerId','blockedId']).index('by_owner',['ownerId']),
  profiles: defineTable({official:v.optional(v.literal("bug")),ownerId:v.id('users'),handle:v.string(),displayName:v.string(),bio:v.string(),games:v.array(v.string()),memory:v.string(),roles:v.array(v.union(v.literal('player'),v.literal('gm'))),links:v.array(v.object({label:v.string(),url:v.string(),kind:v.union(v.literal('social'),v.literal('shop'))})),favorites:v.array(v.object({characterId:v.id('characters'),imageId:v.optional(v.id('_storage'))})),highlights:v.array(v.object({journalId:v.id('privateJournals'),excerpt:v.string()})),avatarId:v.optional(v.id('_storage')),backgroundId:v.optional(v.id('_storage')),appearance:v.object({background:v.string(),accent:v.string(),font:v.string(),layout:v.string(),sections:v.array(v.string())}),ageConfirmedAt:v.number(),updatedAt:v.number(),reviewRequestedAt:v.optional(v.number()),reviewNotification:v.optional(v.union(v.literal('pending'),v.literal('sent'),v.literal('failed'),v.literal('unconfigured'))),reviewNote:v.optional(v.string()),reviewStatus:v.union(v.literal('private'),v.literal('pending'),v.literal('approved'),v.literal('rejected')),publicSnapshot:v.optional(v.any())}).index('by_owner',['ownerId']).index('by_handle',['handle']).index('by_review',['reviewStatus']),
  profileMedia: defineTable({ownerId:v.id('users'),storageId:v.id('_storage'),createdAt:v.number()}).index('by_storage',['storageId']).index('by_owner',['ownerId']),
  profileReports: defineTable({profileId:v.id('profiles'),reporterId:v.id('users'),reason:v.string(),createdAt:v.number()}).index('by_profile_reporter',['profileId','reporterId']),
  adventures:defineTable({campaignId:v.id('campaigns'),title:v.string(),updatedAt:v.number()}).index('by_campaign',['campaignId']),
  scenes:defineTable({adventureId:v.id('adventures'),title:v.string(),notes:v.string(),updatedAt:v.number()}).index('by_adventure',['adventureId']),
  campaignInvites:defineTable({campaignId:v.id('campaigns'),token:v.string(),expiresAt:v.number()}).index('by_token',['token']),
  campaigns: defineTable({ownerId:v.id('users'),name:v.string(),system:v.optional(v.union(v.literal('dnd5e'),v.literal('savageWorlds'),v.literal('pathfinder2e'))),updatedAt:v.number()}).index('by_owner',['ownerId']),
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
