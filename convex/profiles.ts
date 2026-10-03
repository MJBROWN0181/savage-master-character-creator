import { getAuthUserId } from "@convex-dev/auth/server";
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { makeFunctionReference as ref } from "convex/server";
import { profileFrame, isProfileAdmin } from './profileFrames';

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
  communityAccepted: v.optional(v.boolean()),
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
      frame: (await profileFrame(ctx, p.ownerId)).active,
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
    if (!old && !a.communityAccepted)
      throw new Error("Accept the community rules to submit your new profile for review.");
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
    const { ageConfirmed, communityAccepted, ...draft } = a;
    const now = Date.now();
    const data = {
      ...draft,
      avatarId: a.avatarId,
      backgroundId: a.backgroundId,
      handle,
      ownerId,
      ageConfirmedAt: old?.ageConfirmedAt || Date.now(),
      updatedAt: Math.max(Date.now(), (old?.updatedAt || 0) + 1),
      reviewStatus: old?.reviewStatus || ("pending" as const),
    };
    if (old) {
      await ctx.db.patch(old._id, data);
      return old._id;
    }
    const profileId = await ctx.db.insert("profiles", {
      ...data, reviewRequestedAt: now, reviewNotification: "pending",
    });
    await ctx.scheduler.runAfter(0, ref<"action", any>("profileReviewEmail:notify"), {
      profileId, requestedAt: now, attempt: 0,
    });
    return profileId;
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
    if (p.reviewStatus === "pending") return p.handle;
    if (p.reviewRequestedAt && Date.now() - p.reviewRequestedAt < 60000)
      throw new Error("Please wait a minute before requesting another review.");
    const requestedAt = Math.max(Date.now(), (p.reviewRequestedAt || 0) + 1);
    await ctx.db.patch(p._id, {
      reviewStatus: "pending",
      publicSnapshot: undefined,
      reviewRequestedAt: requestedAt,
      reviewNotification: "pending",
      reviewNote: undefined,
    });
    await ctx.scheduler.runAfter(0, ref<"action", any>("profileReviewEmail:notify"), {
      profileId: p._id, requestedAt, attempt: 0,
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
      frame: (await profileFrame(ctx, p.ownerId)).active,
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
export const deleteProfile = mutation({
  args: { confirmation: v.string() },
  handler: async (ctx, { confirmation }) => {
    const ownerId = await getAuthUserId(ctx);
    if (!ownerId) throw new Error('Sign in to delete your profile.');
    const p = await ctx.db.query('profiles').withIndex('by_owner', q => q.eq('ownerId', ownerId)).unique();
    if (!p || p.official || confirmation !== p.handle) throw new Error('Type your exact profile handle to confirm deletion.');
    await ctx.db.delete(p._id);
    await ctx.scheduler.runAfter(0, ref<'mutation', any>('profileCleanup:run'), { ownerId, before: Date.now() });
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
async function reviewer(ctx: any) {
  const id = await getAuthUserId(ctx);
  if (!id) return null;
  const user = await ctx.db.get(id);
  const allowed = (process.env.PROFILE_REVIEWER_EMAILS || process.env.BUG_EDITOR_EMAILS || "")
    .split(",").map(email => email.trim().toLowerCase()).filter(Boolean);
  if (!user?.emailVerificationTime || !user.email) return null;
  const email = user.email.trim().toLowerCase();
  const grant = await ctx.db.query("profileReviewTeam").withIndex("by_email", (q: any) => q.eq("email", email)).unique();
  const admins = (process.env.PROFILE_MODERATOR_ADMIN_EMAILS || process.env.BUG_EDITOR_EMAILS || process.env.PROFILE_REVIEWER_EMAILS || "")
    .split(",").map(email => email.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email) || admins.includes(email) || (grant && grant.revokedAt === undefined) ? id : null;
}
async function moderationAdmin(ctx: any) {
  const id = await getAuthUserId(ctx);
  if (!id) return null;
  return await isProfileAdmin(ctx, id) ? id : null;
}
export const canReview = query({ args: {}, handler: async ctx => !!await reviewer(ctx) });
export const canManageReviewers = query({ args: {}, handler: async ctx => !!await moderationAdmin(ctx) });
export const reviewTeam = query({
  args: {}, handler: async ctx => {
    if (!await moderationAdmin(ctx)) throw new ConvexError("Only moderation administrators can manage the team.");
    return (await ctx.db.query("profileReviewTeam").take(100)).map(({ email, grantedAt, revokedAt }) => ({ email, grantedAt, revokedAt }));
  },
});
export const setReviewerAccess = mutation({
  args: { email: v.string(), enabled: v.boolean() },
  handler: async (ctx, { email: input, enabled }) => {
    const adminId = await moderationAdmin(ctx);
    if (!adminId) throw new ConvexError("Only moderation administrators can manage the team.");
    const email = input.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ConvexError("Enter a valid helper email address.");
    const configured = [process.env.PROFILE_MODERATOR_ADMIN_EMAILS, process.env.PROFILE_REVIEWER_EMAILS, process.env.BUG_EDITOR_EMAILS]
      .filter(Boolean).join(",").split(",").map(email => email.trim().toLowerCase());
    if (configured.includes(email)) throw new ConvexError("This account's access is managed in the server settings.");
    const existing = await ctx.db.query("profileReviewTeam").withIndex("by_email", q => q.eq("email", email)).unique();
    if (enabled) {
      if (existing?.revokedAt === undefined && existing) return;
      if (!existing && (await ctx.db.query("profileReviewTeam").take(100)).length >= 100) throw new ConvexError("The moderation team limit has been reached.");
      const grant = { email, grantedBy: adminId, grantedAt: Date.now(), revokedAt: undefined };
      if (existing) await ctx.db.patch(existing._id, grant);
      else await ctx.db.insert("profileReviewTeam", grant);
    } else if (existing && existing.revokedAt === undefined) {
      await ctx.db.patch(existing._id, { revokedAt: Date.now() });
    }
  },
});
export const pendingReviews = query({
  args: { profileId: v.optional(v.string()) },
  handler: async (ctx, { profileId }) => {
    const reviewerId = await reviewer(ctx);
    if (!reviewerId) throw new ConvexError("Only verified profile reviewers can open this queue.");
    const id = profileId ? ctx.db.normalizeId("profiles", profileId) : null;
    const selected = id ? await ctx.db.get(id) : null;
    const rows = profileId ? selected?.reviewStatus === "pending" ? [selected] : [] : await ctx.db.query("profiles")
      .withIndex("by_review", q => q.eq("reviewStatus", "pending")).take(100);
    return Promise.all(rows.map(async p => ({
      ...await snapshot(ctx, p),
      _id: p._id, updatedAt: p.updatedAt, reviewRequestedAt: p.reviewRequestedAt,
      reviewNotification: p.reviewNotification,
      isOwnProfile: p.ownerId === reviewerId,
      avatarUrl: p.avatarId ? await ctx.storage.getUrl(p.avatarId) : null,
      backgroundUrl: p.backgroundId ? await ctx.storage.getUrl(p.backgroundId) : null,
      favorites: await Promise.all(p.favorites.map(async f => ({
        name: (await ctx.db.get(f.characterId))?.name || "Character",
        imageUrl: f.imageId ? await ctx.storage.getUrl(f.imageId) : null,
      }))),
    })));
  },
});
export const decideReview = mutation({
  args: { profileId: v.id("profiles"), expectedUpdatedAt: v.number(),
    expectedRequestedAt: v.optional(v.number()), approve: v.boolean(), note: v.string() },
  handler: async (ctx, a) => {
    const reviewerId = await reviewer(ctx);
    if (!reviewerId) throw new ConvexError("Only verified profile reviewers can make this decision.");
    const p = await ctx.db.get(a.profileId);
    if (!p || p.reviewStatus !== "pending" || p.updatedAt !== a.expectedUpdatedAt || p.reviewRequestedAt !== a.expectedRequestedAt)
      throw new ConvexError("Profile changed; review the current draft.");
    if (p.ownerId === reviewerId) throw new ConvexError("Another reviewer must review your own profile.");
    if (a.note.trim().length > 500 || (!a.approve && !a.note.trim()))
      throw new ConvexError("Explain the requested changes in up to 500 characters.");
    await ctx.db.patch(p._id, {
      reviewStatus: a.approve ? "approved" : "rejected",
      publicSnapshot: a.approve ? await snapshot(ctx, p) : undefined,
      reviewNote: a.approve ? undefined : a.note.trim(),
    });
    await ctx.db.insert("profileModerationLog", { profileId: p._id, reviewerId, action: a.approve ? "approved" : "changes_requested", note: a.note.trim(), createdAt: Date.now() });
  },
});
// Repair missing legacy notices and retry failed delivery without publishing the profile.
export const resendReviewNotice = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    if (!await reviewer(ctx)) throw new ConvexError("Only verified profile reviewers can send review notices.");
    const p = await ctx.db.get(profileId);
    if (!p || p.reviewStatus !== "pending") throw new ConvexError("This profile is no longer awaiting review.");
    if (p.reviewNotification === "sent") throw new ConvexError("The review email has already been sent.");
    const elapsed = Date.now() - (p.reviewRequestedAt || 0);
    if (p.reviewRequestedAt && elapsed < 60000) throw new ConvexError("Please wait a minute before sending another review email.");
    if (p.reviewNotification === "pending" && p.reviewRequestedAt && elapsed < 600000)
      throw new ConvexError("The review email is still being delivered. Please try again later.");
    const requestedAt = Math.max(Date.now(), (p.reviewRequestedAt || 0) + 1);
    await ctx.db.patch(profileId, { reviewRequestedAt: requestedAt, reviewNotification: "pending" });
    await ctx.scheduler.runAfter(0, ref<"action", any>("profileReviewEmail:notify"), { profileId, requestedAt, attempt: 0 });
  },
});
export const reviewNotificationInfo = internalQuery({
  args: { profileId: v.id("profiles"), requestedAt: v.number() },
  handler: async (ctx, a) => {
    const p = await ctx.db.get(a.profileId);
    if (!p || p.reviewStatus !== "pending" || p.reviewRequestedAt !== a.requestedAt || p.reviewNotification === "sent") return null;
    return { handle: p.handle };
  },
});
export const markReviewNotification = internalMutation({
  args: { profileId: v.id("profiles"), requestedAt: v.number(),
    status: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed"), v.literal("unconfigured")) },
  handler: async (ctx, a) => {
    const p = await ctx.db.get(a.profileId);
    if (p?.reviewRequestedAt === a.requestedAt && p.reviewNotification !== "sent")
      await ctx.db.patch(p._id, { reviewNotification: a.status });
  },
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
export const reportedReviews = query({
  args: {},
  handler: async ctx => {
    if (!await reviewer(ctx)) throw new ConvexError("Only verified profile reviewers can open reports.");
    const reports = await ctx.db.query("profileReports").withIndex("by_resolution_created", q => q.eq("resolvedAt", undefined)).order("desc").take(100);
    const profileIds = [...new Set(reports.map(report => report.profileId))];
    return Promise.all(profileIds.map(async profileId => {
      const p = await ctx.db.get(profileId);
      const s = p?.publicSnapshot;
      return {
        profileId, updatedAt: p?.updatedAt, handle: p?.handle || "Removed profile",
        isPublic: p?.reviewStatus === "approved" && !!s,
        reports: reports.filter(report => report.profileId === profileId).map(({ _id, reason, createdAt }) => ({ _id, reason, createdAt })),
        // Inspect the published version, never unrelated edits in the owner's draft.
        profile: s ? { ...s,
          avatarUrl: s.avatarId ? await ctx.storage.getUrl(s.avatarId) : null,
          backgroundUrl: s.backgroundId ? await ctx.storage.getUrl(s.backgroundId) : null,
          favorites: await Promise.all(s.favorites.map(async (f: any) => ({ name: f.name, imageUrl: f.imageId ? await ctx.storage.getUrl(f.imageId) : null }))),
        } : null,
      };
    }));
  },
});
export const resolveReports = mutation({
  args: { profileId: v.id("profiles"), expectedUpdatedAt: v.optional(v.number()), reportIds: v.array(v.id("profileReports")), hide: v.boolean(), note: v.string() },
  handler: async (ctx, a) => {
    const reviewerId = await reviewer(ctx);
    if (!reviewerId) throw new ConvexError("Only verified profile reviewers can resolve reports.");
    const p = await ctx.db.get(a.profileId);
    if (p?.updatedAt !== a.expectedUpdatedAt) throw new ConvexError("Profile changed; inspect the current public version.");
    const note = a.note.trim();
    if (note.length > 500 || (a.hide && !note)) throw new ConvexError("Explain the requested changes in up to 500 characters.");
    if (!a.reportIds.length || a.reportIds.length > 100) throw new ConvexError("Select the reports you reviewed.");
    const reports = await Promise.all(a.reportIds.map(id => ctx.db.get(id)));
    if (reports.some(report => !report || report.profileId !== a.profileId || report.resolvedAt !== undefined))
      throw new ConvexError("Reports changed; refresh the report queue.");
    if (a.hide) {
      if (!p || p.reviewStatus !== "approved" || !p.publicSnapshot) throw new ConvexError("This profile is already private.");
      await ctx.db.patch(p._id, { reviewStatus: "rejected", publicSnapshot: undefined, reviewNote: note });
    }
    const resolvedAt = Date.now();
    for (const report of reports) await ctx.db.patch(report!._id, { resolvedAt, resolvedBy: reviewerId, resolution: a.hide ? "hidden" : "dismissed" });
    await ctx.db.insert("profileModerationLog", { profileId: a.profileId, reviewerId, action: a.hide ? "hidden" : "reports_dismissed", note, createdAt: resolvedAt });
  },
});
export const moderationHistory = query({
  args: {}, handler: async ctx => {
    if (!await moderationAdmin(ctx)) throw new ConvexError("Only moderation administrators can view decision history.");
    const rows = await ctx.db.query("profileModerationLog").withIndex("by_created").order("desc").take(100);
    return Promise.all(rows.map(async row => ({ action: row.action, note: row.note, createdAt: row.createdAt,
      handle: (await ctx.db.get(row.profileId))?.handle || "Removed profile",
      reviewerEmail: (await ctx.db.get(row.reviewerId))?.email || "Removed account",
    })));
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
    if (old && old.resolvedAt === undefined) throw new Error("You have already reported this profile.");
    if (old) {
      await ctx.db.patch(old._id, { reason: a.reason, createdAt: Date.now(), resolvedAt: undefined, resolvedBy: undefined, resolution: undefined });
      return;
    }
    await ctx.db.insert("profileReports", {
      profileId: p._id,
      reporterId,
      reason: a.reason,
      createdAt: Date.now(),
    });
  },
});
