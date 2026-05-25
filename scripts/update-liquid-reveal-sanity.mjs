// One-shot: push the latest liquid-reveal-hero prompt + technology tags
// to the existing Sanity project document.

import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const client = createClient({
  projectId:
    process.env.PUBLIC_SANITY_PROJECT_ID ??
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:
    process.env.PUBLIC_SANITY_DATASET ??
    process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2025-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const SLUG = 'liquid-reveal-hero';
const copyPrompt = fs.readFileSync('prompts/liquid-reveal-hero.md', 'utf8');
const technologies = JSON.parse(
  fs.readFileSync('prompts/liquid-reveal-hero.meta.json', 'utf8'),
).technologies;

const existing = await client.fetch(
  `*[_type == "project" && slug.current == $slug][0]{_id}`,
  { slug: SLUG },
);
if (!existing?._id) {
  console.error(`No project with slug "${SLUG}" found. Aborting.`);
  process.exit(1);
}

const patched = await client
  .patch(existing._id)
  .set({ copyPrompt, technologies })
  .commit();

console.log('Patched', patched._id, '— technologies:', patched.technologies);
