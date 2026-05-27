import { getAllProjects } from '@/lib/queries';
import { urlFor } from '@/lib/sanity';
import type { CardData } from './grid-engine/types';
import PhantomLabGridClient from './PhantomLabGridClient';

const MIN_CARDS = 9;

/**
 * Server entry for the WebGL Phantom Lab Grid. Pulls Sanity projects,
 * maps each to a tile, and pads the list up to 9 with stock-photo filler
 * cards so the 3x3 group always has a texture for every slot.
 *
 * The WebGL engine loads tile textures via Image() and can't sample mp4
 * frames, so projects with video-only thumbnails fall back to a stable
 * picsum.photos seed keyed by slug. Swap once those projects have a gif
 * or still image.
 */
export default async function PhantomLabGrid() {
  const projects = await getAllProjects();

  const realCards: CardData[] = projects.map((p) => {
    const imageSrc =
      p.thumbnailType === 'gif' && p.thumbnailGif?.asset?._ref
        ? urlFor(p.thumbnailGif).width(800).fit('max').url()
        : `https://picsum.photos/seed/${p.slug.current}/800/600`;
    return {
      title: p.title,
      badge: p.category?.title ?? '',
      description: p.description,
      tags: p.technologies ?? [],
      date: '',
      image: imageSrc,
      imageSrc,
      slug: p.slug.current,
    };
  });

  const fillerCount = Math.max(0, MIN_CARDS - realCards.length);
  const fillerCards: CardData[] = Array.from({ length: fillerCount }, (_, i) => {
    const src = `https://picsum.photos/seed/phantom-grid-filler-${i}/800/600`;
    return { title: '', badge: '', tags: [], date: '', image: src, imageSrc: src };
  });

  return <PhantomLabGridClient cards={[...realCards, ...fillerCards]} />;
}
