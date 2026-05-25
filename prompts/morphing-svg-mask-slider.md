# Morphing SVG Mask Slider

An image carousel where every slide lives inside an organic SVG clip-path — and the mask shape **morphs** into a completely different blob on each transition. Inspired by tuxkarma.co (Infinite Matter project section).

## Setup

**Works in:** v0 · Lovable · Bolt · Cursor · Next.js App Router · Vite + React. Single drop-in file.

**Dependencies:** `framer-motion` and `flubber` (~6 KB; handles SVG path interpolation between arbitrarily different paths — so the five built-in shapes can be wildly different and still morph smoothly).

```bash
npm i framer-motion flubber
```

**`'use client';` directive:** The component file starts with `'use client';`. **Keep it** in Next.js App Router (v0 default). **Delete that line** in Vite, Lovable, Bolt, or any other plain React setup — it's an inert string there but some bundlers warn on it.

**Fonts:** No custom fonts. The arrow nav buttons use whatever default sans-serif your project provides.

**Tailwind:** Standard utilities only — no custom `tailwind.config` changes, no theme tokens. If you don't have Tailwind, rewrite `className` strings as inline `style` — the layout has no dependency on custom classes.

**Quick usage:**

```tsx
import { MorphingSvgMaskSlider } from './components/MorphingSvgMaskSlider';
// <MorphingSvgMaskSlider images={['https://picsum.photos/seed/a/1200/750', 'https://picsum.photos/seed/b/1200/750']} />
```

---

## Component (paste into `components/MorphingSvgMaskSlider.tsx`)

