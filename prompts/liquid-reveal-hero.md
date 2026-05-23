# Liquid Reveal Hero

Build a fullscreen hero where a portrait swaps to a "reveal" image (helmet / alt shot) under an organic, cursor-following goo blob. Inspired by landonorris.com (OFF+BRAND).

**Stack:** React + Tailwind + framer-motion. **No** Three.js, **no** custom shaders, **no** Vite plugins. Drop-in single file — works in v0, Lovable, Bolt, Next.js, or plain Vite/React.

## Install

```bash
npm i framer-motion
```

That's it. Tailwind is assumed. If you don't have Tailwind, replace the `className` strings with inline `style` — the layout is all `absolute` positioning + clamp() values.

## Component (paste into `components/LiquidRevealHero.tsx`)

```tsx
'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useTime } from 'framer-motion';

type Props = {
  /** Base image, always visible. Square or portrait, any size. */
  portraitSrc: string;
  /** Revealed image under the cursor blob. */
  revealSrc: string;
  /** Top-left wordmark. */
  firstName?: string;
  /** Bottom-right wordmark. */
  lastName?: string;
  /** Giant outlined text behind the subject. */
  backdrop?: string;
  /** Radius of the largest blob in px. */
  blobSize?: number;
};

export function LiquidRevealHero({
  portraitSrc,
  revealSrc,
  firstName = 'LANDO',
  lastName = 'NORRIS',
  backdrop = '04',
  blobSize = 140,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  // Cursor → local coords
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const r = wrapRef.current?.getBoundingClientRect();
      if (!r) return;
      const inside =
        e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top && e.clientY <= r.bottom;
      setHovering(inside);
      if (inside) {
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mx, my]);

  // Three springs at decreasing stiffness create a trailing "snake" of blobs
  const head  = { x: useSpring(mx, { stiffness: 250, damping: 30 }), y: useSpring(my, { stiffness: 250, damping: 30 }) };
  const body1 = { x: useSpring(mx, { stiffness: 220, damping: 34 }), y: useSpring(my, { stiffness: 220, damping: 34 }) };
  const body2 = { x: useSpring(mx, { stiffness: 190, damping: 38 }), y: useSpring(my, { stiffness: 190, damping: 38 }) };

  // Fourth "satellite" blob wobbles around the head for organic motion
  const time = useTime();
  const wobble = blobSize * 0.35;
  const satX = useTransform(time, (t) => head.x.get() + Math.sin(t * 0.002) * wobble);
  const satY = useTransform(time, (t) => head.y.get() + Math.cos(t * 0.002) * wobble);

  // Radius "breathing" — each circle's size pulses ±6% on its own phase, so the
  // blob edge never looks mechanically circular. Phases offset by 0/0.5/1.0/1.5
  // keep the four circles from breathing in sync.
  const headR  = useTransform(time, (t) => blobSize * 0.80 * (1 + Math.sin(t * 0.0017)        * 0.06));
  const body1R = useTransform(time, (t) => blobSize * 0.60 * (1 + Math.sin(t * 0.0017 + 0.5)  * 0.06));
  const body2R = useTransform(time, (t) => blobSize * 0.45 * (1 + Math.sin(t * 0.0017 + 1.0)  * 0.06));
  const satR   = useTransform(time, (t) => blobSize * 0.60 * (1 + Math.sin(t * 0.0017 + 1.5)  * 0.06));

  const maskId = useId();
  const filterId = useId();

  return (
    <section
      ref={wrapRef}
      className="relative w-screen h-screen overflow-hidden bg-black text-white cursor-crosshair"
    >
      {/* Neon-lime outlined backdrop number */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none select-none z-0">
        <span
          aria-hidden
          className="font-black italic leading-[0.85] tracking-[-0.05em] text-transparent"
          style={{
            WebkitTextStroke: '2.5px #d2ff00',
            fontSize: 'clamp(165px, 31.5vw, 540px)',
            filter:
              'drop-shadow(0 0 24px rgba(210,255,0,0.4)) drop-shadow(0 0 48px rgba(210,255,0,0.2))',
          }}
        >
          {backdrop}
        </span>
      </div>

      {/* The "goo" filter — Lucas Bebber's classic technique.
          feGaussianBlur softens edges, feColorMatrix clamps alpha
          back to a hard threshold so overlapping circles merge into ONE shape. */}
      <svg width={0} height={0} className="absolute">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
          <mask id={maskId}>
            <g filter={`url(#${filterId})`}>
              {hovering && (
                <>
                  <motion.circle cx={satX}    cy={satY}    r={satR}   fill="white" />
                  <motion.circle cx={head.x}  cy={head.y}  r={headR}  fill="white" />
                  <motion.circle cx={body1.x} cy={body1.y} r={body1R} fill="white" />
                  <motion.circle cx={body2.x} cy={body2.y} r={body2R} fill="white" />
                </>
              )}
            </g>
          </mask>
        </defs>
      </svg>

      {/* Base portrait — always visible */}
      <img
        src={portraitSrc}
        alt=""
        className="absolute inset-0 w-full h-full object-contain object-bottom select-none pointer-events-none z-10"
      />

      {/* Reveal layer — only visible inside the goo mask */}
      <img
        src={revealSrc}
        alt=""
        className="absolute inset-0 w-full h-full object-contain object-bottom select-none pointer-events-none z-10"
        style={{ mask: `url(#${maskId})`, WebkitMask: `url(#${maskId})` }}
      />

      {/* Wordmarks — dramatic blur-in entrance */}
      <motion.h1
        initial={{ opacity: 0, filter: 'blur(28px)', scale: 1.06 }}
        animate={{ opacity: 1, filter: 'blur(0px)',  scale: 1 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute m-0 font-black uppercase tracking-[-0.03em] text-white z-20"
        style={{
          top: 'clamp(36px, 5vw, 80px)',
          left: 'clamp(28px, 4vw, 56px)',
          fontSize: 'clamp(48px, 6.75vw, 114px)',
          lineHeight: 0.92,
        }}
      >
        {firstName}
      </motion.h1>

      <motion.h2
        initial={{ opacity: 0, filter: 'blur(28px)', scale: 1.06 }}
        animate={{ opacity: 1, filter: 'blur(0px)',  scale: 1 }}
        transition={{ duration: 1.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="absolute m-0 font-black uppercase tracking-[-0.03em] text-white z-20"
        style={{
          bottom: 'clamp(36px, 5vw, 80px)',
          right: 'clamp(28px, 4vw, 56px)',
          fontSize: 'clamp(48px, 6.75vw, 114px)',
          lineHeight: 0.92,
        }}
      >
        {lastName}
      </motion.h2>

      {/* Hover hint */}
      <motion.span
        initial={{ opacity: 0, filter: 'blur(6px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.9, delay: 0.5 }}
        className="absolute uppercase font-medium z-20 text-white/60"
        style={{
          left: 'clamp(28px, 4vw, 56px)',
          bottom: 'clamp(36px, 4vw, 56px)',
          fontSize: 11,
          letterSpacing: '0.22em',
        }}
      >
        Hover to reveal
      </motion.span>

      {/* External link CTA */}
      <motion.a
        initial={{ opacity: 0, filter: 'blur(6px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.9, delay: 0.6 }}
        href="#"
        className="absolute uppercase font-semibold text-white border border-white/25 rounded-full hover:bg-[#d2ff00] hover:text-black hover:border-[#d2ff00] transition-all z-20"
        style={{
          top: 'clamp(36px, 5vw, 56px)',
          right: 'clamp(28px, 4vw, 56px)',
          padding: '10px 18px',
          fontSize: 12,
          letterSpacing: '0.18em',
        }}
      >
        View Original ↗
      </motion.a>
    </section>
  );
}
```

## Use it

```tsx
<LiquidRevealHero
  portraitSrc="/portrait.webp"
  revealSrc="/helmet.webp"
  firstName="LANDO"
  lastName="NORRIS"
  backdrop="04"
/>
```

Any two images work. Best results: portrait-orientation PNGs/WebPs with a transparent or matching-color background, subject anchored to the bottom of the frame.

### Paste-and-run demo (no asset hunt)

For instant gratification in v0 / Lovable / Bolt — Picsum serves a deterministic image per seed, no API key, CORS-safe:

```tsx
<LiquidRevealHero
  portraitSrc="https://picsum.photos/seed/portrait/1200/1600"
  revealSrc="https://picsum.photos/seed/helmet/1200/1600"
/>
```

You'll see two random photos swap on hover — enough to verify the effect works. Then swap the URLs for your real assets.

## How the goo works (1-minute mental model)

1. Four `<circle>` elements follow the cursor through springs of different stiffness — they're physically separate but visually we want **one** organic blob.
2. Each circle's radius also **breathes** — `useTransform(time, …)` modulates each `r` by ±6% on its own phase, so the blob edge never looks mechanically circular.
3. `feGaussianBlur` softens each circle's edge into a fuzzy gradient.
4. `feColorMatrix` with `values="… 0 0 0 18 -7"` multiplies alpha by 18 then offsets by -7 — anything in the fuzzy zone snaps back to either fully opaque or fully transparent.
5. Result: overlapping circles **merge into a single liquid shape** with a continuous, slightly pulsing outline.
6. That merged shape is used as a CSS `mask` on the reveal image — the reveal only shows where the blob is.
7. The section sets `cursor: crosshair` so visitors immediately read the area as interactive.

This is the same technique as [Lucas Bebber's gooey buttons](https://css-tricks.com/gooey-effect/), with a radius-breathing trick borrowed from shader-based hero implementations like landonorris.com.

## Tweak knobs

| Want | Change |
|---|---|
| Bigger blob | `blobSize` prop (default 140) |
| Gooier / softer edges | `stdDeviation` in `feGaussianBlur` (10–18 range) |
| Sharper merge | First `18` in `feColorMatrix` values — raise to 22, 26 |
| Slower trail | Lower `stiffness` on the springs (180, 150, 120) |
| Stronger / weaker breathing | The `0.06` multiplier in each `useTransform(time, …)` call — raise to `0.10` for a more visible pulse, lower to `0.03` for subtler |
| Faster / slower breathing | The `0.0017` time scalar in each `useTransform` — raise it to speed up the pulse |
| Different cursor | Change `cursor-crosshair` on the section to `cursor-none` (for an invisible cursor → the blob *is* your cursor) |
| Different palette | Swap `#d2ff00` (lime) anywhere it appears |

## Mobile fallback

Touch devices don't have a cursor, so the reveal never triggers. Detect and hide:

```tsx
const isTouch = typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches;
if (isTouch) return <StaticHero />; // just the portrait + wordmarks
```

## Done.

Two image URLs, one component file, ~170 lines, one `npm i framer-motion`. Open in v0 / Lovable / Bolt and ship.
