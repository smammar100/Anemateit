import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
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

const projects = await client.fetch(
  `*[_type == "project"] | order(_createdAt asc){
    _id, title, "slug": slug.current, technologies,
    "promptLen": length(copyPrompt),
    "promptHead": coalesce(copyPrompt, "")[0..200]
  }`,
);

console.log(`Found ${projects.length} project(s):\n`);
for (const p of projects) {
  console.log(`• ${p.title}`);
  console.log(`  slug: ${p.slug}`);
  console.log(`  _id:  ${p._id}`);
  console.log(`  tech: ${(p.technologies || []).join(', ')}`);
  console.log(`  prompt: ${p.promptLen ?? 0} chars`);
  console.log(`  head:   ${(p.promptHead || '').slice(0, 140).replace(/\n/g, ' ')}…`);
  console.log();
}
