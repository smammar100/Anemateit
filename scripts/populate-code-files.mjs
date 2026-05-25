// Seeds the `codeFiles` array on each project doc by reading the actual
// component source(s) from disk. Run once with: node scripts/populate-code-files.mjs

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

const projectId =
  process.env.PUBLIC_SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset =
  process.env.PUBLIC_SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !dataset || !token) {
  console.error('Missing env: need projectId, dataset, SANITY_API_TOKEN');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
});

const CN_HELPER = `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

const READMES = {
  'book-demo-button':
    '# Book Demo Button\n\n## Install\n\n```bash\nnpm i clsx tailwind-merge\n```\n\nDrop `components/BookDemoButton.tsx` and `lib/utils.ts` into your project.\nIn Next.js App Router keep the `\'use client\';` directive at the top of the component.\nIn Vite / Lovable / Bolt, you can delete that line.\n',
  'morphing-svg-mask-slider':
    '# Morphing SVG Mask Slider\n\n## Install\n\n```bash\nnpm i framer-motion flubber\n```\n\nDrop `components/MorphingSvgMaskSlider.tsx` into your project.\nIn Next.js App Router keep the `\'use client\';` directive at the top of the component.\nIn Vite / Lovable / Bolt, you can delete that line.\n',
  'liquid-reveal-hero':
    '# Liquid Reveal Hero\n\n## Install\n\n```bash\nnpm i three\nnpm i -D @types/three\n```\n\nDrop `components/LiquidRevealHero.tsx` into your project.\nIn Next.js App Router keep the `\'use client\';` directive at the top of the component.\nIn Vite / Lovable / Bolt, you can delete that line.\n',
  'nextjs-conf-cta':
    '# Next.js Conf 2025 CTA\n\nNo runtime dependencies — drop `components/NextjsConfCTA.tsx` into your project.\nIn Next.js App Router keep the `\'use client\';` directive at the top of the component.\nIn Vite / Lovable / Bolt, you can delete that line.\n\nThe button text uses Roboto Mono with a system-monospace fallback; load it via Google Fonts if you want the exact look.\n',
  '3d-perspective-highlight':
    '# 3D Perspective Highlight\n\nNo runtime dependencies — drop `components/PerspectiveHighlight.tsx` into your project.\nIn Next.js App Router keep the `\'use client\';` directive at the top of the component.\nIn Vite / Lovable / Bolt, you can delete that line.\n\nUses Tailwind arbitrary-value classes for `[perspective:1200px]` and `[transform-style:preserve-3d]`.\n',
};

const FILE_MAP = {
  '3d-perspective-highlight': [
    {
      src: 'src/components/perspective/PerspectiveHighlight.tsx',
      dest: 'components/PerspectiveHighlight.tsx',
    },
  ],
  'book-demo-button': [
    {
      src: 'src/components/book-demo/BookDemoButton.tsx',
      dest: 'components/BookDemoButton.tsx',
    },
    { inline: CN_HELPER, dest: 'lib/utils.ts' },
  ],
  'liquid-reveal-hero': [
    {
      src: 'src/components/liquid-reveal/LiquidRevealHero.tsx',
      dest: 'components/LiquidRevealHero.tsx',
    },
  ],
  'morphing-svg-mask-slider': [
    {
      src: 'src/components/morphing/MorphingSvgMaskSlider.tsx',
      dest: 'components/MorphingSvgMaskSlider.tsx',
    },
  ],
  'nextjs-conf-cta': [
    {
      src: 'src/components/nextjs-conf-cta/NextjsConfCTA.tsx',
      dest: 'components/NextjsConfCTA.tsx',
    },
  ],
};

async function main() {
  for (const [slug, entries] of Object.entries(FILE_MAP)) {
    const doc = await client.fetch(
      `*[_type == "project" && slug.current == $slug][0]{_id, title}`,
      { slug },
    );
    if (!doc?._id) {
      console.log(`x ${slug} — no Sanity doc, skipping`);
      continue;
    }

    const codeFiles = entries.map((e, i) => ({
      _key: `cf_${i}`,
      _type: 'codeFile',
      filename: e.dest,
      content: e.inline ?? fs.readFileSync(e.src, 'utf8'),
    }));

    const readme = READMES[slug];
    if (readme) {
      codeFiles.push({
        _key: `cf_readme`,
        _type: 'codeFile',
        filename: 'README.md',
        content: readme,
      });
    }

    await client.patch(doc._id).set({ codeFiles }).commit();
    console.log(
      `OK ${doc.title} — ${codeFiles.length} file${codeFiles.length === 1 ? '' : 's'}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
