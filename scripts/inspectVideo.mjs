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

const slug = process.argv[2] || 'liquid-reveal-hero';
const doc = await client.fetch(
  `*[_type == "project" && slug.current == $slug][0]{
    _id, title, thumbnailType,
    "videoAssetId": thumbnailVideo.asset._ref,
    "videoAsset": thumbnailVideo.asset->{_id, url, originalFilename, size, mimeType, _createdAt, _updatedAt}
  }`,
  { slug },
);
console.log(JSON.stringify(doc, null, 2));