```tsx
'use client';
import { useId, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { interpolate } from 'flubber';

// ── 5 organic mask shapes (normalized to viewBox 0 0 1000 625) ─────────────
// Flubber handles interpolation between any two paths — they don't need to
// share command structure or segment counts. Each was authored separately
// in Figma / Illustrator and exported as SVG, then scaled to a common viewBox.

const SHAPES = [
  // Wavy pillow — gentle organic rectangle
  'M956.88 624.8C653.09 592.47 346.9 592.47 43.11 624.8 37.67 625.37 32.17 624.77 26.97 623.02S16.98 618.41 12.91 614.64C8.86 610.86 5.62 606.25 3.4 601.1 1.18 595.95 0.04 590.38 0.04 584.74V40.26C0.05 31.62 2.74 23.2 7.74 16.26 12.73 9.32 19.75 4.23 27.76 1.73 33.09 0.07 38.7-0.4 44.22 0.35 346.77 41.55 653.24 41.55 955.79 0.35 964.1-0.79 972.54 0.86 979.88 5.05 987.21 9.24 993.05 15.76 996.52 23.64 998.82 28.86 1000.01 34.53 1000.01 40.26V584.74C1000 593.24 997.38 601.52 992.53 608.4 987.69 615.27 980.87 620.39 973.04 623.02 967.83 624.76 962.33 625.37 956.88 624.8Z',
  // Arched rectangle — curved top, straight sides
  'M48.29 53.81C345.22-17.93 654.83-17.93 951.76 53.81 980 59.79 1000 75.56 1000 102.31V589.16C1000 598.68 996.24 607.81 989.55 614.54 982.86 621.27 973.78 625.05 964.32 625.05H35.61C30.93 625.05 26.29 624.12 21.97 622.32S13.71 617.87 10.41 614.54C7.1 611.2 4.48 607.25 2.69 602.89 0.91 598.54-0.01 593.87 0 589.16V102.31C0 75.52 16.2 60.39 48.29 53.81Z',
  // Four-lobed blob — pinched waist, bulging corners
  'M992.99 156.42C959.96 35.29 804.5-29.04 645.76 12.75L644.04 13.2C549.6 38.56 449.61 38.56 355.17 13.2L353.45 12.75C194.71-29.04 39.22 35.28 6.22 156.42-8.14 209.06 2.98 263.76 33.18 312.2 2.98 360.66-8.14 415.35 6.22 467.98 39.25 589.11 194.71 653.44 353.45 611.66L355.17 611.2C449.61 585.85 549.6 585.85 644.04 611.2L645.76 611.66C804.5 653.44 959.99 589.13 992.99 467.98 1007.35 415.34 996.22 360.65 966.03 312.2 996.22 263.76 1007.35 209.06 992.99 156.42Z',
  // Dome with bumps — rounded top, ear-like corners
  'M1000 312.5C1000 139.91 776.62 0 501.09 0S2.19 139.91 2.19 312.5C2.19 352.07 13.92 389.91 35.34 424.74 11.98 474.35-0.08 528.3 0 582.88 0 594.06 4.55 604.77 12.66 612.67 20.77 620.57 31.76 625.01 43.23 625.01H956.76C968.23 625.01 979.22 620.57 987.33 612.67 995.44 604.77 999.99 594.06 999.99 582.88 1000.06 529.06 988.33 475.85 965.6 426.8 987.8 391.37 1000 352.83 1000 312.5Z',
  // Barrel / screen — classic TV-screen with curved top and bottom
  'M71.13 28.35C72.2 20.48 75.96 13.28 81.7 8.07 87.45 2.87 94.79 0 102.4 0 364.68 55.1 634.84 55.1 897.13 0 904.73 0 912.08 2.87 917.82 8.07 923.56 13.28 927.32 20.48 928.39 28.35L964.43 291.66 999.19 545.61C999.83 550.29 999.5 555.06 998.22 559.6 996.95 564.14 994.75 568.35 991.79 571.92 988.82 575.5 985.16 578.36 981.04 580.33 976.92 582.3 972.45 583.31 967.92 583.32 658.05 638.56 341.47 638.56 31.6 583.32 27.07 583.32 22.6 582.3 18.48 580.33 14.36 578.37 10.69 575.5 7.73 571.92 4.76 568.35 2.57 564.15 1.29 559.61 0.02 555.07-0.31 550.29 0.33 545.61L35.09 291.66Z',
];

type Props = {
  /** Array of image URLs for the slider. */
  images: string[];
  /** Custom SVG path d-strings (any structure — flubber handles morphing). */
  shapes?: string[];
  /** Morph + crossfade duration in seconds. Default 0.8. */
  duration?: number;
  /** Enable auto-play. Default false. */
  autoPlay?: boolean;
  /** Auto-play interval in ms. Default 4000. */
  interval?: number;
};

export function MorphingSvgMaskSlider({
  images,
  shapes = SHAPES,
  duration = 0.8,
  autoPlay = false,
  interval = 4000,
}: Props) {
  const clipId = useId();
  const [index, setIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const prevIndex = useRef(0);
  const pathString = useMotionValue(shapes[0]);

  const goTo = useCallback(
    (dir: 1 | -1) => {
      setIndex((prev) => {
        prevIndex.current = prev;
        const next = prev + dir;
        if (next < 0) return images.length - 1;
        if (next >= images.length) return 0;
        return next;
      });
    },
    [images.length],
  );

  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(() => goTo(1), interval);
    return () => clearInterval(id);
  }, [autoPlay, goTo, interval]);

  // Morph the clip-path via flubber whenever index changes
  useEffect(() => {
    if (prevIndex.current === index) return;
    const fromShape = shapes[prevIndex.current % shapes.length];
    const toShape = shapes[index % shapes.length];
    const interpolator = interpolate(fromShape, toShape, { maxSegmentLength: 4 });

    const controls = animate(0, 1, {
      duration,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (latest) => pathString.set(interpolator(latest)),
    });

    return () => controls.stop();
  }, [index, shapes, duration, pathString]);

  // Scale breathing — shrink then spring back on each slide change (skip first)
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const el = wrapRef.current;
    if (!el) return;

    el.style.transition = `transform ${duration * 0.35}s cubic-bezier(0.4, 0, 1, 1)`;
    el.style.transform = 'scale(0.93)';

    const timer = setTimeout(() => {
      el.style.transition = `transform ${duration * 0.5}s cubic-bezier(0.16, 1, 0.3, 1)`;
      el.style.transform = 'scale(1)';
    }, duration * 350);

    return () => clearTimeout(timer);
  }, [index, duration]);

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <div ref={wrapRef} className="w-full" style={{ maxWidth: 800 }}>
        <svg
          viewBox="0 0 1000 625"
          className="w-full"
          role="img"
          aria-label="Image slider"
        >
          <defs>
            <clipPath id={clipId}>
              <motion.path d={pathString} />
            </clipPath>
          </defs>

          <g clipPath={`url(#${clipId})`}>
            <AnimatePresence mode="sync" initial={false}>
              <motion.image
                key={index}
                href={images[index]}
                x={0}
                y={0}
                width={1000}
                height={625}
                preserveAspectRatio="xMidYMid slice"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration * 0.65, ease: 'easeInOut' }}
              />
            </AnimatePresence>
          </g>
        </svg>
      </div>

      {/* Prev / Next */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => goTo(-1)}
          className="grid place-items-center w-12 h-12 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-shadow text-gray-800"
          aria-label="Previous slide"
        >
          <Arrow direction="left" />
        </button>
        <button
          onClick={() => goTo(1)}
          className="grid place-items-center w-12 h-12 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-shadow text-gray-800"
          aria-label="Next slide"
        >
          <Arrow direction="right" />
        </button>
      </div>
    </div>
  );
}

function Arrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={direction === 'left' ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
```

## Use it

```tsx
<MorphingSvgMaskSlider
  images={[
    '/photo-1.jpg',
    '/photo-2.jpg',
    '/photo-3.jpg',
    '/photo-4.jpg',
    '/photo-5.jpg',
  ]}
/>
```

Any images work — landscape or portrait. SVG `preserveAspectRatio="xMidYMid slice"` centers and covers (CSS `object-fit: cover` equivalent).

### Paste-and-run demo (no asset hunt)

Picsum serves deterministic images per seed, no API key, CORS-safe:

```tsx
<MorphingSvgMaskSlider
  images={[
    'https://picsum.photos/seed/morph1/1200/750',
    'https://picsum.photos/seed/morph2/1200/750',
    'https://picsum.photos/seed/morph3/1200/750',
    'https://picsum.photos/seed/morph4/1200/750',
    'https://picsum.photos/seed/morph5/1200/750',
  ]}
/>
```

Click the arrows — each transition morphs the mask to a different organic shape while crossfading the photo.

## How it works (1-minute mental model)

1. Five organic SVG `<path>` strings are defined as constants — each was authored visually (in Figma / Illustrator) and exported as SVG, then scaled to a common `0 0 1000 625` viewBox so they all occupy the same coordinate space.
2. `flubber.interpolate(from, to)` returns a function `t → pathString`. Flubber handles the math of morphing between arbitrary paths — it normalizes segment counts, matches up control points, and produces visually clean intermediate paths.
3. Framer-motion's `animate(0, 1, { onUpdate })` drives `t` from 0 → 1 over `duration` seconds. Each frame we call the interpolator and push the result into a `useMotionValue`.
4. The `<motion.path d={pathString}>` reads the motion value directly — no React re-renders during the morph, just direct DOM updates.
5. Inside the clipped `<g>`, `AnimatePresence mode="sync"` crossfades images — outgoing and incoming render simultaneously with opposing opacity transitions.
6. A vanilla CSS scale pulse (1 → 0.93 → 1) plays on the wrapper `div` each slide change — the quick shrink-then-spring-back creates an elastic "breathing" feel during transitions.
7. The combination of shape morph + scale breathing + image crossfade produces the liquid, shape-shifting effect.

## Tweak knobs

| Want | Change |
|---|---|
| Faster / slower transition | `duration` prop (default 0.8s) |
| Different mask shapes | Pass custom `shapes` array — paths can have any structure; flubber handles the interpolation |
| Smoother morph (more intermediate points) | Lower `maxSegmentLength` in the `interpolate(..., { maxSegmentLength })` call — try `2` for ultra-smooth (slightly higher CPU) |
| Deeper breathing | Change `0.93` in the scale effect to `0.85` for more dramatic elastic |
| No breathing | Remove the scale `useEffect` block entirely |
| Snappier easing | Change `[0.4, 0, 0.2, 1]` to `[0.16, 1, 0.3, 1]` |
| Auto-play | `autoPlay={true} interval={3000}` |
| Different aspect ratio | Change the viewBox to `0 0 1000 1000` (square) and re-export your shapes to match — flubber doesn't care about the aspect ratio |
| Bigger nav buttons | Change `w-12 h-12` on the buttons to `w-14 h-14` |

## Adding your own shapes

1. Design 3–10 shapes in Figma / Illustrator at a consistent canvas size (e.g., 1000 × 625).
2. Export each as SVG, copy the `<path d="...">` string.
3. If your canvas isn't 1000 × 625, scale the coordinates: multiply X values by `1000/canvas-width` and Y values by `625/canvas-height`. Tools like `svgpath` (`npm i svgpath`) can do this in one line: `svgpath(d).abs().scale(sx, sy).round(2).toString()`.
4. Drop the path strings into the `SHAPES` array (or pass via the `shapes` prop).

## Mobile fallback

The arrow buttons work on touch. To add swipe:

```tsx
// Wrap the SVG wrapper div with drag detection
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  dragElastic={0.2}
  onDragEnd={(_, info) => {
    if (info.offset.x < -50) goTo(1);
    if (info.offset.x > 50) goTo(-1);
  }}
>
  {/* existing SVG slider */}
</motion.div>
```

For `prefers-reduced-motion`, set `duration={0}` to skip all animations.

## Done.

One array of image URLs, one component file, ~160 lines, `npm i framer-motion flubber`. Five organic mask shapes morph between each other on every slide transition. Open in v0 / Lovable / Bolt and ship.
