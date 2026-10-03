import { readFile } from 'node:fs/promises';
const notices = {
  '/ORC-NOTICE.md': 'pathfinder-data/ORC-NOTICE.md',
  '/SAVAGE-MASTER-ORC-NOTICE.md': 'pathfinder-data/SAVAGE-MASTER-NOTICE.md',
  '/PF-APACHE-LICENSE.txt': 'pathfinder-data/APACHE-LICENSE.txt',
};
// Keep publisher credits, store links, and legal notices accessible on every entry.
export default function legalPlugin() {
  return {
    name: 'savage-master-legal',
    transformIndexHtml() {
      return [{ tag: 'footer', attrs: { class: 'sm-legal-footer' }, injectTo: 'body', children: `<nav aria-label="Legal information"><a href="/legal#publishers">Publisher credits · Official books &amp; accessories</a><a href="/legal#terms">Terms</a><a href="/legal#privacy">Privacy</a><a href="/legal#copyright">Copyright reports</a></nav>` }];
    },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url, 'http://localhost');
        if (Object.hasOwn(notices, url.pathname)) {
          try {
            response.setHeader('Content-Type', 'text/plain; charset=utf-8');
            response.end(await readFile(new URL(notices[url.pathname], import.meta.url), 'utf8'));
          } catch (error) { next(error); }
          return;
        }
        if (url.pathname !== '/legal') return next();
        response.writeHead(302, { Location: '/legal.html' + url.search });
        response.end();
      });
    },
  };
}
