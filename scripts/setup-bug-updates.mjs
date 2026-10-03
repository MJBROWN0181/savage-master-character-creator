// Run from the repository root with an authenticated GitHub CLI and Convex CLI.
// Keep the signing key in memory; CLIs store it only as encrypted/server secrets.
import { execFileSync } from 'node:child_process';
import { randomBytes, createHmac } from 'node:crypto';
import { resolve } from 'node:path';
const repository = 'MJBROWN0181/savage-master-character-creator';
const dev = 'energized-swordfish-188', production = 'striped-jaguar-856';
const endpoint = `https://${production}.convex.site/bug/github`;
const convexCli = resolve('node_modules/convex/bin/main.js');
const convex = args => execFileSync(process.execPath, [convexCli, ...args], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
let stage = 'read existing signing configuration';
try {
  let secret;
  try { secret = convex(['env', 'get', 'BUG_GITHUB_WEBHOOK_SECRET', '--deployment', dev]); } catch { /* First setup. */ }
  if (!secret) secret = randomBytes(48).toString('hex');
  for (const deployment of [dev, production]) {
    stage = `configure ${deployment}`;
    convex(['env', 'set', 'BUG_GITHUB_WEBHOOK_SECRET', secret, '--deployment', deployment]);
    convex(['env', 'set', 'BUG_GITHUB_REPOSITORY', repository, '--deployment', deployment]);
  }
  stage = 'configure GitHub Actions signing secret';
  execFileSync('gh', ['secret', 'set', 'BUG_GITHUB_WEBHOOK_SECRET', '--repo', repository], { input: secret, stdio: ['pipe', 'pipe', 'pipe'] });
  stage = 'configure GitHub Actions endpoint';
  execFileSync('gh', ['variable', 'set', 'BUG_CHRONICLES_ENDPOINT', '--repo', repository, '--body', endpoint], { stdio: ['pipe', 'pipe', 'pipe'] });
  stage = 'verify development endpoint';
  const body = JSON.stringify({ repository: { full_name: repository } });
  const response = await fetch(`https://${dev}.convex.site/bug/github`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-github-event': 'ping', 'x-hub-signature-256': 'sha256=' + createHmac('sha256', secret).update(body).digest('hex') }, body, redirect: 'error', signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('Development endpoint is not ready.');
  console.log(JSON.stringify({ repository, configured: true, developmentPing: response.status, productionEndpoint: endpoint, activation: 'Push the workflow and deploy the production backend before expecting public updates.' }));
} catch {
  console.error(`Bug setup did not finish at: ${stage}. No signing key is printed. Resolve access or deployment readiness and rerun.`);
  process.exitCode = 1;
}
