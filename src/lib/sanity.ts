import { createClient } from 'next-sanity';
import imageUrlBuilder from '@sanity/image-url';

// Read the legacy PUBLIC_SANITY_* names that are already configured on Vercel
// (kept from the Astro era). NEXT_PUBLIC_ prefix isn't needed because the
// Sanity client is only invoked server-side here.
export const projectId =
  process.env.PUBLIC_SANITY_PROJECT_ID ??
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
export const dataset =
  process.env.PUBLIC_SANITY_DATASET ??
  process.env.NEXT_PUBLIC_SANITY_DATASET!;
export const apiVersion =
  process.env.PUBLIC_SANITY_API_VERSION ??
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ??
  '2025-01-01';

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});

const builder = imageUrlBuilder(sanityClient);

type SanityImageSource = Parameters<typeof builder.image>[0];

export const urlFor = (source: SanityImageSource) => builder.image(source);

export function fileUrl(ref: string | undefined): string | null {
  if (!ref) return null;
  const [, id, ext] = ref.split('-');
  if (!id || !ext) return null;
  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${id}.${ext}`;
}
