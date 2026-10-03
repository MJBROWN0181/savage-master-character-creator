import { query, mutation, internalQuery, internalMutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { memberIdentity } from './communityAccess';
import { reviewedAuthor, mutuallyBlocked } from './chronicleVisibility';
export const categories = ['Custom Art', 'Game Master Hires', 'Campaigns', 'One Shots', 'Maps & Tokens', 'Books & Accessories', 'Other'];
const games = ['Any tabletop game', 'Savage Worlds', 'Dungeons & Dragons 5e', 'Pathfinder 2e'];
async function visible(ctx: any, row: any, viewer: any) {
  if (!row || row.hidden || await mutuallyBlocked(ctx, viewer, row.ownerId)) return null;
  const p = await reviewedAuthor(ctx, row.ownerId);
  if (!p) return null;
  return { _id: row._id, title: row.title, description: row.description, category: row.category, game: row.game, price: row.price, contactUrl: row.contactUrl,
    imageUrl: row.imageId ? await ctx.storage.getUrl(row.imageId) : null, imageId: viewer === row.ownerId ? row.imageId : undefined, status: row.status, createdAt: row.createdAt, mine: viewer === row.ownerId,
    seller: { handle: p.handle, name: p.publicSnapshot.displayName || p.handle } };
}
export const list = query({ args: { category: v.optional(v.string()), before: v.optional(v.union(v.string(), v.null())) }, handler: async (ctx, a) => {
  const viewer = await getAuthUserId(ctx);
  const query = a.category && a.category !== 'All sections' ? ctx.db.query('bazaarListings').withIndex('by_category', q => q.eq('category', a.category!)) : ctx.db.query('bazaarListings').withIndex('by_created');
  const page = await query.order('desc').paginate({ numItems: 24, cursor: a.before || null });
  const rows = [];
  for (const row of page.page) {
    if (row.status === 'closed' && row.ownerId !== viewer) continue;
    const item = await visible(ctx, row, viewer);
    if (item) rows.push(item);
  }
  return { rows, next: page.isDone ? null : page.continueCursor };
} });
export const save = mutation({ args: { id: v.optional(v.id('bazaarListings')), title: v.string(), description: v.string(), category: v.string(), game: v.string(), price: v.string(), contactUrl: v.optional(v.string()), imageId: v.optional(v.id('_storage')) }, handler: async (ctx, a) => {
  const ownerId = await memberIdentity(ctx), old = a.id ? await ctx.db.get(a.id) : null;
  if (a.id && (!old || old.ownerId !== ownerId || old.hidden)) throw new Error('Only edit your own available listing.');
  if (!a.title.trim() || a.title.length > 100 || !a.description.trim() || a.description.length > 2000 || !a.price.trim() || a.price.length > 80 || !categories.includes(a.category) || !games.includes(a.game)) throw new Error('Choose a section and add a title, description, and price or terms.');
  if (a.contactUrl) {
    let url; try { url = new URL(a.contactUrl); } catch { throw new Error('Use a valid HTTPS contact link.'); }
    if (url.protocol !== 'https:' || url.username || url.password || a.contactUrl.length > 500) throw new Error('Use a valid HTTPS contact link.');
  }
  if (a.imageId) {
    const media = await ctx.db.query('profileMedia').withIndex('by_storage', q => q.eq('storageId', a.imageId!)).unique();
    if (!media || media.ownerId !== ownerId) throw new Error('Upload your own listing image.');
  }
  const rows = await ctx.db.query('bazaarListings').withIndex('by_owner', q => q.eq('ownerId', ownerId)).order('desc').take(50);
  const open = await ctx.db.query('bazaarListings').withIndex('by_owner_status', q => q.eq('ownerId',ownerId).eq('status','open')).filter(q=>q.eq(q.field('hidden'),false)).take(20);
  if (!old && (open.length >= 20 || rows.some(r => Date.now()-r.createdAt < 60000))) throw new Error('Post up to 20 open listings and wait a minute between new ads.');
  const data = { title: a.title.trim(), description: a.description.trim(), category: a.category, game: a.game, price: a.price.trim(), contactUrl: a.contactUrl || undefined, imageId: a.imageId, updatedAt: Date.now() };
  if (old) { await ctx.db.patch(old._id, data); return old._id; }
  return ctx.db.insert('bazaarListings', { ...data, ownerId, status: 'open', createdAt: Date.now(), hidden: false });
} });
export const close = mutation({ args: { id: v.id('bazaarListings'), closed: v.boolean() }, handler: async (ctx, a) => {
  const ownerId = await memberIdentity(ctx), row = await ctx.db.get(a.id);
  if (!row || row.ownerId !== ownerId || row.hidden) throw new Error('Only change your own listing.');
  if (!a.closed) {
    const rows = await ctx.db.query('bazaarListings').withIndex('by_owner_status', q => q.eq('ownerId', ownerId).eq('status','open')).filter(q=>q.eq(q.field('hidden'),false)).take(20);
    if (row.status === 'closed' && rows.length >= 20) throw new Error('Close another listing before reopening this one.');
  }
  await ctx.db.patch(a.id, { status: a.closed ? 'closed' : 'open', updatedAt: Date.now() });
} });
export const report = mutation({ args: { id: v.id('bazaarListings'), reason: v.string() }, handler: async (ctx, a) => {
  const ownerId = await getAuthUserId(ctx);
  if (!ownerId) throw new Error('Sign in to report a listing.');
  if (!a.reason.trim() || a.reason.length > 500 || !await visible(ctx, await ctx.db.get(a.id), ownerId)) throw new Error('Describe the concern in up to 500 characters.');
  const old = await ctx.db.query('bazaarReports').withIndex('by_listing_owner', q => q.eq('listingId', a.id).eq('ownerId', ownerId)).unique();
  if (!old) await ctx.db.insert('bazaarReports', { listingId: a.id, ownerId, reason: a.reason.trim(), createdAt: Date.now() });
} });
export const reports = internalQuery({ args: {}, handler: ctx => ctx.db.query('bazaarReports').order('desc').take(100) });
export const moderate = internalMutation({ args: { id: v.id('bazaarListings'), hidden: v.boolean() }, handler: (ctx, a) => ctx.db.patch(a.id, { hidden: a.hidden }) });
