import { getAuthUserId } from '@convex-dev/auth/server';
import type { QueryCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';

function ownerEmails() {
  return (process.env.PROFILE_MODERATOR_ADMIN_EMAILS || process.env.BUG_EDITOR_EMAILS || process.env.PROFILE_REVIEWER_EMAILS || '')
    .split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
}
export async function isModerationOwner(ctx: QueryCtx, id: Id<'users'>) {
  const user = await ctx.db.get(id);
  if (!user?.emailVerificationTime || user.communityPausedAt !== undefined) return false;
  const owner = await ctx.db.query('moderationOwners').withIndex('by_key', q => q.eq('key', 'primary')).unique();
  return owner ? owner.userId === id : ownerEmails().includes(user.email?.trim().toLowerCase() || '');
}
export async function moderationRole(ctx: QueryCtx, id: Id<'users'>, includePaused = false): Promise<'owner' | 'admin' | 'moderator' | 'member'> {
  const user = await ctx.db.get(id);
  if (!user?.emailVerificationTime || (!includePaused && user.communityPausedAt !== undefined)) return 'member';
  if (await isModerationOwner(ctx, id)) return 'owner';
  const email = user.email?.trim().toLowerCase() || '';
  const grant = await ctx.db.query('profileReviewTeam').withIndex('by_user', q => q.eq('userId', id)).unique()
    || (email ? await ctx.db.query('profileReviewTeam').withIndex('by_email', q => q.eq('email', email)).unique() : null);
  if (grant) return grant.revokedAt === undefined ? grant.role || 'moderator' : 'member';
  const reviewers = (process.env.PROFILE_REVIEWER_EMAILS || process.env.BUG_EDITOR_EMAILS || '')
    .split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
  return reviewers.includes(email) ? 'moderator' : 'member';
}
export async function moderatorId(ctx: QueryCtx) {
  const id = await getAuthUserId(ctx);
  return id && await moderationRole(ctx, id) !== 'member' ? id : null;
}
export async function moderationOwnerId(ctx: QueryCtx) {
  const id = await getAuthUserId(ctx);
  return id && await isModerationOwner(ctx, id) ? id : null;
}
export async function canReviewOwnProfile(ctx: QueryCtx, id: Id<'users'>) {
  const owner = await ctx.db.query('moderationOwners').withIndex('by_key', q => q.eq('key', 'primary')).unique();
  return owner?.userId === id && await isModerationOwner(ctx, id);
}
export async function staffHandle(ctx: QueryCtx, id: Id<'users'>) {
  return (await ctx.db.query('profiles').withIndex('by_owner', q => q.eq('ownerId', id)).unique())?.handle || 'Staff member';
}
