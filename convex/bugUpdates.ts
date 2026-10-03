const zero = /^0+$/;
export function cleanCommit(value: unknown, limit = 160) {
  return String(value || '').split(/\r?\n/)[0]
    .replace(/https?:\/\/\S+/gi, '[link]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b(password|token|secret|authorization|api[_-]?key)\b["']?\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, '$1=[redacted]')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|sk-[A-Za-z0-9_-]+)\b/g, '[redacted]')
    .replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, limit);
}
function voice(subject: string) {
  const conventional = /^(fix|feat|perf|docs|test|refactor|chore|build|ci)(?:\([^)]*\))?!?:\s*(.+)$/i.exec(subject);
  if (conventional) {
    const phrases: Record<string, string> = { fix: 'I untangled a bug', feat: 'I added a new feature', perf: 'I tuned the machinery', docs: 'I updated my field notes', test: 'I strengthened my checks' };
    return `${phrases[conventional[1].toLowerCase()] || 'I tidied the code'}: ${conventional[2]}`;
  }
  const action = /^(fix(?:ed|es)?|add(?:ed)?|improv(?:e|ed)|updat(?:e|ed)|remov(?:e|ed))\s+(.+)$/i.exec(subject);
  if (action) {
    const word = action[1].toLowerCase();
    const verb = word.startsWith('fix') ? 'fixed' : word.startsWith('add') ? 'added' : word.startsWith('improv') ? 'improved' : word.startsWith('updat') ? 'updated' : 'removed';
    return `I ${verb} ${action[2]}`;
  }
  return `I worked on: ${subject}`;
}
export function bugPushUpdate(payload: any, repository: string) {
  if (!payload || payload.repository?.full_name?.toLowerCase() !== repository.toLowerCase()) throw new Error('Unexpected repository.');
  if (payload.deleted || !String(payload.ref || '').startsWith('refs/heads/') || zero.test(String(payload.after || ''))) return null;
  if (!/^[a-f0-9]{40}$/i.test(payload.after || '')) throw new Error('Invalid commit.');
  const commits = Array.isArray(payload.commits) ? payload.commits : [];
  const messages = commits.map((commit: any) => cleanCommit(commit.message)).filter(Boolean);
  if (!messages.length && payload.head_commit?.message) messages.push(cleanCommit(payload.head_commit.message));
  if (!messages.length) return null;
  const unique = [...new Set<string>(messages)];
  const shown = unique.slice(0, 8);
  const total = Math.max(commits.length, Number.isSafeInteger(payload.totalCommits) ? payload.totalCommits : 0, messages.length);
  const branch = cleanCommit(String(payload.ref).slice('refs/heads/'.length), 70);
  const body = `I’ve been busy with my tome of code. Here’s what I’ve been fixing and improving:\n\n${shown.map(subject => '• ' + voice(subject)).join('\n')}\n\n${total > shown.length ? `This push includes ${total} commits in all.\n` : ''}From my ${branch} workshop, entry ${payload.after.slice(0, 7)}. These changes are in the code; I haven’t confirmed a live release yet.`;
  return { title: `Bug’s workshop notes · ${payload.after.slice(0, 7)}`, body: body.slice(0, 2000) };
}
export async function validBugSignature(body: string, signature: string | null, secret: string) {
  if (!secret || !/^sha256=[a-f0-9]{64}$/i.test(signature || '')) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const bytes = Uint8Array.from(signature!.slice(7).match(/.{2}/g)!, value => parseInt(value, 16));
  return crypto.subtle.verify('HMAC', key, bytes, new TextEncoder().encode(body));
}
