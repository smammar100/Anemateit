# 3D Perspective Card with Lifting Highlights

A card that tilts toward your cursor in 3D space. Phrases marked as `<Highlight>` physically rise forward — a `translate` going one direction and a `box-shadow` going the other create the illusion of depth.

## Setup

**Works in:** v0 · Lovable · Bolt · Cursor · Next.js App Router · Vite + React. Single drop-in file.

**Dependencies:** Zero runtime deps — pure React + Tailwind + CSS transforms.

```bash
# No npm install needed.
```

**`'use client';` directive:** The component file starts with `'use client';`. **Keep it** in Next.js App Router (v0 default). **Delete that line** in Vite, Lovable, Bolt, or any other plain React setup — it's an inert string there but some bundlers warn on it.

**Fonts:** No custom fonts. Uses whatever default sans-serif your project provides.

**Tailwind:** Standard utilities + a couple of arbitrary-value brackets (`[perspective:1200px]`, `[transform-style:preserve-3d]`). No custom `tailwind.config` changes, no theme tokens. If you don't have Tailwind, rewrite `className` strings as inline `style` — the layout has no dependency on custom classes.

**Quick usage:**

```tsx
import { Perspective, Highlight } from './components/PerspectiveHighlight';
// <Perspective><p>Tilt me, <Highlight color="green">lift this</Highlight></p></Perspective>
```

---

## Component (paste into `components/PerspectiveHighlight.tsx`)

```tsx
'use client';
import { useEffect, useRef } from 'react';

type PerspectiveProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Max tilt up/down in degrees. Default 14. */
  maxRotateX?: number;
  /** Max tilt left/right in degrees. Default 30. */
  maxRotateY?: number;
  /** Lerp factor 0–1. Higher = snappier follow. Default 0.12. */
  smoothing?: number;
};

export function Perspective({
  maxRotateX = 14,
  maxRotateY = 30,
  smoothing = 0.12,
  className = '',
  children,
  ...props
}: PerspectiveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let targetX = 0, targetY = 0, rotX = 0, rotY = 0, raf = 0;

    const onMove = (e: MouseEvent) => {
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      // Full strength inside the card, fade across the next 2 card-radii outside.
      const dist = Math.hypot(dx, dy);
      const falloff = dist <= 1 ? 1 : Math.max(0, 1 - (dist - 1) / 2);
      targetX = clamp(dy, -1, 1) * maxRotateX * falloff;
      targetY = -clamp(dx, -1, 1) * maxRotateY * falloff;
    };
    const onLeave = () => { targetX = 0; targetY = 0; };

    const tick = () => {
      rotX += (targetX - rotX) * smoothing;
      rotY += (targetY - rotY) * smoothing;
      // "lift" = how far we are from rest, 0→1. Drives highlight rise + shadow.
      const lift = Math.min(1, Math.hypot(rotX / maxRotateX, rotY / maxRotateY));
      container.style.setProperty('--rx', `${rotX.toFixed(2)}deg`);
      container.style.setProperty('--ry', `${rotY.toFixed(2)}deg`);
      container.style.setProperty('--lift', lift.toFixed(3));
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    tick();
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [maxRotateX, maxRotateY, smoothing]);

  return (
    <div ref={containerRef} className={`[perspective:1200px] ${className}`} {...props}>
      <div className="[transform-style:preserve-3d]">
        <div
          ref={cardRef}
          className="max-w-[480px] p-10 will-change-transform"
          style={{ transform: 'rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

type HighlightColor = 'red' | 'purple' | 'green';

export function Highlight({
  color = 'green',
  className = '',
  style,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { color?: HighlightColor }) {
  // Inline palette so the component is self-contained — no CSS variables to wire up.
  const palette = {
    red:    { bg: '#e89c9c', ring: '220, 130, 130' },
    purple: { bg: '#b8a0db', ring: '160, 120, 220' },
    green:  { bg: '#9fd68d', ring: '120, 200, 100' },
  }[color];

  return (
    <span
      className={`inline-block rounded-[3px] px-1 text-white ${className}`}
      style={{
        background: palette.bg,
        transform: 'translate(calc(-8px * var(--lift,0)), calc(-6px * var(--lift,0)))',
        boxShadow:
          `rgba(${palette.ring}, calc(0.8 * var(--lift,0))) 2px 1.5px 0px 0.75px, ` +
          `rgba(${palette.ring}, calc(0.3 * var(--lift,0))) 8px 4px 4px 0px`,
        willChange: 'transform, box-shadow',
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
```

## Use it

```tsx
import { Perspective, Highlight } from './components/PerspectiveHighlight';

export default function Page() {
  return (
    <div className="grid min-h-screen place-items-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <Perspective>
        <article className="text-[15px] leading-[1.75] text-zinc-600 dark:text-zinc-400">
          <p className="mb-[1.1em]">
            <Highlight color="red">Three nested wrappers</Highlight>, each with one job. Strip any of them out and the whole illusion collapses back into a flat rectangle on a page.
          </p>
          <p className="mb-[1.1em]">
            <Highlight color="purple">The whole effect rides on CSS's perspective property.</Highlight>{' '}
            The outer wrapper defines the 3D space, the middle one preserves it, and only the inner card actually rotates.
          </p>
          <p>
            <Highlight color="green">The card tilts toward wherever your cursor goes.</Highlight>{' '}
            Move closer and it leans in; pull away and it settles flat.
          </p>
        </article>
      </Perspective>
    </div>
  );
}
```

## How it works (3-layer mental model)

The illusion is three nested wrappers, each doing exactly one job:

1. **Outer** (`perspective: 1200px`) — defines the 3D viewing camera. Without this, everything stays flat.
2. **Middle** (`transform-style: preserve-3d`) — tells children to keep their 3D positions when transformed.
3. **Inner card** (`rotateX rotateY`) — the only element that actually rotates. Cursor distance from card center drives the target angle.

A `requestAnimationFrame` loop lerps the actual rotation toward that target using `smoothing` — so motion never snaps. It writes three CSS custom properties on every frame:

- `--rx`, `--ry` — current rotation, in degrees
- `--lift` — magnitude 0→1, "how much we're tilted right now"

The `<Highlight>` spans read `--lift` and use it to drive a `translate` (rise forward/up) plus a `box-shadow` (cast behind, growing). When `--lift = 0`, both are zero — flat. When `--lift = 1`, the highlight rises 8px and casts a long shadow. The eye reads this as a physical 3D object.

## Tweak knobs

| Want | Change |
|---|---|
| More aggressive tilt | `maxRotateY={40}`, `maxRotateX={20}` |
| Snappier follow | `smoothing={0.18}` |
| Looser / floatier follow | `smoothing={0.06}` |
| Add a new highlight color | Add a key to the `palette` object inside `<Highlight>` |
| Larger card | Change `max-w-[480px]` to `max-w-[640px]` |
| More dramatic depth | Lower `perspective:1200px` → `perspective:800px` |
| Less highlight rise | Change `-8px` and `-6px` in the highlight `translate` to smaller values |

## Accessibility

- **Reduced motion:** the effect bails out entirely if `prefers-reduced-motion: reduce` — card stays flat, highlights stay flush.
- **Touch devices:** no `mousemove` fires, so the card renders as a static styled card. Add an explicit fallback if you want a static "lifted" pose:
  ```tsx
  // somewhere in <Perspective>, after the matchMedia check:
  if (matchMedia('(pointer: coarse)').matches) {
    container.style.setProperty('--lift', '0.4');
    return;
  }
  ```

## Done.

One file, two named exports, no npm install. Paste, swap the demo content, ship.
