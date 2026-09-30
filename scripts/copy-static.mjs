import { cp, readdir } from 'node:fs/promises';
const files = await readdir('.');
for (const file of files) {
  if (/\.(js|css|jpg|png|json)$/.test(file) && !['vite.config.js', 'vercel.json', 'package.json', 'package-lock.json'].includes(file)) {
    await cp(file, `dist/${file}`);
  }
}
for (const dir of ['icons', 'images']) await cp(dir, `dist/${dir}`, { recursive: true });
