# Next.js Conf 2025 CTA — Random Pixel Scatter Button

> **Recreate this exact component.** Paste this entire prompt into any AI coding tool (Claude Code, Cursor, v0, Lovable, Bolt…) — it's self-contained, with the full source included below. **Stack:** React 18 + TypeScript, styled with Tailwind CSS (swap the `className`s for inline styles if you're not using Tailwind). **Dependencies:** none — pure React + CSS.

A bold call-to-action button inspired by the Next.js Conf 2025 "Get Tickets" CTA. A blue button sits inside a white card. On hover, white pixels **flash on and off at chaotic, fully-independent random times** across the entire button surface — every pixel decides when to appear and disappear on its own, so the pattern at any given frame is pure scatter, not a clean wave. A small directional bias means more activity drifts toward the centre early on enter (and toward the edges early on leave) without producing a visible wavefront.

## Setup

**Works in:** v0 · Lovable · Bolt · Cursor · Next.js App Router · Vite + React. Single drop-in file.

**Dependencies:** Zero runtime deps — pure React + Tailwind + `setTimeout`.

```bash
# No npm install needed.
```

**`'use client';` directive:** The component file starts with `'use client';`. **Keep it** in Next.js App Router (v0 default). **Delete that line** in Vite, Lovable, Bolt, or any other plain React setup — it's an inert string there but some bundlers warn on it.

**Fonts:** The button text is set in **Roboto Mono** (with a `ui-monospace` system fallback so it still renders if the font fails to load). To load it, add this to your `<head>` (`index.html` in Vite/Lovable/Bolt, or `app/layout.tsx` in Next.js):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
```

Alternatively, add `@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap');` at the very top of your global CSS.

**Tailwind:** Standard utilities only — no custom `tailwind.config` changes, no theme tokens. If you don't have Tailwind, rewrite `className` strings as inline `style` — the layout has no dependency on custom classes.

**Quick usage:**

```tsx
import NextjsConfCTA from './components/NextjsConfCTA';
// <NextjsConfCTA />
```

---

## Component (paste into `components/NextjsConfCTA.tsx`)

```tsx
'use client';

import { useEffect, useRef } from 'react';

const COLS = 32;
const ROWS = 8;
const TOTAL = COLS * ROWS;
const BTN_WIDTH = 320;
const BTN_HEIGHT = 80;

const SHOW_WINDOW_MS = 380;
const VISIBLE_MIN_MS = 60;
const VISIBLE_MAX_MS = 200;
const DIRECTION_BIAS_MS = 80;

function ArrowRightCircle() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ marginTop: -2 }}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 16 16 12 12 8" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

export default function NextjsConfCTA() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const btn = btnRef.current;
    const bg = bgRef.current;
    if (!btn || !bg) return;

    const pixels = Array.from(bg.querySelectorAll<HTMLSpanElement>('span'));
    let timeouts: ReturnType<typeof setTimeout>[] = [];
    let isActive = false;
    const centerX = (COLS - 1) / 2;

    const animatePixels = (activate: boolean) => {
      isActive = activate;
      timeouts.forEach(clearTimeout);
      timeouts = [];

      pixels.forEach((p) => { p.style.display = 'none'; });

      pixels.forEach((p, idx) => {
        const col = idx % COLS;
        const distFromCenter = Math.abs(col - centerX) / centerX;
        const bias = activate ? distFromCenter : 1 - distFromCenter;

        const showAt = bias * DIRECTION_BIAS_MS + Math.random() * SHOW_WINDOW_MS;
        const visibleFor = VISIBLE_MIN_MS + Math.random() * (VISIBLE_MAX_MS - VISIBLE_MIN_MS);

        timeouts.push(setTimeout(() => { p.style.display = 'block'; }, showAt));
        timeouts.push(setTimeout(() => { p.style.display = 'none'; }, showAt + visibleFor));
      });
    };

    const onEnter = () => { if (!isActive) animatePixels(true); };
    const onLeave = () => { if (isActive) animatePixels(false); };

    btn.addEventListener('mouseenter', onEnter);
    btn.addEventListener('mouseleave', onLeave);

    return () => {
      timeouts.forEach(clearTimeout);
      btn.removeEventListener('mouseenter', onEnter);
      btn.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div
      className="inline-flex items-center justify-center bg-white"
      style={{
        padding: '80px 120px',
        borderRadius: 12,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
        fontFamily: '"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      }}
    >
      <button
        ref={btnRef}
        type="button"
        className="relative overflow-hidden cursor-pointer"
        style={{
          width: BTN_WIDTH,
          height: BTN_HEIGHT,
          background: '#1a62ff',
          border: 'none',
          outline: 'none',
          padding: 0,
        }}
      >
        <div
          ref={bgRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          {Array.from({ length: TOTAL }).map((_, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const pxW = 100 / COLS;
            const pxH = 100 / ROWS;
            return (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  left: `${col * pxW}%`,
                  top: `${row * pxH}%`,
                  width: `${pxW}%`,
                  height: `${pxH}%`,
                  backgroundColor: '#ffffff',
                  display: 'none',
                }}
              />
            );
          })}
        </div>

        <div
          className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center pointer-events-none"
          style={{ zIndex: 2, color: '#ffffff' }}
        >
          <div className="flex items-center" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '2px', gap: 8, marginBottom: 4 }}>
            GET TICKETS
            <ArrowRightCircle />
          </div>
          <div style={{ fontSize: 11, fontWeight: 400, letterSpacing: '1.5px', color: 'rgba(255, 255, 255, 0.9)' }}>
            IN PERSON &amp; VIRTUAL
          </div>
        </div>
      </button>
    </div>
  );
}
```

## How it works

1. **Pixel grid** — 32 × 8 = 256 absolutely-positioned `<span>`s tile the 320 × 80 button. All hidden by default, so the button is solid blue at rest.

2. **Per-pixel independent timing** — Unlike a stagger animation that orders pixels in sequence, every pixel here picks its own `showAt` and `visibleFor` independently:
   - `showAt = bias * 80 + Math.random() * 380` → somewhere in the first ~460 ms
   - `visibleFor = 60 + Math.random() * 140` → visible for 60–200 ms before disappearing
   
   Because every pixel rolls its own dice, no two adjacent pixels light up together — the pattern at any frame is pure scatter (verified at peak: ~100 of 256 pixels spread across all 8 rows and all 32 columns in chaotic positions, never forming a band).

3. **Tiny directional drift** — The `bias` term nudges centre-column pixels to roll slightly earlier on `mouseenter` (and edge-column pixels slightly earlier on `mouseleave`). At only 80 ms of bias against a 380 ms random window, this drift is barely visible as a directional flavour — never a clean wavefront.

4. **Density envelope** — Because each pixel's `showAt` is uniformly random over the window and `visibleFor` is bounded, the *number* of pixels visible at any moment rises and falls in a smooth bell curve while the *positions* remain chaotic.

5. **`isActive` guard** — Prevents re-triggering on duplicate enter/leave events so the animation runs cleanly once per state change.

## Customisation

| Knob | Effect |
|------|--------|
| `SHOW_WINDOW_MS` | Spread of randomised show times — larger = sparser activity over a longer animation |
| `VISIBLE_MIN_MS` / `VISIBLE_MAX_MS` | How long each pixel stays on once shown |
| `DIRECTION_BIAS_MS` | Strength of the centre→edges drift. Set to 0 for fully directionless scatter |
| `COLS` / `ROWS` | Grid density — more pixels = finer scatter, fewer = chunkier blocks |
| Pixel `backgroundColor` | Colour of the "broken" spots — white = blue button looks shattered |
