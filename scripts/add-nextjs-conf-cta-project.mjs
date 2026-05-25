// One-shot: upload the reference MP4 to Sanity and create a project document
// for "Next.js Conf 2025 CTA".
//
// Usage: node scripts/add-nextjs-conf-cta-project.mjs
//
// Requires .env.local with:
//   PUBLIC_SANITY_PROJECT_ID (or NEXT_PUBLIC_SANITY_PROJECT_ID)
//   PUBLIC_SANITY_DATASET (or NEXT_PUBLIC_SANITY_DATASET)
//   PUBLIC_SANITY_API_VERSION (or NEXT_PUBLIC_SANITY_API_VERSION)
//   SANITY_API_TOKEN  (write-scoped)

import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';

// Load .env.local manually (no dotenv dep needed in the project)
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const projectId =
  process.env.PUBLIC_SANITY_PROJECT_ID ??
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset =
  process.env.PUBLIC_SANITY_DATASET ??
  process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion =
  process.env.PUBLIC_SANITY_API_VERSION ??
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ??
  '2025-01-01';
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !dataset || !token) {
  console.error('Missing env: need projectId, dataset, and SANITY_API_TOKEN');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

const SLUG = 'nextjs-conf-cta';
const TITLE = 'Next.js Conf 2025 CTA';
const DESCRIPTION =
  'A pixel-scatter hover effect inspired by the Next.js Conf 2025 "Get Tickets" CTA. A blue button shatters into scattered rectangular blocks on hover and reassembles on mouse leave — built with CSS Grid and CSS transitions, no animation libraries needed.';
const TECHNOLOGIES = [
  'React',
  'TypeScript',
  'Tailwind CSS',
  'CSS Grid',
  'CSS Transitions',
];
const VIDEO_PATH = 'C:/Users/MSI/Downloads/66cf1ec4ba54b512260933.mp4';
const PROMPT_PATH = 'prompts/nextjs-conf-cta.md';

async function main() {
  const existing = await client.fetch(
    `*[_type == "project" && slug.current == $slug][0]{_id}`,
    { slug: SLUG },
  );
  if (existing?._id) {
    console.error(
      `A project with slug "${SLUG}" already exists (id ${existing._id}). Aborting to avoid duplicate.`,
    );
    process.exit(2);
  }

  console.log('Uploading video', VIDEO_PATH);
  const videoBuf = fs.readFileSync(VIDEO_PATH);
  const fileAsset = await client.assets.upload('file', videoBuf, {
    filename: '66cf1ec4ba54b512260933.mp4',
    contentType: 'video/mp4',
  });
  console.log('  file asset:', fileAsset._id);

  const copyPrompt = fs.readFileSync(PROMPT_PATH, 'utf8');

  console.log('Creating project document...');
  const doc = await client.create({
    _type: 'project',
    title: TITLE,
    slug: { _type: 'slug', current: SLUG },
    description: DESCRIPTION,
    thumbnailType: 'video',
    thumbnailVideo: {
      _type: 'file',
      asset: { _type: 'reference', _ref: fileAsset._id },
    },
    technologies: TECHNOLOGIES,
    copyPrompt,
  });

  console.log('Created project:', doc._id, '/', doc.slug.current);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
