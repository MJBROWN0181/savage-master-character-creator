// Every production entry gets the same quiet support companion, including sign-in.
export default function supportPlugin() {
  return {
    name: 'savage-master-support',
    transformIndexHtml: {
      order: 'pre',
      handler() {
        return [
          { tag: 'script', attrs: { src: '/bug-capture.js' }, injectTo: 'head-prepend' },
          { tag: 'script', attrs: { type: 'module', src: '/support.jsx' }, injectTo: 'body' },
        ];
      },
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url, 'http://localhost');
        if (url.pathname !== '/support') return next();
        response.writeHead(302, { Location: '/support.html' + url.search });
        response.end();
      });
    },
  };
}
