import { getAuthUserId } from "@convex-dev/auth/server";
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";

const appearance = v.object({
  background: v.string(),
  accent: v.string(),
  font: v.string(),
  layout: v.string(),
  sections: v.array(v.string()),
});
const details = {
  handle: v.string(),
  displayName: v.string(),
  bio: v.string(),
  games: v.array(v.string()),
  memory: v.string(),
  roles: v.array(v.union(v.literal("player"), v.literal("gm"))),
  links: v.array(
    v.object({
      label: v.string(),
      url: v.string(),
      kind: v.union(v.literal("social"), v.literal("shop")),
    }),
  ),
  favorites: v.array(
    v.object({
      characterId: v.id("characters"),
      imageId: v.optional(v.id("_storage")),
    }),
  ),
  highlights: v.array(
    v.object({ journalId: v.id("privateJournals"), excerpt: v.string() }),
  ),
  avatarId: v.optional(v.id("_storage")),
  backgroundId: v.optional(v.id("_storage")),
  appearance,
  ageConfirmed: v.boolean(),
};
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const id = await getAuthUserId(ctx);
    if (!id) return null;
    const p = await ctx.db
      .query("profiles")
      .withIndex("by_owner", (q) => q.eq("ownerId", id))
      .unique();
    if (!p) return null;
    return {
      ...p,
      avatarUrl: p.avatarId ? await ctx.storage.getUrl(p.avatarId) : null,
      backgroundUrl: p.backgroundId
        ? await ctx.storage.getUrl(p.backgroundId)
        : null,
      favorites: await Promise.all(
        p.favorites.map(async (f) => ({
          ...f,
          imageUrl: f.imageId ? await ctx.storage.getUrl(f.imageId) : null,
        })),
      ),
    };
  },
});
export const journalChoices = query({
  args: {},
  handler: async (ctx) => {
    const id = await getAuthUserId(ctx);
    if (!id) return [];
    return (
      await ctx.db
        .query("privateJournals")
        .withIndex("by_owner", (q) => q.eq("ownerId", id))
        .collect()
    )
      .filter((j) => j.kind === "player")
      .map((j) => ({ _id: j._id, text: j.text, updatedAt: j.updatedAt }));
  },
});
export const save = mutation({
  args: details,
  handler: async (ctx, a) => {
    const ownerId = await getAuthUserId(ctx);
    if (!ownerId) throw new Error("Sign in to edit your profile.");
    const old = await ctx.db
      .query("profiles")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .unique();
    if (!old && !a.ageConfirmed)
      throw new Error("Confirm you are 18 or older to create a profile.");
    const handle = a.handle.trim().toLowerCase();
    if (handle === 'bug' || old?.official === 'bug')
      throw new Error('Bug is the official site companion. Choose another profile address.');
    if (!/^[a-z0-9][a-z0-9-]{2,29}$/.test(handle))
      throw new Error(
        "Use 3–30 letters, numbers, or hyphens for your profile address.",
      );
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle))
      .unique();
    if (existing && existing.ownerId !== ownerId)
      throw new Error("That profile address is taken.");
    if (old && old.handle !== handle)
      throw new Error("Your profile address stays fixed.");
    if (
      a.displayName.length > 80 ||
      a.bio.length > 600 ||
      a.memory.length > 1500 ||
      a.games.length > 20 ||
      a.games.some((g) => g.length > 80) ||
      a.links.length > 12 ||
      a.favorites.length > 6 ||
      a.highlights.length > 6
    )
      throw new Error("Keep your profile within the displayed limits.");
    if (a.roles.length > 2 || new Set(a.roles).size !== a.roles.length)
      throw new Error("Choose each role once.");
    if (
      new Set(a.favorites.map((f) => f.characterId)).size !==
        a.favorites.length ||
      new Set(a.highlights.map((h) => h.journalId)).size !== a.highlights.length
    )
      throw new Error("Choose each character or journal entry once.");
    for (const link of a.links) {
      let url;
      try {
        url = new URL(link.url);
      } catch {
        throw new Error("Use a valid HTTPS link.");
      }
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        link.url.length > 500 ||
        !link.label.trim() ||
        link.label.length > 60
      )
        throw new Error("Use labelled HTTPS links without passwords.");
    }
    const options = {
      background: ["midnight", "forest", "parchment"],
      accent: ["gold", "teal", "rose"],
      font: ["classic", "modern", "book"],
      layout: ["balanced", "stacked", "showcase"],
    };
    for (const k of Object.keys(options) as (keyof typeof options)[])
      if (!options[k].includes(a.appearance[k]))
        throw new Error("Choose a supported appearance.");
    if (
      a.appearance.sections.length !== 5 ||
      new Set(a.appearance.sections).size !== 5 ||
      a.appearance.sections.some(
        (s) =>
          !["about", "games", "memory", "characters", "journal"].includes(s),
      )
    )
      throw new Error("Invalid section order.");
    for (const f of a.favorites) {
      const c = await ctx.db.get(f.characterId);
      if (!c || c.ownerId !== ownerId)
        throw new Error("Feature your own saved characters.");
    }
    for (const h of a.highlights) {
      const j = await ctx.db.get(h.journalId);
      if (
        !j ||
        j.ownerId !== ownerId ||
        j.kind !== "player" ||
        !h.excerpt.trim() ||
        h.excerpt.length > 800 ||
        !j.text.includes(h.excerpt)
      )
        throw new Error(
          "Choose an excerpt from your own player journal. GM notes remain private.",
        );
    }
    for (const storageId of [
      a.avatarId,
      a.backgroundId,
      ...a.favorites.map((f) => f.imageId),
    ].filter(Boolean)) {
      const media = await ctx.db
        .query("profileMedia")
        .withIndex("by_storage", (q) => q.eq("storageId", storageId!))
        .unique();
      if (!media || media.ownerId !== ownerId)
        throw new Error("Upload your own profile images.");
    }
    const { ageConfirmed, ...draft } = a;
    const data = {
      ...draft,
      avatarId: a.avatarId,
      backgroundId: a.backgroundId,
      handle,
      ownerId,
      ageConfirmedAt: old?.ageConfirmedAt || Date.now(),
      updatedAt: Math.max(Date.now(), (old?.updatedAt || 0) + 1),
      reviewStatus:
        old?.reviewStatus === "pending"
          ? ("private" as const)
          : old?.reviewStatus || ("private" as const),
    };
    if (old) {
      await ctx.db.patch(old._id, data);
      return old._id;
    }
    return ctx.db.insert("profiles", data);
  },
});
export const uploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const id = await getAuthUserId(ctx);
    if (!id) throw new Error("Sign in to upload.");
    const recent = await ctx.db
      .query("profileMedia")
      .withIndex("by_owner", (q) => q.eq("ownerId", id))
      .collect();
    if (recent.filter((m) => m.createdAt > Date.now() - 86400000).length >= 20)
      throw new Error("Daily profile upload limit reached.");
    return ctx.storage.generateUploadUrl();
  },
});
export const registerMedia = internalMutation({
  args: { ownerId: v.id("users"), storageId: v.id("_storage") },
  handler: async (ctx, a) => {
    const old = await ctx.db
      .query("profileMedia")
      .withIndex("by_storage", (q) => q.eq("storageId", a.storageId))
      .unique();
    if (old && old.ownerId !== a.ownerId)
      throw new Error("Image already belongs to another account.");
    if (!old)
      await ctx.db.insert("profileMedia", { ...a, createdAt: Date.now() });
  },
});
export const mediaInfo = internalQuery({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => ctx.db.system.get(storageId),
});
async function snapshot(ctx: any, p: any) {
  return {
    handle: p.handle,
    displayName: p.displayName,
    bio: p.bio,
    games: p.games,
    memory: p.memory,
    roles: p.roles,
    links: p.links,
    appearance: p.appearance,
    avatarId: p.avatarId,
    backgroundId: p.backgroundId,
    favorites: await Promise.all(
      p.favorites.map(async (f: any) => ({
        name: (await ctx.db.get(f.characterId))?.name || "Character",
        imageId: f.imageId,
      })),
    ),
    highlights: p.highlights.map((h: any) => ({ excerpt: h.excerpt })),
  };
}
export const requestReview = mutation({
  args: {},
  handler: async (ctx) => {
    const id = await getAuthUserId(ctx);
    if (!id) throw new Error("Sign in.");
    const p = await ctx.db
      .query("profiles")
      .withIndex("by_owner", (q) => q.eq("ownerId", id))
      .unique();
    if (!p) throw new Error("Save your profile first.");
    await ctx.db.patch(p._id, {
      reviewStatus: "pending",
      publicSnapshot: undefined,
    });
    return p.handle;
  },
});
// Internal only: publish exactly the reviewed draft. Account owners cannot approve themselves.
export const moderate = internalMutation({
  args: {
    profileId: v.id("profiles"),
    expectedUpdatedAt: v.number(),
    approve: v.boolean(),
  },
  handler: async (ctx, a) => {
    const p = await ctx.db.get(a.profileId);
    if (
      !p ||
      p.reviewStatus !== "pending" ||
      p.updatedAt !== a.expectedUpdatedAt
    )
      throw new Error("Profile changed; review the current draft.");
    await ctx.db.patch(p._id, {
      reviewStatus: a.approve ? "approved" : "rejected",
      publicSnapshot: a.approve ? await snapshot(ctx, p) : undefined,
    });
  },
});
export const publicProfile = query({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    const p = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle))
      .unique();
    if (!p || p.reviewStatus !== "approved" || !p.publicSnapshot) return null;
    const s = p.publicSnapshot;
    return {
      ...s,
      official: p.official === 'bug' ? 'bug' : undefined,
      avatarUrl: p.official === 'bug' ? '/images/art/the-bug.png' : s.avatarId ? await ctx.storage.getUrl(s.avatarId) : null,
      backgroundUrl: s.backgroundId
        ? await ctx.storage.getUrl(s.backgroundId)
        : null,
      favorites: await Promise.all(
        s.favorites.map(async (f: any) => ({
          name: f.name,
          imageUrl: f.imageId ? await ctx.storage.getUrl(f.imageId) : null,
        })),
      ),
      avatarId: undefined,
      backgroundId: undefined,
    };
  },
});
export const unpublish = mutation({
  args: {},
  handler: async (ctx) => {
    const id = await getAuthUserId(ctx);
    if (!id) throw new Error("Sign in.");
    const p = await ctx.db
      .query("profiles")
      .withIndex("by_owner", (q) => q.eq("ownerId", id))
      .unique();
    if (p)
      await ctx.db.patch(p._id, {
        reviewStatus: "private",
        publicSnapshot: undefined,
      });
  },
});
export const reviewQueue = internalQuery({
  args: {},
  handler: async (ctx) =>
    Promise.all(
      (
        await ctx.db
          .query("profiles")
          .withIndex("by_review", (q) => q.eq("reviewStatus", "pending"))
          .collect()
      ).map(async (p) => ({
        ...p,
        avatarUrl: p.avatarId ? await ctx.storage.getUrl(p.avatarId) : null,
        backgroundUrl: p.backgroundId
          ? await ctx.storage.getUrl(p.backgroundId)
          : null,
        favorites: await Promise.all(
          p.favorites.map(async (f) => ({
            ...f,
            imageUrl: f.imageId ? await ctx.storage.getUrl(f.imageId) : null,
          })),
        ),
      })),
    ),
});
export const withdraw = internalMutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    await ctx.db.patch(profileId, {
      reviewStatus: "rejected",
      publicSnapshot: undefined,
    });
  },
});
export const report = mutation({
  args: { handle: v.string(), reason: v.string() },
  handler: async (ctx, a) => {
    const reporterId = await getAuthUserId(ctx);
    if (!reporterId) throw new Error("Sign in to report a profile.");
    if (!a.reason.trim() || a.reason.length > 1000)
      throw new Error("Describe the issue in up to 1,000 characters.");
    const p = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", a.handle))
      .unique();
    if (!p || p.reviewStatus !== "approved")
      throw new Error("Profile unavailable.");
    const old = await ctx.db
      .query("profileReports")
      .withIndex("by_profile_reporter", (q) =>
        q.eq("profileId", p._id).eq("reporterId", reporterId),
      )
      .unique();
    if (old) throw new Error("You have already reported this profile.");
    await ctx.db.insert("profileReports", {
      profileId: p._id,
      reporterId,
      reason: a.reason,
      createdAt: Date.now(),
    });
  },
});
