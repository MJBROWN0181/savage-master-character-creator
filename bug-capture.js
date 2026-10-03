// Start before the application: memory only, bounded, with no account or game data.
(() => {
  if (window.smBugCapture) return;
  const errors = [];
  function clean(value, limit = 2500) {
    return String(value || '')
      .replace(/https?:\/\/[^\s)"'<>]+/gi, raw => {
        try { const url = new URL(raw); return url.origin + url.pathname; } catch { return '[link]'; }
      })
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
      .replace(/\b(password|token|secret|authorization|api[_-]?key|code)\b["']?\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, '$1=[redacted]')
      .replace(/\bBearer\s+[\w.+\/-]+/gi, 'Bearer [redacted]')
      .slice(0, limit);
  }
  function record(kind, error, extra = '') {
    const message = clean(error instanceof Error ? error.message : error);
    if (!message) return;
    const last = errors.at(-1);
    if (last?.kind === kind && last.message === message) return;
    errors.push({ kind, message, stack: clean(error instanceof Error ? error.stack : extra, 5000), at: new Date().toISOString() });
    if (errors.length > 10) errors.shift();
    // The companion learns only that an error exists; details stay in this buffer.
    if (typeof CustomEvent === 'function' && window.dispatchEvent) window.dispatchEvent(new CustomEvent('sm:bug-error'));
  }
  window.addEventListener('error', event => {
    if (event.target !== window) {
      const tag = event.target?.tagName;
      if (tag === 'SCRIPT' || tag === 'LINK') record('Resource error', `A ${tag.toLowerCase()} could not load.`, clean(event.target.src || event.target.href));
      return;
    }
    record('Application error', event.error || event.message, `${clean(event.filename)}:${event.lineno}:${event.colno}`);
  }, true);
  window.addEventListener('unhandledrejection', event => record('Unhandled error', event.reason instanceof Error ? event.reason : typeof event.reason === 'string' ? event.reason : 'A background request failed.'));
  window.addEventListener('sm:error', event => record('Reported error', event.detail));
  const original = console.error;
  console.error = function (...args) {
    record('Console error', args.map(arg => arg instanceof Error ? arg.stack : typeof arg === 'string' ? arg : '[details omitted]').join(' '));
    original.apply(console, args);
  };
  window.smBugCapture = {
    record, clean,
    snapshot: () => ({
      page: location.pathname,
      capturedAt: new Date().toISOString(),
      browser: clean(navigator.userAgent, 350),
      online: navigator.onLine,
      viewport: `${window.innerWidth} × ${window.innerHeight}`,
      errors: errors.map(error => ({ ...error })),
    }),
  };
})();
