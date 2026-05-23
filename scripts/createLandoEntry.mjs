// Creates the "Liquid Reveal Hero" project entry in Sanity, including the
// uploaded WebM thumbnail and copy prompt.
//
// Prerequisites:
//   1. Generate a write token at https://www.sanity.io/manage → project tgexqefn → API → Tokens (give it Editor permissions).
//   2. Set SANITY_API_TOKEN in carbon_q2_2026/.env.local
//   3. Run: node scripts/createLandoEntry.mjs

import { createClient } from '@sanity/client';
import { createReadStream, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (no dotenv dep in this project).
const env = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8')
  .split('\n')
  .filter((l) => l && !l.startsWith('#'))
  .reduce((acc, line) => {
    const eq = line.indexOf('=');
    if (eq === -1) return acc;
    acc[line.slice(0, eq)] = line.slice(eq + 1).trim();
    return acc;
  }, {});

const token = env.SANITY_API_TOKEN;
if (!token) {
  console.error('SANITY_API_TOKEN is empty in .env.local — generate one at https://www.sanity.io/manage and add it.');
  process.exit(1);
}

const client = createClient({
  projectId: env.PUBLIC_SANITY_PROJECT_ID,
  dataset: env.PUBLIC_SANITY_DATASET,
  apiVersion: env.PUBLIC_SANITY_API_VERSION,
  token,
  useCdn: false,
});

const videoPath = resolve(__dirname, '..', '..', 'lando-hero', 'demo', 'lando-hero.webm');
const promptPath = resolve(__dirname, '..', '..', 'lando-hero', 'demo', 'copy-prompt.md');

console.log('uploading WebM…');
const asset = await client.assets.upload('file', createReadStream(videoPath), {
  filename: 'lando-hero.webm',
  contentType: 'video/webm',
});
console.log('  asset _id:', asset._id);

const copyPrompt = readFileSync(promptPath, 'utf8');

console.log('creating Project document…');
const doc = await client.create({
  _type: 'project',
  title: 'Liquid Reveal Hero',
  slug: { _type: 'slug', current: 'liquid-reveal-hero' },
  description:
    "A goo-style cursor-following reveal that swaps a portrait for a helmet underneath. Two layered background images (contain, bottom-anchored) blended through an SVG feGaussianBlur + feColorMatrix mask driven by Framer Motion springs. Inspired by landonorris.com.",
  thumbnailType: 'video',
  thumbnailVideo: {
    _type: 'file',
    asset: { _type: 'reference', _ref: asset._id },
  },
  technologies: ['React', 'TypeScript', 'Vite', 'Framer Motion', 'SVG Filter'],
  copyPrompt,
  viewCodeUrl: 'https://github.com/BrunoCarvalhoFeitosa/lando-norris',
});

console.log('created:', doc._id);
console.log('open in Studio: http://localhost:3333/structure/project;' + doc._id);
console.log('open on Animate.dev: http://localhost:4321/projects/' + doc.slug.current);
