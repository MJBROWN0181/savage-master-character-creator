import { execFileSync } from 'node:child_process';

// Only the production build can initialize this site's owner. Credentials stay in the build environment.
if (process.env.VERCEL_ENV === 'production') {
  if (!process.env.CONVEX_DEPLOY_KEY?.startsWith('prod:striped-jaguar-856|')) throw new Error('Unexpected production Convex target.');
  const run = (name, args) => execFileSync('npx', ['convex', 'run', name, JSON.stringify(args)], { stdio: 'inherit' });
  run('moderation:initializeOwner', { handle: 'warrior-king81' });
  run('profileFrames:backfillMembers', { cursor: null });
  run('moderation:repairPendingNotices', {});
}
