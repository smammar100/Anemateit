import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8')
  .split('\n').filter((l) => l && !l.startsWith('#'))
  .reduce((acc, line) => {
    const eq = line.indexOf('='); if (eq === -1) return acc;
    acc[line.slice(0, eq)] = line.slice(eq + 1).trim();
    return acc;
  }, {});

const client = createClient({
  projectId: env.PUBLIC_SANITY_PROJECT_ID,
  dataset: env.PUBLIC_SANITY_DATASET,
  apiVersion: env.PUBLIC_SANITY_API_VERSION,
  token: env.SANITY_API_TOKEN,
  useCdn: false,
});

const slug = process.argv[2];
if (!slug) {
  console.error('usage: node scripts/dumpPrompt.mjs <slug>');
  process.exit(1);
}

const doc = await client.fetch(
  `*[_type == "project" && slug.current == $slug][0]{
    _id, title, description, technologies, copyPrompt, viewCodeUrl, thumbnailType
  }`,
  { slug },
);

if (!doc) { console.error('not found'); process.exit(1); }

const out = resolve(__dirname, '..', '..', `prompt-dump-${slug}.md`);
writeFileSync(out, doc.copyPrompt || '');
console.log('title:', doc.title);
console.log('desc :', doc.description);
console.log('tech :', doc.technologies);
console.log('view :', doc.viewCodeUrl);
console.log('thumb:', doc.thumbnailType);
console.log('wrote prompt to:', out);
console.log('length:', (doc.copyPrompt || '').length, 'chars');
