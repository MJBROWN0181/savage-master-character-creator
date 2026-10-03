import { getAuthUserId } from '@convex-dev/auth/server';
import { reviewedAuthor, mutuallyBlocked } from './chronicleVisibility';
export async function realProfile(ctx: any, id: any) {
  const p = await reviewedAuthor(ctx, id);
  const user = p ? await ctx.db.get(id) : null;
  return p && !p.official && user?.emailVerificationTime && user.email ? { ...p, verifiedEmail: user.email.trim().toLowerCase() } : null;
}
export async function memberIdentity(ctx: any) {
  const id = await getAuthUserId(ctx);
  if (!id || !await realProfile(ctx, id)) throw new Error('Use a reviewed profile with a verified email to join this community.');
  return id;
}
export async function guildState(ctx: any, guildId: any, viewer: any) {
  const guild = await ctx.db.get(guildId);
  if (!guild || guild.hidden || !await reviewedAuthor(ctx, guild.ownerId) || await mutuallyBlocked(ctx, viewer, guild.ownerId)) return null;
  const members = await ctx.db.query('chronicleMembers').withIndex('by_tome_owner', (q: any) => q.eq('tomeId', guildId)).take(200);
  const own = members.find((m: any) => m.ownerId === viewer);
  const profiles = [];
  const emails = new Set<string>();
  for (const m of members) {
    if (m.status === 'invited') continue;
    const p = await realProfile(ctx, m.ownerId);
    if (p && !emails.has(p.verifiedEmail)) { emails.add(p.verifiedEmail); profiles.push(p); }
  }
  const accepted = !!own && own.status !== 'invited' && !!await realProfile(ctx, viewer);
  if (guild.visibility === 'private' && !own) return null;
  return { guild, members, own, accepted, profiles, active: profiles.length >= 4 };
}
export async function activeMember(ctx: any, guildId: any) {
  const id = await memberIdentity(ctx), state = await guildState(ctx, guildId, id);
  if (!state?.accepted || !state.active) throw new Error('The Guild needs four accepted, reviewed profiles before members can use it.');
  return { id, state };
}
