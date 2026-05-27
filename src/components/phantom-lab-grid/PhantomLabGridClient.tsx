'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { InfiniteGridClass } from './grid-engine';
import type { CardData, TileClickEventDetail } from './grid-engine/types';

/**
 * Client wrapper around the OGL InfiniteGridClass engine. Renders a
 * full-bleed WebGL canvas of card tiles, pannable with momentum. Clicking
 * a tile routes to `/projects/[slug]`.
 *
 * Mount guard: React StrictMode + Fast Refresh in dev can run this effect
 * twice in quick succession. We use a ref-guarded singleton + a stale-stamp
 * so only one engine ever exists for a given container, and any stray
 * <canvas> children from a previous instance are pruned on mount.
 */
export default function PhantomLabGridClient({ cards }: { cards: CardData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<InfiniteGridClass | null>(null);
  const router = useRouter();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || cards.length === 0) return;

    // Guard against double-mount: if an instance is already running on
    // this container, leave it alone.
    if (gridRef.current) return;

    // Defensive: prune any orphan canvases left behind by a previous
    // mount whose cleanup didn't fully run (Fast Refresh, etc.).
    container.querySelectorAll('canvas').forEach((c) => c.remove());

    const onTileClicked = (e: Event) => {
      const slug = (e as CustomEvent<TileClickEventDetail>).detail.cardData.slug;
      if (slug) router.push(`/projects/${slug}`);
    };
    container.addEventListener('tileClicked', onTileClicked);

    const grid = new InfiniteGridClass(container, cards, {
      gridCols: 3,
      gridRows: 3,
      tileSize: 3,
      baseCameraZ: 10,
      enablePostProcessing: true,
      postProcessParams: {
        distortionIntensity: 0,
        vignetteOffset: 0.3,
        vignetteDarkness: 1.25,
      },
    });
    gridRef.current = grid;

    grid.init().catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error('[PhantomLabGrid] init error:', err);
    });

    return () => {
      container.removeEventListener('tileClicked', onTileClicked);
      grid.dispose();
      gridRef.current = null;
    };
  }, [cards, router]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Phantom Lab Grid"
      className="absolute inset-0 h-full w-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: 'none', background: '#080808' }}
    />
  );
}
