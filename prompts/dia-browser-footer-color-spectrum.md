# Dia Browser Footer Color Spectrum

> **Recreate this exact component.** Paste this entire prompt into any AI coding tool (Claude Code, Cursor, v0, Lovable, Bolt…) — it's self-contained, with the full source included below. **Stack:** React 18 + TypeScript, styled with Tailwind CSS (swap the `className`s for inline styles if you're not using Tailwind). **Dependencies:** `npm i gsap`.

> A scroll-revealed color-spectrum footer inspired by the [Dia Browser](https://www.diabrowser.com) landing page. Nine blurred gradient bars unfold from the baseline as you scroll, forming a light spectrum, while wavelength labels rise into a wave. Live theme switching, a blur toggle, and a randomize button. Built on [gsap](https://gsap.com).

The signature element is the footer: an SVG of nine vertical bars, each filled with the same bottom-to-top rainbow gradient and run through a Gaussian blur so they melt into one continuous spectrum — dark at the base, fading to transparent at the crest. The bars step up to a peak in the centre and back down at the edges, like an equaliser frozen mid-frame.

As you scroll, the magic happens: the spectrum scrubs up from a thin glowing seam to full height, the wavelength labels (Violet · 380nm → Beyond · 800nm) rise into a wave that follows the mountain contour, and the centre title fades in. A color switcher lets you swap the entire palette live.

Use it as a hero or page footer for anything that wants a tactile, physics-of-light feel — portfolio sites, product launch pages, "spectrum / frequency / radiation" themed brands.

## Installation

```bash
npm install gsap
```

`gsap` powers the on-mount reveal and the theme-change bounce. The scroll reveal is driven by a plain scroll listener mapped to progress, so no ScrollTrigger or SplitText plugin is required.

## Compatibility

| Framework | Notes |
|-----------|-------|
| Next.js App Router | Default — keep the `'use client';` directive at the top of `DiaSpectrumFooter.tsx`. |
| Vite + React | Delete the `'use client';` line. |
| Lovable / Bolt / v0 | Same as Vite — drop `'use client';`. |
| Tailwind | Used for layout utilities (incl. `scrollbar-hide` and `animate-bounce`). Inline-style equivalents work just as well. |

## Usage

```tsx
import DiaSpectrumFooter from '@/components/dia-spectrum/DiaSpectrumFooter';

// Scroll-scrubbed reveal with controls (the full experience).
// The component owns its own scroll — give the wrapper a real height.
<div className="relative h-[600px] w-full">
  <DiaSpectrumFooter showControls scrollReveal />
</div>

// Quiet preview that reveals on mount and auto-cycles palettes (no scroll).
<div className="relative aspect-[8/5] w-full">
  <DiaSpectrumFooter autoCycle compact />
</div>
```

In `scrollReveal` mode the component is its own scroll container: a pinned stage holds the visuals while an inner spacer supplies the scroll distance that scrubs the reveal. Drop it into a fixed-height parent (`relative h-[600px]`, `fixed inset-0`, etc.).

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showControls` | `boolean` | `false` | Render the theme switcher, blur toggle, and randomize button |
| `scrollReveal` | `boolean` | `false` | Scrub the reveal by scrolling inside the component; shows a "scroll" hint |
| `autoCycle` | `boolean` | `false` | Auto-cycle through the built-in palettes every 2.6s (on-mount mode) |
| `compact` | `boolean` | `false` | Tighten paddings and type for small preview tiles |
| `className` | `string` | `''` | Extra classes on the root element |

## How it works

- **The spectrum** is a single SVG (`viewBox="0 0 1567 584"`, `preserveAspectRatio="none"`) of nine `<path>` bars. Each bar is filled by its own `linearGradient` whose axis runs from the `584` baseline up to the bar's top, so taller bars stretch the same eight color stops over more height.
- **The blur** is an SVG `feGaussianBlur` (`stdDeviation="15"`) applied to the group via `filter`. Toggling it on/off is just adding/removing the `filter` attribute — the bars snap between "hard equaliser" and "soft spectrum."
- **Theme switching** swaps the eight stop colors across all nine gradients from a palette table. Because every gradient shares the same offsets, one palette array repaints the whole spectrum.
- **The scroll reveal** maps scroll progress (0 → 1) onto the visuals: the spectrum scales from `scaleY(0.06)` to `scaleY(1)` (origin bottom), each wavelength column rises by a weight that peaks in the centre — so the labels settle into a wave that traces the spectrum — and the title fades up out of a 6px blur while the scroll hint fades out.
- **Randomize** generates eight random HSL colors and drops them straight into the stops.

## Component source — `DiaSpectrumFooter.tsx`

```tsx
'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { gsap } from 'gsap';

const COLOR_THEMES: Record<string, string[]> = {
  original: ['#340B05', '#0358F7', '#5092C7', '#E1ECFE', '#FFD400', '#FA3D1D', '#FD02F5', '#FFC0FD'],
  'blue-pink': ['#1E3A8A', '#3B82F6', '#A855F7', '#EC4899', '#F472B6', '#F9A8D4', '#FBCFE8', '#FDF2F8'],
  'blue-orange': ['#1E40AF', '#3B82F6', '#60A5FA', '#FFFFFF', '#FED7AA', '#FB923C', '#EA580C', '#9A3412'],
  sunset: ['#FEF3C7', '#FCD34D', '#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F', '#451A03'],
  purple: ['#F3E8FF', '#E9D5FF', '#D8B4FE', '#C084FC', '#A855F7', '#9333EA', '#7C3AED', '#6B21B6'],
  monochrome: ['#1A1A1A', '#404040', '#666666', '#999999', '#CCCCCC', '#E5E5E5', '#F5F5F5', '#FFFFFF'],
  'pink-purple': ['#FDF2F8', '#FCE7F3', '#F9A8D4', '#F472B6', '#EC4899', '#BE185D', '#831843', '#500724'],
  'blue-black': ['#000000', '#0F172A', '#1E293B', '#334155', '#475569', '#64748B', '#94A3B8', '#CBD5E1'],
  'beige-black': ['#FEF3C7', '#F59E0B', '#D97706', '#92400E', '#451A03', '#1C1917', '#0C0A09', '#000000'],
};

const THEME_KEYS = Object.keys(COLOR_THEMES);
const DARK_THEMES = new Set(['blue-black', 'beige-black', 'monochrome']);

// Offsets for the eight gradient stops, matching the original SVG.
const STOP_OFFSETS = [0, 0.182709, 0.283673, 0.413484, 0.586565, 0.682722, 0.802892, 1];

// The nine spectrum bars. `x` is the horizontal centre (gradient axis),
// `y2` the bar top (y1 is always the 584 baseline).
const BARS = [
  { d: 'M1219 584H1393V184H1219V584Z', x: 1306, y2: 184 },
  { d: 'M1045 584H1219V104H1045V584Z', x: 1132, y2: 104 },
  { d: 'M348 584H174L174 184H348L348 584Z', x: 261, y2: 184 },
  { d: 'M522 584H348L348 104H522L522 584Z', x: 435, y2: 104 },
  { d: 'M697 584H522L522 54H697L697 584Z', x: 609.501, y2: 54 },
  { d: 'M870 584H1045V54H870V584Z', x: 957.5, y2: 54 },
  { d: 'M870 584H697L697 0H870L870 584Z', x: 783.501, y2: 0 },
  { d: 'M174 585H0.000183105L-3.75875e-06 295H174L174 585Z', x: 87, y2: 295 },
  { d: 'M1393 584H1567V294H1393V584Z', x: 1480, y2: 294 },
];

const LABELS = [
  { name: 'Violet', kind: 'Waves', nm: '380nm' },
  { name: 'Blue', kind: 'Photons', nm: '450nm' },
  { name: 'Cyan', kind: 'Spectrum', nm: '490nm' },
  { name: 'Green', kind: 'Energy', nm: '530nm' },
  { name: 'Yellow', kind: 'Radiance', nm: '580nm' },
  { name: 'Orange', kind: 'Glow', nm: '620nm' },
  { name: 'Red', kind: 'Shift', nm: '680nm' },
  { name: 'Infrared', kind: 'Heat', nm: '750nm' },
  { name: 'Beyond', kind: 'Visible', nm: '800nm' },
];

// Parallax weight per column — peaks in the centre so the labels rise into
// a wave that follows the spectrum's mountain shape.
const LABEL_LEVELS = [1, 2, 3, 4, 5, 4, 3, 2, 1];

function randomHsl(): string {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(Math.random() * 40) + 60;
  const l = Math.floor(Math.random() * 50) + 30;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

type Props = {
  showControls?: boolean;
  scrollReveal?: boolean;
  autoCycle?: boolean;
  compact?: boolean;
  className?: string;
};

export default function DiaSpectrumFooter({
  showControls = false,
  scrollReveal = false,
  autoCycle = false,
  compact = false,
  className = '',
}: Props) {
  const uid = useId().replace(/:/g, '');
  const [theme, setTheme] = useState('original');
  const [colors, setColors] = useState<string[]>(COLOR_THEMES.original);
  const [blur, setBlur] = useState(true);

  const rootRef = useRef<HTMLDivElement>(null);
  const svgWrapRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const isDark = DARK_THEMES.has(theme);
  const textColor = isDark ? '#ffffff' : '#333333';
  const subColor = isDark ? '#cccccc' : '#666666';
  const bg = isDark ? '#1a1a1a' : '#f5f5f5';

  const bounce = useCallback(() => {
    if (scrollReveal || !svgWrapRef.current) return;
    gsap.fromTo(svgWrapRef.current, { scale: 1 }, { scale: 1.02, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut' });
  }, [scrollReveal]);

  const applyTheme = useCallback((t: string) => {
    setTheme(t);
    setColors(COLOR_THEMES[t]);
    bounce();
  }, [bounce]);

  const randomize = useCallback(() => {
    setColors(Array.from({ length: 8 }, randomHsl));
    bounce();
  }, [bounce]);

  // Map scroll progress (0 → 1) onto the reveal.
  const applyProgress = useCallback((p: number) => {
    const h = rootRef.current?.clientHeight ?? 420;
    if (svgWrapRef.current) {
      svgWrapRef.current.style.transformOrigin = 'bottom';
      svgWrapRef.current.style.transform = `scaleY(${(0.06 + 0.94 * p).toFixed(4)})`;
      svgWrapRef.current.style.opacity = '1';
    }
    const cols = labelsRef.current?.querySelectorAll<HTMLElement>('[data-dia-col]');
    cols?.forEach((el, i) => {
      const level = LABEL_LEVELS[i] ?? 1;
      const reveal = Math.min(1, p * 3);
      el.style.transform = `translateY(${(-p * h * 0.05 * level).toFixed(1)}px)`;
      el.style.opacity = reveal.toFixed(3);
      el.style.filter = `blur(${((1 - reveal) * 6).toFixed(2)}px)`;
    });
    if (titleRef.current) {
      const t = Math.min(1, Math.max(0, (p - 0.05) * 3));
      titleRef.current.style.opacity = t.toFixed(3);
      titleRef.current.style.filter = `blur(${((1 - t) * 6).toFixed(2)}px)`;
      titleRef.current.style.transform = `translate(-50%, calc(-50% + ${((1 - t) * 16).toFixed(1)}px))`;
    }
    if (hintRef.current) {
      hintRef.current.style.opacity = (1 - Math.min(1, p * 3)).toFixed(3);
    }
  }, []);

  // Scroll-scrubbed reveal.
  useEffect(() => {
    if (!scrollReveal) return;
    const root = rootRef.current;
    if (!root) return;
    const update = () => {
      rafRef.current = 0;
      const max = root.scrollHeight - root.clientHeight;
      applyProgress(max > 0 ? Math.min(1, Math.max(0, root.scrollTop / max)) : 0);
    };
    const onScroll = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(update);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => {
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scrollReveal, applyProgress]);

  // On-mount reveal (card / non-scroll usage).
  useEffect(() => {
    if (scrollReveal) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.15 });
      if (svgWrapRef.current) {
        gsap.set(svgWrapRef.current, { scaleY: 0.05, opacity: 0, transformOrigin: 'bottom' });
        tl.to(svgWrapRef.current, { opacity: 1, duration: 0.01 })
          .to(svgWrapRef.current, { scaleY: 1, duration: 1.2, ease: 'power3.out' }, 0);
      }
      if (labelsRef.current) {
        const labels = labelsRef.current.querySelectorAll('[data-dia-label]');
        gsap.set(labels, { opacity: 0, y: 24, filter: 'blur(6px)' });
        tl.to(labels, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, stagger: 0.05, ease: 'power2.out' }, 0.45);
      }
      if (titleRef.current) {
        gsap.set(titleRef.current, { opacity: 0, y: 16, filter: 'blur(6px)' });
        tl.to(titleRef.current, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out' }, 0.55);
      }
    }, rootRef);
    return () => ctx.revert();
  }, [scrollReveal]);

  // Optional auto-cycle for the card preview.
  useEffect(() => {
    if (!autoCycle) return;
    let i = 0;
    const id = window.setInterval(() => {
      i = (i + 1) % THEME_KEYS.length;
      setTheme(THEME_KEYS[i]);
      setColors(COLOR_THEMES[THEME_KEYS[i]]);
    }, 2600);
    return () => window.clearInterval(id);
  }, [autoCycle]);

  const labelSize = compact ? 'text-[7px]' : 'text-[10px] sm:text-[11px]';
  const titleSize = compact ? 'text-[8px]' : 'text-[10px] sm:text-xs';

  const inner = (
    <>
      {showControls && (
        <div className="absolute top-3 left-0 right-0 z-30 flex flex-col items-center gap-2 px-3">
          <div className="flex gap-1.5">
            {THEME_KEYS.map((t) => (
              <button
                key={t}
                type="button"
                aria-label={t}
                onClick={() => applyTheme(t)}
                className="h-3 w-3 rounded-[2px] transition-transform hover:scale-125"
                style={{ background: COLOR_THEMES[t][0], transform: theme === t ? 'scale(1.3)' : undefined }}
              />
            ))}
          </div>
          <div className="flex gap-4 text-[10px] uppercase tracking-wider" style={{ color: textColor }}>
            <button type="button" onClick={() => setBlur((b) => !b)} className="hover:opacity-60">
              {blur ? 'Blur Off' : 'Blur On'}
            </button>
            <button type="button" onClick={randomize} className="hover:opacity-60">Randomize</button>
          </div>
        </div>
      )}

      <div
        ref={titleRef}
        className={`absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center uppercase tracking-wider leading-relaxed ${titleSize}`}
        style={{ color: textColor, ...(scrollReveal ? { opacity: 0 } : null) }}
      >
        Where Light Becomes Color<br />Across the Infinite Spectrum
      </div>

      {scrollReveal && (
        <div
          ref={hintRef}
          className="absolute left-1/2 bottom-[20%] z-20 -translate-x-1/2 flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.2em]"
          style={{ color: textColor }}
        >
          Scroll to see the magic
          <span className="animate-bounce text-sm leading-none" aria-hidden="true">↓</span>
        </div>
      )}

      <div
        ref={svgWrapRef}
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{ height: '72%', transformOrigin: 'bottom', willChange: 'transform, opacity', ...(scrollReveal ? { transform: 'scaleY(0.06)' } : null) }}
      >
        <svg viewBox="0 0 1567 584" preserveAspectRatio="none" className="h-full w-full">
          <g clipPath={`url(#${uid}-clip)`} filter={blur ? `url(#${uid}-blur)` : undefined}>
            {BARS.map((bar, i) => (
              <path key={i} d={bar.d} fill={`url(#${uid}-grad${i})`} />
            ))}
          </g>
          <defs>
            <filter id={`${uid}-blur`} x="-30" y="-30" width="1627" height="644" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation="15" />
            </filter>
            {BARS.map((bar, i) => (
              <linearGradient key={i} id={`${uid}-grad${i}`} x1={bar.x} y1={584} x2={bar.x} y2={bar.y2} gradientUnits="userSpaceOnUse">
                {STOP_OFFSETS.map((offset, idx) => (
                  <stop key={idx} offset={offset} stopColor={colors[idx] ?? colors[colors.length - 1]} stopOpacity={idx === STOP_OFFSETS.length - 1 ? 0 : 1} />
                ))}
              </linearGradient>
            ))}
            <clipPath id={`${uid}-clip`}>
              <rect width="1567" height="584" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </div>

      <div ref={labelsRef} className="absolute bottom-0 left-0 right-0 z-20 grid grid-cols-9 items-end" style={{ paddingBottom: compact ? '0.5rem' : '1.25rem' }}>
        {LABELS.map((l, i) => (
          <div key={i} data-dia-col className="flex flex-col items-center" style={scrollReveal ? { opacity: 0 } : undefined}>
            <div data-dia-label className={`text-center uppercase tracking-wide leading-tight ${labelSize}`} style={{ color: textColor }}>
              {l.name}<br /><span style={{ color: subColor }}>{l.kind}</span><br /><span style={{ color: subColor }}>{l.nm}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  // Scroll-scrubbed layout: visuals pin to the panel while an inner spacer
  // provides the scroll distance that drives the reveal.
  if (scrollReveal) {
    return (
      <div
        ref={rootRef}
        className={`absolute inset-0 overflow-y-auto overflow-x-hidden select-none scrollbar-hide ${className}`}
        style={{ backgroundColor: bg, transition: 'background-color 0.3s ease', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}
      >
        <div className="sticky top-0 z-10 h-full w-full overflow-hidden">{inner}</div>
        <div className="w-full" style={{ height: '150%' }} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      style={{ backgroundColor: bg, transition: 'background-color 0.3s ease', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}
    >
      {inner}
    </div>
  );
}
```

## Customising

- **Add a palette** — drop a new eight-color array into `COLOR_THEMES`. Index 0 is the dark base, index 7 fades out at the top. Add the key to `DARK_THEMES` if its base wants a dark page background.
- **Reshape the spectrum** — edit the `BARS` paths (and matching gradient `x`/`y2`). Lower `y2` = taller bar.
- **Soften / sharpen** — change `feGaussianBlur stdDeviation`. Higher melts the bars together; `0` gives a crisp equaliser.
- **Tune the scroll** — the inner spacer's `height: '150%'` sets how far you scroll for a full reveal; the `0.05 * level` factor in `applyProgress` sets how high the label wave rises.
- **Full-page footer** — for a true page footer, drop `scrollReveal` and instead drive the spectrum's `scaleY` and the label rise from a GSAP ScrollTrigger (`scrub: 1`) tied to the page scroll, exactly like the original Dia Browser footer.
