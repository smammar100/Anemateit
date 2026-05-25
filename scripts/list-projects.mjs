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
  useCdn: false,
});

const all = await client.fetch(
  `*[_type == "project"] | order(_createdAt desc) {
    _id, title, "slug": slug.current, thumbnailType, technologies
  }`,
);
console.log(JSON.stringify(all, null, 2));
