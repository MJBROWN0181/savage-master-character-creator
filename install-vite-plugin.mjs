// Capture the install event before any workspace mounts, on every entry page.
export default function installPlugin() {
  return {
    name: 'savage-master-install',
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        const tags = [{ tag: 'script', attrs: { src: '/app-install.js', ...(context.server ? { 'data-development': 'true' } : {}) }, injectTo: 'head-prepend' }];
        if (!html.includes('rel="manifest"')) tags.push({ tag: 'link', attrs: { rel: 'manifest', href: '/manifest.json' }, injectTo: 'head' });
        if (!html.includes('name="theme-color"')) tags.push({ tag: 'meta', attrs: { name: 'theme-color', content: '#111d20' }, injectTo: 'head' });
        if (!html.includes('rel="apple-touch-icon"')) tags.push({ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/icons/icon-192x192.png' }, injectTo: 'head' });
        return tags;
      },
    },
  };
}
