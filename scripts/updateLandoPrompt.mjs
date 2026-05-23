// Updates the copyPrompt field on the "Liquid Reveal Hero" Sanity entry
// using the latest content at lando-hero/demo/copy-prompt.md.
//
// Run: node scripts/updateLandoPrompt.mjs

import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const env = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8')
  .split('\n')
  .filter((l) => l && !l.startsWith('#'))
  .reduce((acc, line) => {
    const eq = line.indexOf('=');
    if (eq === -1) return acc;
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

const promptPath = resolve(__dirname, '..', '..', 'lando-hero', 'demo', 'copy-prompt.md');
const copyPrompt = readFileSync(promptPath, 'utf8');

// Find the existing entry by slug.
const doc = await client.fetch(
  `*[_type == "project" && slug.current == "liquid-reveal-hero"][0]{_id, title}`,
);

if (!doc) {
  console.error('No project with slug "liquid-reveal-hero" found in Sanity.');
  process.exit(1);
}

console.log(`updating prompt on "${doc.title}" (${doc._id})…`);
const updated = await client
  .patch(doc._id)
  .set({ copyPrompt })
  .commit();

console.log('done. _rev:', updated._rev);
console.log(`prompt length: ${copyPrompt.length} chars`);
