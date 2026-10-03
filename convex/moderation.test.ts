import { convexTest } from 'convex-test';
import { test, expect, vi, afterEach } from 'vitest';
import { makeFunctionReference as ref } from 'convex/server';
import schema from './schema';
const modules = import.meta.glob('./**/*.ts');
const draft = { displayName: 'Gamer', bio: 'Hello', games: [], memory: '', roles: [], links: [], favorites: [], highlights: [], appearance: { background: 'midnight', accent: 'gold', font: 'classic', layout: 'balanced', sections: ['about', 'games', 'memory', 'characters', 'journal'] }, ageConfirmed: true, communityAccepted: true };
afterEach(() => vi.unstubAllEnvs());
async function fixture() {
  vi.stubEnv('PROFILE_MODERATOR_ADMIN_EMAILS', ''); vi.stubEnv('PROFILE_REVIEWER_EMAILS', ''); vi.stubEnv('BUG_EDITOR_EMAILS', '');
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => ({
    owner: await ctx.db.insert('users', { email: 'private-owner@example.test', name: 'Private owner name', emailVerificationTime: 1 }),
    admin: await ctx.db.insert('users', { email: 'private-admin@example.test', emailVerificationTime: 1 }),
    member: await ctx.db.insert('users', { email: 'private-member@example.test', phone: '555-0100', emailVerificationTime: 1 }),
  }));
  const owner = t.withIdentity({ subject: ids.owner }), admin = t.withIdentity({ subject: ids.admin }), member = t.withIdentity({ subject: ids.member });
  for (const [caller, handle] of [[owner, 'owner'], [admin, 'helper'], [member, 'member']] as const) await caller.mutation(ref<'mutation'>('profiles:save'), { ...draft, handle });
  await t.mutation(ref<'mutation'>('moderation:initializeOwner'), { handle: 'owner' });
  return { t, ids, owner, admin, member };
}
test('owner initialization is internal and permanent; owner appoints admins by handle and revocation removes their frame and access', async () => {
  const { t, owner, admin, member } = await fixture();
  await t.mutation(ref<'mutation'>('moderation:initializeOwner'), { handle: 'helper' });
  expect(await owner.query(ref<'query'>('moderation:mine'), {})).toEqual({ role: 'owner' });
  expect((await owner.query(ref<'query'>('profileFrames:mine'), {}) as any).active).toBe('admin');
  await expect(member.mutation(ref<'mutation'>('profiles:setReviewerAccess'), { handle: 'helper', enabled: true })).rejects.toThrow('administrators');
  await owner.mutation(ref<'mutation'>('profiles:setReviewerAccess'), { handle: '@helper', enabled: true, role: 'admin' });
  expect(await admin.query(ref<'query'>('moderation:mine'), {})).toEqual({ role: 'admin' });
  expect((await admin.query(ref<'query'>('profileFrames:mine'), {}) as any).available).toContain('admin');
  expect(await admin.query(ref<'query'>('profiles:canReview'), {})).toBe(true);
  await expect(admin.mutation(ref<'mutation'>('profiles:setReviewerAccess'), { handle: 'member', enabled: true })).rejects.toThrow('administrators');
  await expect(owner.mutation(ref<'mutation'>('profiles:setReviewerAccess'), { handle: 'owner', enabled: false })).rejects.toThrow('protected');
  const team = await owner.query(ref<'query'>('profiles:reviewTeam'), {});
  expect(team).toMatchObject([{ handle: 'helper', role: 'admin' }]);
  expect(JSON.stringify(team)).not.toContain('email');
  await owner.mutation(ref<'mutation'>('profiles:setReviewerAccess'), { handle: 'helper', enabled: false });
  expect(await admin.query(ref<'query'>('profiles:canReview'), {})).toBe(false);
  expect((await admin.query(ref<'query'>('profileFrames:mine'), {}) as any).available).not.toContain('admin');
});
test('member and bug queues return only safe fields; guests and ordinary members have no access', async () => {
  const { t, ids, owner, admin, member } = await fixture();
  await owner.mutation(ref<'mutation'>('profiles:setReviewerAccess'), { handle: 'helper', enabled: true });
  const ticket = await t.run(ctx => ctx.db.insert('supportTickets', { ownerId: ids.member, requestId: 'private-request', reference: 'PRIVATE-REFERENCE', kind: 'bug', title: 'Personal medical details', body: 'Private home address', email: 'private-member@example.test', diagnostics: 'secret token', reply: 'Private reply', category: 'profiles', status: 'open', createdAt: 1, updatedAt: 1, notification: 'sent' }));
  const args = { paginationOpts: { cursor: null, numItems: 30 } };
  for (const caller of [t, member]) {
    await expect(caller.query(ref<'query'>('moderation:members'), args)).rejects.toThrow('Staff');
    await expect(caller.query(ref<'query'>('moderation:bugReports'), {})).rejects.toThrow('Staff');
    await expect(caller.mutation(ref<'mutation'>('moderation:updateBugReport'), { id: ticket, updatedAt: 1, status: 'resolved' })).rejects.toThrow('Staff');
  }
  const data: any = await admin.query(ref<'query'>('moderation:members'), args);
  expect(data.page).toHaveLength(3);
  expect(Object.keys(data.page[0]).sort()).toEqual(['communityPaused', 'handle', 'memberId', 'reviewStatus', 'role', 'verified']);
  const bugs: any = await admin.query(ref<'query'>('moderation:bugReports'), {});
  expect(bugs).toEqual([{ id: ticket, category: 'profiles', status: 'open', createdAt: 1, updatedAt: 1 }]);
  await admin.mutation(ref<'mutation'>('moderation:updateBugReport'), { id: ticket, updatedAt: 1, status: 'in_progress' });
  await expect(admin.mutation(ref<'mutation'>('moderation:updateBugReport'), { id: ticket, updatedAt: 1, status: 'resolved' })).rejects.toThrow('changed');
});
test('community pauses hide public profiles and block posting without deleting private data; owner and staff protections hold', async () => {
  const { t, ids, owner, admin, member } = await fixture();
  await owner.mutation(ref<'mutation'>('profiles:setReviewerAccess'), { handle: 'helper', enabled: true });
  await t.run(async ctx => {
    const p = await ctx.db.query('profiles').withIndex('by_owner', q => q.eq('ownerId', ids.member)).unique();
    await ctx.db.patch(p!._id, { reviewStatus: 'approved', publicSnapshot: { ...draft, handle: 'member' } });
  });
  expect(await t.query(ref<'query'>('profiles:publicProfile'), { handle: 'member' })).not.toBeNull();
  await expect(member.mutation(ref<'mutation'>('moderation:setCommunityAccess'), { memberId: ids.admin, paused: true })).rejects.toThrow('Staff');
  await expect(admin.mutation(ref<'mutation'>('moderation:setCommunityAccess'), { memberId: ids.owner, paused: true })).rejects.toThrow('protected');
  await admin.mutation(ref<'mutation'>('moderation:setCommunityAccess'), { memberId: ids.member, paused: true });
  expect(await t.query(ref<'query'>('profiles:publicProfile'), { handle: 'member' })).toBeNull();
  expect(await member.query(ref<'query'>('chronicles:eligibility'), {})).toBe(false);
  await expect(member.mutation(ref<'mutation'>('friends:request'), { handle: 'helper' })).rejects.toThrow('paused');
  await expect(admin.mutation(ref<'mutation'>('friends:request'), { handle: 'member' })).rejects.toThrow('unavailable');
  await expect(member.mutation(ref<'mutation'>('chronicles:publish'), { title: 'Tale', body: 'Story', game: 'Any tabletop game', kind: 'Session tale', consent: true })).rejects.toThrow('review');
  expect((await member.query(ref<'query'>('profiles:mine'), {}) as any).bio).toBe('Hello');
  expect(await t.run(ctx => ctx.db.get(ids.member))).not.toBeNull();
  await admin.mutation(ref<'mutation'>('moderation:setCommunityAccess'), { memberId: ids.member, paused: false });
  expect(await member.query(ref<'query'>('chronicles:eligibility'), {})).toBe(true);
});
