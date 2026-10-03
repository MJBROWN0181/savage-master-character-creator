import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { publicPost, visiblePost } from './chronicleVisibility';
import { memberIdentity, activeMember } from './communityAccess';
const games = [
  "Any tabletop game",
  "Savage Worlds",
  "Dungeons & Dragons 5e",
  "Pathfinder 2e",
];
const kinds = ["Session tale", "Epic roll", "Character moment", "Table memory"];
async function author(ctx: any, id: any) {
  const p = await ctx.db
    .query("profiles")
    .withIndex("by_owner", (q: any) => q.eq("ownerId", id))
    .unique();
  return p?.reviewStatus === "approved" && p.publicSnapshot ? p : null;
}
async function blocked(ctx: any, a: any, b: any) {
  if (!a) return false;
  for (const [x, y] of [
    [a, b],
    [b, a],
  ])
    if (
      await ctx.db
        .query("friendBlocks")
        .withIndex("by_owner_blocked", (q: any) =>
          q.eq("ownerId", x).eq("blockedId", y),
        )
        .unique()
    )
      return true;
  return false;
}
async function identity(ctx: any) {
  const id = await getAuthUserId(ctx);
  if (!id) throw new Error("Sign in to join the Chronicles.");
  return id;
}
async function visibleTome(ctx: any, p: any, viewer: any) {
  if (!p.tomeId) return true;
  const t = await ctx.db.get(p.tomeId);
  return !!(
    t &&
    !t.hidden &&
    (await author(ctx, t.ownerId)) &&
    !(await blocked(ctx, viewer, t.ownerId))
  );
}
async function preferences(ctx: any, id: any) {
  return ctx.db
    .query("chroniclePreferences")
    .withIndex("by_owner", (q: any) => q.eq("ownerId", id))
    .unique();
}
export const following = query({
  args: {},
  handler: async (ctx) => {
    const id = await getAuthUserId(ctx);
    if (!id) return { allowFollowers: true, handles: [] };
    const rows = await ctx.db
        .query("chronicleFollows")
        .withIndex("by_owner", (q) => q.eq("ownerId", id))
        .collect(),
      handles = [];
    for (const row of rows) {
      const p = await author(ctx, row.targetId);
      if (
        p &&
        (await preferences(ctx, row.targetId))?.allowFollowers !== false &&
        !(await blocked(ctx, id, row.targetId))
      )
        handles.push(p.handle);
    }
    return {
      allowFollowers: (await preferences(ctx, id))?.allowFollowers !== false,
      handles,
    };
  },
});
export const setFollowers = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, { enabled }) => {
    const ownerId = await identity(ctx),
      p = await preferences(ctx, ownerId);
    if (p) await ctx.db.patch(p._id, { allowFollowers: enabled });
    else
      await ctx.db.insert("chroniclePreferences", {
        ownerId,
        allowFollowers: enabled,
      });
  },
});
export const follow = mutation({
  args: { handle: v.string(), enabled: v.boolean() },
  handler: async (ctx, { handle, enabled }) => {
    const ownerId = await identity(ctx),
      p = await ctx.db
        .query("profiles")
        .withIndex("by_handle", (q) => q.eq("handle", handle))
        .unique();
    if (
      !p ||
      !(await author(ctx, p.ownerId)) ||
      p.ownerId === ownerId ||
      (await blocked(ctx, ownerId, p.ownerId))
    )
      throw new Error("This player is unavailable.");
    const old = await ctx.db
      .query("chronicleFollows")
      .withIndex("by_owner_target", (q) =>
        q.eq("ownerId", ownerId).eq("targetId", p.ownerId),
      )
      .unique();
    if (!enabled) {
      if (old) await ctx.db.delete(old._id);
      return;
    }
    if ((await preferences(ctx, p.ownerId))?.allowFollowers === false)
      throw new Error("This player has followers turned off.");
    if (
      (
        await ctx.db
          .query("chronicleFollows")
          .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
          .take(200)
      ).length >= 200 &&
      !old
    )
      throw new Error("You can follow up to 200 storytellers.");
    if (!old)
      await ctx.db.insert("chronicleFollows", { ownerId, targetId: p.ownerId });
  },
});
export const tomes = query({
  args: {},
  handler: async (ctx) => {
    const id = await getAuthUserId(ctx),
      rows = await ctx.db.query("chronicleTomes").order("desc").take(100),
      result = [];
    for (const r of rows) {
      const p = await author(ctx, r.ownerId);
      if (r.hidden || !p || (await blocked(ctx, id, r.ownerId))) continue;
      const member = id
        ? await ctx.db
            .query("chronicleMembers")
            .withIndex("by_tome_owner", (q) =>
              q.eq("tomeId", r._id).eq("ownerId", id),
            )
            .unique()
        : null;
      const links = (p.publicSnapshot.links || []).filter(
        (l: any) => l.kind === "shop" && /^https?:\/\//i.test(l.url),
      );
      if (r.visibility === 'private' && (!member || member.status === 'invited')) continue;
      result.push({
        _id: r._id,
        name: r.name,
        description: r.description,
        joined: !!member,
        owner: id === r.ownerId,
        creator: p.publicSnapshot.displayName || p.handle,
        shops: links,
      });
    }
    return result;
  },
});
export const createTome = mutation({
  args: { name: v.string(), description: v.string() },
  handler: async () => {
    throw new Error('Found a Guild from the Guilds page and invite three other reviewed profiles.');
  },
});
export const join = mutation({
  args: { id: v.id("chronicleTomes"), enabled: v.boolean() },
  handler: async (ctx, { id, enabled }) => {
    const ownerId = await identity(ctx),
      t = await ctx.db.get(id);
    if (
      !t ||
      t.hidden ||
      !(await author(ctx, t.ownerId)) ||
      (await blocked(ctx, ownerId, t.ownerId))
    )
      throw new Error("Tome unavailable.");
    if (t.ownerId === ownerId) return;
    if (t.visibility) await memberIdentity(ctx);
    const old = await ctx.db
      .query("chronicleMembers")
      .withIndex("by_tome_owner", (q) =>
        q.eq("tomeId", id).eq("ownerId", ownerId),
      )
      .unique();
    if (t.visibility === 'private' && !old) throw new Error("An invitation is required for this private Guild.");
    if (enabled && old?.status === 'invited') throw new Error('Accept your invitation from the Guild page.');
    if (enabled && !old)
      await ctx.db.insert("chronicleMembers", { tomeId: id, ownerId });
    if (!enabled && old) await ctx.db.delete(old._id);
  },
});
export const feed = query({
  args: {
    before: v.optional(v.union(v.string(), v.null())),
    tomeId: v.optional(v.id("chronicleTomes")),
    following: v.optional(v.boolean()),
    authorHandle: v.optional(v.string()),
  },
  handler: async (ctx, { before, tomeId, following, authorHandle }) => {
    const viewer = await getAuthUserId(ctx);
    const target = authorHandle ? await ctx.db.query('profiles').withIndex('by_handle', q => q.eq('handle', authorHandle)).unique() : null;
    if (authorHandle && (!target || !await author(ctx, target.ownerId) || await blocked(ctx, viewer, target.ownerId))) return {posts: [], next: null};
    const page = await (target ? ctx.db.query('chroniclePosts').withIndex('by_owner', q => q.eq('ownerId', target.ownerId)) : ctx.db.query('chroniclePosts').withIndex('by_created'))
      .order("desc")
      .paginate({ numItems: 25, cursor: before ?? null });
    const rows = page.page,
      posts = [];
    for (const r of rows) {
      if (
        r.hidden ||
        (await blocked(ctx, viewer, r.ownerId)) ||
        (tomeId && r.tomeId !== tomeId)
      )
        continue;
      if (r.tomeId) {
        const t = await ctx.db.get(r.tomeId);
        if (
          !t ||
          t.hidden ||
          !(await author(ctx, t.ownerId)) ||
          (await blocked(ctx, viewer, t.ownerId))
        )
          continue;
      }
      if (following) {
        if (
          !viewer ||
          (await preferences(ctx, r.ownerId))?.allowFollowers === false ||
          !(await ctx.db
            .query("chronicleFollows")
            .withIndex("by_owner_target", (q) =>
              q.eq("ownerId", viewer).eq("targetId", r.ownerId),
            )
            .unique())
        )
          continue;
      }
      const post = await publicPost(ctx, r, viewer);
      if (post) posts.push(post);
    }
    return { posts, next: page.isDone ? null : page.continueCursor };
  },
});
export const post = query({
  args: { id: v.string() },
  handler: async (ctx, {id}) => {
    const normalized = ctx.db.normalizeId('chroniclePosts', id);
    if (!normalized) return null;
    const row = await ctx.db.get(normalized);
    return row ? publicPost(ctx, row, await getAuthUserId(ctx)) : null;
  },
});
export const eligibility = query({
  args: {},
  handler: async (ctx) => {
    const id = await getAuthUserId(ctx);
    return !!(id && (await author(ctx, id)));
  },
});
export const profileFollowing = query({ args: { handle: v.string() }, handler: async (ctx, { handle }) => {
  const viewer = await getAuthUserId(ctx);
  const p = await ctx.db.query('profiles').withIndex('by_handle',q => q.eq('handle',handle)).unique();
  if (!p || (viewer !== p.ownerId && !await author(ctx,p.ownerId)) || await blocked(ctx,viewer,p.ownerId)) return [];
  const rows = await ctx.db.query('chronicleFollows').withIndex('by_owner',q => q.eq('ownerId',p.ownerId)).take(200), result = [];
  for (const row of rows) {
    const target = await author(ctx,row.targetId);
    if (!target || (await preferences(ctx,row.targetId))?.allowFollowers === false || await blocked(ctx,viewer,row.targetId) || await blocked(ctx,p.ownerId,row.targetId)) continue;
    result.push({ handle: target.handle, name: target.publicSnapshot.displayName || target.handle, official: target.official === 'bug' });
  }
  return result;
} });
export const share = mutation({ args: { id: v.id('chroniclePosts') }, handler: async (ctx, { id }) => {
  const ownerId = await identity(ctx);
  if (!await author(ctx, ownerId)) throw new Error('Complete profile review before sharing to Around the Fire.');
  const row = await ctx.db.get(id), publicData = row ? await publicPost(ctx, row, ownerId) : null;
  if (!publicData?.public) throw new Error('Only available public posts can be shared.');
  const originalId = row!.originalPostId || id;
  const original = await ctx.db.get(originalId);
  if (!original || !await publicPost(ctx, original, null)) throw new Error('This public post is unavailable.');
  const old = await ctx.db.query('chroniclePosts').withIndex('by_original_owner', q => q.eq('originalPostId', originalId).eq('ownerId', ownerId)).unique();
  if (old && !old.hidden) return old._id;
  const recent = await ctx.db.query('chroniclePosts').withIndex('by_owner', q => q.eq('ownerId', ownerId)).order('desc').take(20);
  if (recent.some(p => Date.now()-p.createdAt < 30000) || recent.filter(p => Date.now()-p.createdAt < 86400000).length >= 20) throw new Error('Please wait between public posts.');
  if (old) { await ctx.db.patch(old._id,{hidden:false,createdAt:Date.now()}); return old._id; }
  return ctx.db.insert('chroniclePosts',{ownerId,originalPostId:originalId,title:'',body:'',game:original.game,kind:'Shared update',toastCount:0,hidden:false,createdAt:Date.now()});
} });
export const publish = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    game: v.string(),
    kind: v.string(),
    consent: v.boolean(),
    tomeId: v.optional(v.id("chronicleTomes")),
  },
  handler: async (ctx, args) => {
    const ownerId = await identity(ctx);
    if (!(await author(ctx, ownerId)))
      throw new Error(
        "Complete your public-profile review before sharing a tale.",
      );
    const title = args.title.trim(),
      body = args.body.trim();
    if (!args.consent)
      throw new Error("Confirm that this story is yours to share.");
    if (
      !title ||
      title.length > 100 ||
      !body ||
      body.length > 2000 ||
      !games.includes(args.game) ||
      !kinds.includes(args.kind)
    )
      throw new Error("Check your title, story, and category.");
    if (args.tomeId) {
      const membership = await ctx.db.query('chronicleMembers').withIndex('by_tome_owner', q => q.eq('tomeId', args.tomeId!).eq('ownerId', ownerId)).unique();
      const t = await ctx.db.get(args.tomeId);
      if (
        !t ||
        t.hidden ||
        !(await author(ctx, t.ownerId)) ||
        (await blocked(ctx, ownerId, t.ownerId)) ||
        !membership || membership.status === 'invited'
      )
        throw new Error("Join this Guild before posting.");
      if (t.visibility) await activeMember(ctx, args.tomeId);
    }
    const latest = await ctx.db
      .query("chroniclePosts")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .order("desc")
      .take(20);
    if (
      latest.some((p) => Date.now() - p.createdAt < 30000) ||
      latest.filter((p) => Date.now() - p.createdAt < 86400000).length >= 20
    )
      throw new Error("Let the tale settle. Please try again later.");
    return ctx.db.insert("chroniclePosts", {
      ownerId,
      title,
      body,
      game: args.game,
      kind: args.kind,
      tomeId: args.tomeId,
      createdAt: Date.now(),
      toastCount: 0,
      hidden: false,
    });
  },
});
export const toast = mutation({
  args: { id: v.id("chroniclePosts") },
  handler: async (ctx, { id }) => {
    const ownerId = await identity(ctx),
      p = await ctx.db.get(id);
    if (
      !p ||
      p.hidden ||
      !(await author(ctx, p.ownerId)) ||
      (await blocked(ctx, ownerId, p.ownerId)) ||
      !(await visiblePost(ctx, p, ownerId))
    )
      throw new Error("This tale is unavailable.");
    const old = await ctx.db
      .query("chronicleToasts")
      .withIndex("by_post_owner", (q) =>
        q.eq("postId", id).eq("ownerId", ownerId),
      )
      .unique();
    if (old) await ctx.db.delete(old._id);
    else await ctx.db.insert("chronicleToasts", { postId: id, ownerId });
    await ctx.db.patch(id, {
      toastCount: Math.max(0, p.toastCount + (old ? -1 : 1)),
    });
  },
});
export const remove = mutation({
  args: { id: v.id("chroniclePosts") },
  handler: async (ctx, { id }) => {
    const owner = await identity(ctx),
      p = await ctx.db.get(id);
    if (!p || p.ownerId !== owner)
      throw new Error("You can only remove your own tales.");
    await ctx.db.patch(id, { hidden: true });
  },
});
export const report = mutation({
  args: { id: v.id("chroniclePosts"), reason: v.string() },
  handler: async (ctx, { id, reason }) => {
    const ownerId = await identity(ctx),
      p = await ctx.db.get(id);
    if (
      !p ||
      p.hidden ||
      (await blocked(ctx, ownerId, p.ownerId)) ||
      !(await author(ctx, p.ownerId)) ||
      !(await visiblePost(ctx, p, ownerId))
    )
      throw new Error("This tale is unavailable.");
    if (!reason.trim() || reason.length > 500)
      throw new Error("Add a short reason for your report.");
    const old = await ctx.db
      .query("chronicleReports")
      .withIndex("by_post_owner", (q) =>
        q.eq("postId", id).eq("ownerId", ownerId),
      )
      .unique();
    if (!old)
      await ctx.db.insert("chronicleReports", {
        postId: id,
        ownerId,
        reason: reason.trim(),
        createdAt: Date.now(),
      });
  },
});

