import { cp, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const files = ['app.js', 'data.js', 'settings.js', 'style.css', 'workspace-nav.css', 'sw.js', 'manifest.json', 'logo.png', 'robots.txt', 'sitemap.xml'];
for (const file of files) {
  await cp(file, `dist/${file}`);
}
for (const dir of ['icons', 'images']) await cp(dir, `dist/${dir}`, { recursive: true });
// Include Vite's hashed account bundle and stylesheet in the offline shell.
const html = await readFile('dist/index.html', 'utf8');
const bundled = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^" ]+)"/g)].map(match => match[1]))];
const assets = ['/', '/index.html', ...files.filter(file => file !== 'sw.js').map(file => `/${file}`), '/icons/icon-192x192.png', '/icons/icon-512x512.png', ...bundled];
const hash = createHash('sha256');
for (const asset of assets.filter(asset => asset !== '/')) hash.update(await readFile(`dist${asset}`));
const worker = (await readFile('sw.js', 'utf8')).replace("'savage-master-v2'", JSON.stringify(`savage-master-${hash.digest('hex').slice(0,12)}`)).replace('/* BUILD_ASSETS */', bundled.map(asset => `${JSON.stringify(asset)},`).join('\n'));
await writeFile('dist/sw.js', worker);
