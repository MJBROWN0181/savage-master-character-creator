import { readFile, readdir, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import sharp from 'sharp';
const pages = (await readdir('dist')).filter(path => path.endsWith('.html'));
for (const path of pages) {
  const html = await readFile('dist/' + path, 'utf8');
  assert.equal((html.match(/src="\/app-install.js"/g) || []).length, 1, path + ': shared installer');
  assert.equal((html.match(/rel="manifest"/g) || []).length, 1, path + ': manifest');
  assert(!html.includes('data-development="true"'), path + ': production registration');
  assert(!html.includes('deferredInstallPrompt'), path + ': no competing legacy installer');
  assert.equal((html.match(/<\/html>/g) || []).length, 1, path + ': complete document');
  assert.equal((html.match(/class="sm-legal-footer"/g) || []).length, 1, path + ': shared legal footer');
  for (const anchor of ['terms', 'privacy', 'publishers', 'copyright']) assert(html.includes(`/legal#${anchor}`), path + ': legal link ' + anchor);
}
const legal = await readFile('dist/legal.html', 'utf8');
for (const anchor of ['terms', 'privacy', 'publishers', 'copyright']) assert(legal.includes(`id="${anchor}"`), 'legal section ' + anchor);
assert(legal.includes('81 Ai Solutions'), 'operator identified');
assert(legal.includes('support@smsheets.com'), 'copyright and privacy contact');
assert((await stat('dist/SAVAGE-MASTER-ORC-NOTICE.md')).size > 0, 'adaptation notice shipped');
const manifest = JSON.parse(await readFile('dist/manifest.json', 'utf8'));
assert.equal(manifest.id, '/'); assert.equal(manifest.scope, '/'); assert.equal(manifest.display, 'standalone');
for (const icon of manifest.icons) {
  const meta = await sharp('dist' + icon.src).metadata();
  assert.equal(icon.sizes, `${meta.width}x${meta.height}`);
}
const worker = await readFile('dist/sw.js', 'utf8'); let precached;
const context = { self: { addEventListener() {} }, URL };
runInNewContext(worker + '\nglobalThis.inventory = [...new Set(ASSETS_TO_CACHE)];', context); precached = context.inventory;
for (const path of precached.filter(path => path !== '/')) assert((await stat('dist' + path)).size > 0, path + ': available');
for (const page of pages) assert(precached.includes('/' + page), page + ': offline shell');
for (const chunk of (await readdir('dist/assets')).filter(file => /\.(?:js|css)$/.test(file))) assert(precached.includes('/assets/' + chunk), chunk + ': offline rules');
console.log(`Install build verified: ${pages.length} entry pages, ${manifest.icons.length} icons, ${precached.length} available offline assets.`);