// Site team reviews reports in the Convex dashboard. No public moderation endpoint.
export const reports = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("chronicleReports").order("desc").take(100);
    return Promise.all(
      rows.map(async (r) => ({ ...r, post: await ctx.db.get(r.postId) })),
    );
  },
});
export const moderate = internalMutation({
  args: { id: v.id("chroniclePosts"), hidden: v.boolean() },
  handler: async (ctx, { id, hidden }) => {
    if (!(await ctx.db.get(id))) throw new Error("Tale unavailable.");
    await ctx.db.patch(id, { hidden });
  },
});
export const archiveTome = mutation({
  args: { id: v.id("chronicleTomes") },
  handler: async (ctx, { id }) => {
    const ownerId = await identity(ctx),
      t = await ctx.db.get(id);
    if (!t || t.ownerId !== ownerId)
      throw new Error("Only the Tome owner can close it.");
    await ctx.db.patch(id, { hidden: true });
  },
});
export const moderateTome = internalMutation({
  args: { id: v.id("chronicleTomes") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { hidden: true });
  },
});

export const reportTome = mutation({
  args: { id: v.id("chronicleTomes"), reason: v.string() },
  handler: async (ctx, { id, reason }) => {
    const ownerId = await identity(ctx),
      t = await ctx.db.get(id);
    if (
      !t ||
      t.hidden ||
      !(await author(ctx, t.ownerId)) ||
      (await blocked(ctx, ownerId, t.ownerId))
    )
      throw new Error("Tome unavailable.");
    if (!reason.trim() || reason.length > 500)
      throw new Error("Add a short reason.");
    const old = await ctx.db
      .query("chronicleTomeReports")
      .withIndex("by_tome_owner", (q) =>
        q.eq("tomeId", id).eq("ownerId", ownerId),
      )
      .unique();
    if (!old)
      await ctx.db.insert("chronicleTomeReports", {
        tomeId: id,
        ownerId,
        reason: reason.trim(),
        createdAt: Date.now(),
      });
  },
});
export const tomeReports = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("chronicleTomeReports")
      .order("desc")
      .take(100);
    return Promise.all(
      rows.map(async (r) => ({ ...r, tome: await ctx.db.get(r.tomeId) })),
    );
  },
});
