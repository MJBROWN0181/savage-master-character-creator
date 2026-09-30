import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  characters: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    setting: v.optional(v.string()),
    snapshot: v.any(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),
});
