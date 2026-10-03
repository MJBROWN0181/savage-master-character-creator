import { query, mutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { memberIdentity, realProfile, guildState, activeMember } from './communityAccess';
import { mutuallyBlocked } from './chronicleVisibility';
const visibility = v.union(v.literal('public'), v.literal('private'));
async function summary(ctx: any, s: any, id: any) {
  return { _id: s.guild._id, name: s.guild.name, description: s.guild.description,
    visibility: s.guild.visibility || 'public', active: s.active, memberCount: s.profiles.length,
    mine: s.guild.ownerId === id, joined: s.accepted, invited: s.own?.status === 'invited' };
}
export const list = query({ args: {}, handler: async ctx => {
  const id = await getAuthUserId(ctx);
  const rows = await ctx.db.query('chronicleTomes').order('desc').take(60);
  const own = id ? await ctx.db.query('chronicleMembers').withIndex('by_owner', q => q.eq('ownerId', id)).take(100) : [];
  const ids = new Set([...rows.map(g => g._id), ...own.map(m => m.tomeId)]);
  const result = [];
  for (const guildId of ids) {
    const s = await guildState(ctx, guildId, id);
    if (s) result.push(await summary(ctx, s, id));
  }
  return result;
} });
export const detail = query({ args: { id: v.id('chronicleTomes') }, handler: async (ctx, { id }) => {
  const viewer = await getAuthUserId(ctx), s = await guildState(ctx, id, viewer);
  if (!s) return null;
  const members = s.accepted ? await Promise.all(s.members.map(async (m: any) => {
    const p = await realProfile(ctx, m.ownerId);
    return p && !await mutuallyBlocked(ctx, viewer, p.ownerId) ? { handle: p.handle, name: p.publicSnapshot.displayName || p.handle, invited: m.status === 'invited' } : null;
  })) : [];
  return { ...await summary(ctx, s, viewer), members: members.filter(Boolean) };
} });
export const create = mutation({
  args: { name: v.string(), description: v.string(), visibility, founders: v.array(v.string()) },
  handler: async (ctx, a) => {
    const ownerId = await memberIdentity(ctx), self = await realProfile(ctx, ownerId);
    if (!a.name.trim() || a.name.length > 70 || a.description.length > 400 || a.founders.length < 3 || a.founders.length > 9) throw new Error('Choose a name and invite at least three other reviewed profiles.');
    const owned = await ctx.db.query('chronicleTomes').withIndex('by_owner', q => q.eq('ownerId', ownerId)).take(10);
    if (owned.filter(g => !g.hidden).length >= 10) throw new Error('You can lead up to ten Guilds.');
    const emails = new Set([self!.verifiedEmail]), ids = new Set<string>([ownerId]);
    for (const handle of a.founders) {
      const p = await ctx.db.query('profiles').withIndex('by_handle', q => q.eq('handle', handle.trim().toLowerCase())).unique();
      const real = p ? await realProfile(ctx, p.ownerId) : null;
      if (!real || ids.has(real.ownerId) || emails.has(real.verifiedEmail) || await mutuallyBlocked(ctx, ownerId, real.ownerId)) throw new Error('Invite distinct, reviewed profiles with verified emails. Bug cannot be a founding member.');
      ids.add(real.ownerId); emails.add(real.verifiedEmail);
    }
    const id = await ctx.db.insert('chronicleTomes', { ownerId, name: a.name.trim(), description: a.description.trim(), visibility: a.visibility, createdAt: Date.now() });
    for (const userId of ids) await ctx.db.insert('chronicleMembers', { tomeId: id, ownerId: userId as any, status: userId === ownerId ? 'accepted' : 'invited' });
    return id;
  },
});
export const respond = mutation({ args: { id: v.id('chronicleTomes'), accept: v.boolean() }, handler: async (ctx, { id, accept }) => {
  const ownerId = await memberIdentity(ctx), s = await guildState(ctx, id, ownerId);
  if (!s) throw new Error('Guild unavailable.');
  if (s.guild.ownerId === ownerId) throw new Error('The founder can close the Guild from its settings.');
  if (accept) {
    if (!s.own && s.guild.visibility === 'private') throw new Error('This private Guild requires an invitation.');
    if (s.members.length >= 200 && !s.own) throw new Error('This Guild is full.');
    if (s.own) await ctx.db.patch(s.own._id, { status: 'accepted' });
    else await ctx.db.insert('chronicleMembers', { tomeId: id, ownerId, status: 'accepted' });
  } else if (s.own) await ctx.db.delete(s.own._id);
} });
export const invite = mutation({ args: { id: v.id('chronicleTomes'), handle: v.string() }, handler: async (ctx, { id, handle }) => {
  const ownerId = await memberIdentity(ctx), s = await guildState(ctx, id, ownerId);
  if (!s || s.guild.ownerId !== ownerId) throw new Error('Only the founder can invite members.');
  const p = await ctx.db.query('profiles').withIndex('by_handle', q => q.eq('handle', handle.trim().toLowerCase())).unique();
  if (!p || !await realProfile(ctx, p.ownerId) || await mutuallyBlocked(ctx, ownerId, p.ownerId)) throw new Error('Choose an available reviewed profile.');
  if (s.members.some((m: any) => m.ownerId === p.ownerId)) return;
  if (s.members.length >= 200) throw new Error('This Guild is full.');
  await ctx.db.insert('chronicleMembers', { tomeId: id, ownerId: p.ownerId, status: 'invited' });
} });
export const configure = mutation({ args: { id: v.id('chronicleTomes'), visibility, close: v.boolean() }, handler: async (ctx, a) => {
  const ownerId = await memberIdentity(ctx), guild = await ctx.db.get(a.id);
  if (!guild || guild.ownerId !== ownerId) throw new Error('Only the founder can change this Guild.');
  await ctx.db.patch(guild._id, { visibility: a.visibility, hidden: a.close });
} });
export const chat = query({ args: { id: v.id('chronicleTomes') }, handler: async (ctx, { id }) => {
  const viewer = await getAuthUserId(ctx), s = await guildState(ctx, id, viewer);
  if (!s?.accepted) return [];
  const rows = await ctx.db.query('guildMessages').withIndex('by_guild_created', q => q.eq('guildId', id)).order('desc').take(50), result = [];
  for (const m of rows.reverse()) {
    const p = await realProfile(ctx, m.ownerId);
    if (m.hidden || !p || await mutuallyBlocked(ctx, viewer, m.ownerId)) continue;
    result.push({ _id: m._id, body: m.body, createdAt: m.createdAt, mine: m.ownerId === viewer, author: { handle: p.handle, name: p.publicSnapshot.displayName || p.handle } });
  }
  return result;
} });
export const send = mutation({ args: { id: v.id('chronicleTomes'), body: v.string(), requestId: v.string() }, handler: async (ctx, a) => {
  const { id: ownerId } = await activeMember(ctx, a.id);
  if (!a.body.trim() || a.body.length > 2000 || !/^[\w-]{8,80}$/.test(a.requestId)) throw new Error('Write a message up to 2,000 characters.');
  const old = await ctx.db.query('guildMessages').withIndex('by_owner_request', q => q.eq('ownerId', ownerId).eq('requestId', a.requestId)).unique();
  if (old) { if (old.guildId !== a.id || old.body !== a.body.trim()) throw new Error('Start a new message.'); return old._id; }
  const recent = await ctx.db.query('guildMessages').withIndex('by_owner_created', q => q.eq('ownerId', ownerId).gte('createdAt', Date.now()-3600000)).take(30);
  if (recent.length >= 30) throw new Error('Please wait before sending more messages.');
  return ctx.db.insert('guildMessages', { guildId: a.id, ownerId, body: a.body.trim(), requestId: a.requestId, createdAt: Date.now() });
} });
export const share = mutation({ args: { id: v.id('guildMessages'), title: v.string(), consent: v.boolean() }, handler: async (ctx, a) => {
  const m = await ctx.db.get(a.id);
  if (!m || m.hidden) throw new Error('Message unavailable.');
  const { id: ownerId } = await activeMember(ctx, m.guildId);
  if (m.ownerId !== ownerId || !a.consent) throw new Error('Only share your own message, after confirming public sharing.');
  if (!a.title.trim() || a.title.length > 100) throw new Error('Give your public story a title.');
  const key = 'guild-message-' + m._id;
  const old = await ctx.db.query('chroniclePosts').withIndex('by_publication', q => q.eq('publicationKey', key)).unique();
  if (old) return old._id;
  const recent = await ctx.db.query('chroniclePosts').withIndex('by_owner', q => q.eq('ownerId', ownerId)).order('desc').take(20);
  if (recent.some(p => Date.now()-p.createdAt < 30000) || recent.filter(p => Date.now()-p.createdAt < 86400000).length >= 20) throw new Error('Please wait between public posts.');
  // Copy only the explicitly chosen message. No private Guild names, links, or other chat are exposed.
  return ctx.db.insert('chroniclePosts', { ownerId, title: a.title.trim(), body: m.body, game: 'Any tabletop game', kind: 'Session tale', createdAt: Date.now(), toastCount: 0, hidden: false, publicationKey: key });
} });
export const events = query({ args: { id: v.id('chronicleTomes') }, handler: async (ctx, { id }) => {
  const viewer = await getAuthUserId(ctx), s = await guildState(ctx, id, viewer);
  if (!s || (s.guild.visibility === 'private' && !s.accepted) || (!s.active && !s.accepted)) return [];
  const events = await ctx.db.query('guildEvents').withIndex('by_guild_start', q => q.eq('guildId', id).gte('startsAt', Date.now()-86400000)).take(50);
  return Promise.all(events.filter(e => !e.cancelled).map(async e => {
    const rsvps = await ctx.db.query('guildRsvps').withIndex('by_event_owner', q => q.eq('eventId', e._id)).take(200);
    return { _id: e._id, title: e.title, description: e.description, startsAt: e.startsAt, endsAt: e.endsAt, timezone: e.timezone, mine: e.ownerId === viewer,
      going: rsvps.filter(r => r.choice === 'going').length, maybe: rsvps.filter(r => r.choice === 'maybe').length, response: rsvps.find(r => r.ownerId === viewer)?.choice };
  }));
} });
export const schedule = mutation({ args: { id: v.id('chronicleTomes'), title: v.string(), description: v.string(), startsAt: v.number(), endsAt: v.number(), timezone: v.string() }, handler: async (ctx, a) => {
  const { id: ownerId } = await activeMember(ctx, a.id);
  if (!a.title.trim() || a.title.length > 100 || a.description.length > 1000 || !Number.isFinite(a.startsAt) || !Number.isFinite(a.endsAt) || a.startsAt < Date.now() || a.endsAt <= a.startsAt || a.endsAt - a.startsAt > 604800000 || a.timezone.length > 80) throw new Error('Choose a future event with a valid start and end.');
  try { new Intl.DateTimeFormat('en', { timeZone: a.timezone }); } catch { throw new Error('Choose a valid timezone.'); }
  const recent = await ctx.db.query('guildEvents').withIndex('by_guild_start', q => q.eq('guildId', a.id).gte('startsAt', Date.now())).take(50);
  if (recent.filter(e => !e.cancelled).length >= 50) throw new Error('This Guild already has 50 upcoming events.');
  return ctx.db.insert('guildEvents', { guildId: a.id, ownerId, title: a.title.trim(), description: a.description.trim(), startsAt: a.startsAt, endsAt: a.endsAt, timezone: a.timezone, cancelled: false, createdAt: Date.now() });
} });
export const rsvp = mutation({ args: { id: v.id('guildEvents'), choice: v.union(v.literal('going'),v.literal('maybe'),v.literal('clear')) }, handler: async (ctx, a) => {
  const event = await ctx.db.get(a.id);
  if (!event || event.cancelled) throw new Error('Event unavailable.');
  const { id: ownerId } = await activeMember(ctx, event.guildId);
  const old = await ctx.db.query('guildRsvps').withIndex('by_event_owner', q => q.eq('eventId', a.id).eq('ownerId', ownerId)).unique();
  if (a.choice === 'clear') { if (old) await ctx.db.delete(old._id); }
  else if (old) await ctx.db.patch(old._id, { choice: a.choice });
  else await ctx.db.insert('guildRsvps', { eventId: a.id, ownerId, choice: a.choice });
} });
export const cancelEvent = mutation({ args: { id: v.id('guildEvents') }, handler: async (ctx, { id }) => {
  const event = await ctx.db.get(id);
  if (!event) throw new Error('Event unavailable.');
  const { id: ownerId, state } = await activeMember(ctx, event.guildId);
  if (event.ownerId !== ownerId && state.guild.ownerId !== ownerId) throw new Error('Only the host or founder can cancel this event.');
  await ctx.db.patch(id, { cancelled: true });
} });
