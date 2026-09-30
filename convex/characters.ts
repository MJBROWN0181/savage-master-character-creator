import { getAuthUserId } from "@convex-dev/auth/server";
import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";

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
    if (!snapshot || snapshot.version !== 1 || !snapshot.character ||
        typeof snapshot.character.name !== "string" || !snapshot.character.name.trim() ||
        JSON.stringify(snapshot).length > 200_000) throw new Error("Invalid character or backup too large.");
    const data = {
      name: snapshot.character.name.trim().slice(0, 120),
      setting: typeof snapshot.character.setting === "string" ? snapshot.character.setting : undefined,
      snapshot,
      updatedAt: Date.now(),
    };
    if (id) {
      const row = await ctx.db.get(id);
      if (!row || row.ownerId !== ownerId) throw new Error("Character not found.");
      await ctx.db.patch(id, data);
      return id;
    }
    return await ctx.db.insert("characters", { ownerId, ...data });
  },
});
