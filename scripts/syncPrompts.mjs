// Walks carbon_q2_2026/prompts/<slug>.md and patches each matching
// Sanity project's copyPrompt (and optional metadata file <slug>.meta.json).
//
// Run: node scripts/syncPrompts.mjs

import { createClient } from '@sanity/client';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
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

const promptsDir = resolve(__dirname, '..', 'prompts');
const files = readdirSync(promptsDir).filter((f) => f.endsWith('.md'));

for (const file of files) {
  const slug = basename(file, '.md');
  const copyPrompt = readFileSync(resolve(promptsDir, file), 'utf8');

  const metaPath = resolve(promptsDir, `${slug}.meta.json`);
  const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : null;

  const doc = await client.fetch(
    `*[_type == "project" && slug.current == $slug][0]{_id, title}`,
    { slug },
  );
  if (!doc) { console.log(`× ${slug} — no Sanity doc, skipping`); continue; }

  const patch = { copyPrompt, ...(meta || {}) };
  await client.patch(doc._id).set(patch).commit();
  console.log(`✓ ${doc.title} — ${copyPrompt.length} chars` + (meta ? ` + ${Object.keys(meta).join(',')}` : ''));
}
