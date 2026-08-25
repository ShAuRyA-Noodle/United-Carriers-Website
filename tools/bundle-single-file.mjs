/* Produces one self-contained HTML file from dist/ — every asset inlined, no
   same-origin fetches, so the page runs anywhere it is dropped. */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const guard = (s) => s.replace(/<\/script/gi, '<\\/script');

const cssHref = html.match(/href="([^"]+\.css)"/)?.[1];
const jsSrc = html.match(/src="([^"]+\.js)"/)?.[1];
if (!cssHref || !jsSrc) throw new Error('could not locate built assets in dist/index.html');

const css = fs.readFileSync(path.join(dist, cssHref.replace(/^\//, '')), 'utf8');
const js = fs.readFileSync(path.join(dist, jsSrc.replace(/^\//, '')), 'utf8');
const topo = fs.readFileSync(path.join(root, 'public', 'land-110m.json'), 'utf8');

const fonts = html.match(/<link href="https:\/\/fonts\.googleapis\.com[^>]+>/)?.[0] ?? '';
const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1]
  .replace(/<script[^>]*src="[^"]+"[^>]*><\/script>/gi, '')
  .trim();

const out = `<title>Meridian Carriers</title>
${fonts}
<style>
${css}
</style>

${body}

<script>window.__LAND_TOPO = ${guard(topo)};</script>
<script type="module">
${guard(js)}
</script>
`;

const target = path.join(root, 'dist', 'meridian-carriers.html');
fs.writeFileSync(target, out);
console.log(`${target}  ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB`);
