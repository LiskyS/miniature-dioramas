import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const template = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8')
  .replace(/<\/script/gi, '<\\/script');
const html = template.replace('/*__APP__*/', () => app);
const out = path.resolve(root, '..', '雪夜森林小屋.html');
fs.writeFileSync(out, html, 'utf8');
console.log(`wrote ${out} (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
