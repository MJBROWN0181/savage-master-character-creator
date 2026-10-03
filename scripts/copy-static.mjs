import { cp, readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const files = ['bug-capture.js', 'appearance.js', 'workspace-shell.js', 'app-design.css', 'app.js', 'data.js', 'settings.js', 'style.css', 'workspace-nav.css', 'theme-motion.css', 'typography.css', 'sw.js', 'manifest.json', 'logo.png', 'robots.txt', 'sitemap.xml'];
files.push('shared-post.css');
files.push('creation-workshop.css', 'character-cards.css', 'character-art.json', 'story-help.js', 'creation-notice.js');
for (const file of files) {
  await cp(file, `dist/${file}`);
}
for (const dir of ['icons', 'images', 'fonts']) await cp(dir, `dist/${dir}`, { recursive: true });
// Include Vite's hashed account bundle and stylesheet in the offline shell.
const html = await readFile('dist/index.html', 'utf8');
const bundled = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^" ]+)"/g)].map(match => match[1]))];
const fontAssets = [...(await readdir('dist/assets')).filter(file => file.endsWith('.woff2')).map(file => `/assets/${file}`), '/fonts/alegreya/regular-latin.woff2', '/fonts/alegreya/regular-latin-ext.woff2', '/fonts/alegreya/italic-latin.woff2', '/fonts/alegreya/italic-latin-ext.woff2'];
const assets = [...fontAssets, '/', '/index.html', ...files.filter(file => file !== 'sw.js').map(file => `/${file}`), '/icons/icon-192x192.png', '/icons/icon-512x512.png', ...bundled];
const hash = createHash('sha256');
for (const asset of assets.filter(asset => asset !== '/')) hash.update(await readFile(`dist${asset}`));
const worker = (await readFile('sw.js', 'utf8')).replace("'savage-master-v2'", JSON.stringify(`savage-master-${hash.digest('hex').slice(0,12)}`)).replace('/* BUILD_ASSETS */', [...fontAssets, '/bug-capture.js', '/appearance.js', '/workspace-shell.js', '/app-design.css', '/typography.css', ...bundled].map(asset => `${JSON.stringify(asset)},`).join('\n'));
await writeFile('dist/sw.js', worker);

await cp('pathfinder-data/ORC-NOTICE.md','dist/ORC-NOTICE.md');
await cp('pathfinder-data/APACHE-LICENSE.txt','dist/PF-APACHE-LICENSE.txt');
