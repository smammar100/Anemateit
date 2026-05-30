'use client';

/**
 * Dia Browser Footer Color Spectrum
 *
 * A self-contained React port of the GSAP "Color Spectrum Layout"
 * (inspired by the Dia Browser footer). Nine blurred gradient bars rise
 * from the bottom edge to form a light spectrum, with live theme
 * switching, a blur toggle, and a randomize button.
 *
 * Two reveal modes:
 *  - `scrollReveal` (detail page): the spectrum is scrubbed by scrolling
 *    inside the panel — it unfolds from a thin seam while the wavelength
 *    labels rise into a wave and the title fades in. This mirrors the
 *    original scroll experience.
 *  - default (homepage card): reveals once on mount, optionally
 *    auto-cycling through palettes.
 *
 * Original concept: https://codepen.io/filipz/pen/NPqJJyz
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { gsap } from 'gsap';

// Eight-stop palettes. Index 0 is the dark base at the bottom of each bar,
// index 7 fades to transparent at the top.
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

// Swatch gradients for the theme switcher buttons.
const THEME_SWATCH: Record<string, string> = {
  original: 'linear-gradient(135deg,#340b05,#0358f7 25%,#ffd400 50%,#fa3d1d 75%,#fd02f5)',
  'blue-pink': 'linear-gradient(135deg,#1e3a8a,#3b82f6 25%,#fff 50%,#f472b6 75%,#ec4899)',
  'blue-orange': 'linear-gradient(135deg,#1e40af,#3b82f6 25%,#fff 50%,#fb923c 75%,#ea580c)',
  sunset: 'linear-gradient(135deg,#fef3c7,#fcd34d 25%,#f59e0b 50%,#dc2626 75%,#7f1d1d)',
  purple: 'linear-gradient(135deg,#f3e8ff,#c084fc 25%,#8b5cf6 50%,#7c3aed 75%,#5b21b6)',
  monochrome: 'linear-gradient(135deg,#1a1a1a,#404040 25%,#999 50%,#e5e5e5 75%,#fff)',
  'pink-purple': 'linear-gradient(135deg,#fdf2f8,#fce7f3 25%,#f9a8d4 50%,#f472b6 75%,#ec4899)',
  'blue-black': 'linear-gradient(135deg,#000,#1e293b 25%,#334155 50%,#475569 75%,#64748b)',
  'beige-black': 'linear-gradient(135deg,#fef3c7,#f59e0b 25%,#d97706 50%,#92400e 75%,#451a03)',
};

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

// Wavelength labels, left-to-right across the nine columns.
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
  /** Render the theme switcher / blur / randomize controls. */
  showControls?: boolean;
  /** Scrub the reveal by scrolling inside the component (detail page). */
  scrollReveal?: boolean;
  /** Auto-cycle through themes (used for the homepage card preview). */
  autoCycle?: boolean;
  /** Tighten paddings + type for small preview tiles. */
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
    gsap.fromTo(
      svgWrapRef.current,
      { scale: 1 },
      { scale: 1.02, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut' },
    );
  }, [scrollReveal]);

  const applyTheme = useCallback(
    (t: string) => {
      setTheme(t);
      setColors(COLOR_THEMES[t]);
      bounce();
    },
    [bounce],
  );

  const randomize = useCallback(() => {
    setColors(Array.from({ length: 8 }, randomHsl));
    bounce();
  }, [bounce]);

  // Map scroll progress (0 → 1) onto the spectrum reveal: the bars scale up
  // from a thin seam, labels rise + fade in by column weight, the title
  // settles in, and the scroll hint fades away.
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
      const rise = p * h * 0.05 * level;
      el.style.transform = `translateY(${(-rise).toFixed(1)}px)`;
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
      const p = max > 0 ? Math.min(1, Math.max(0, root.scrollTop / max)) : 0;
      applyProgress(p);
    };
    const onScroll = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(update);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    update();
    window.addEventListener('resize', update);
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
        gsap.set(svgWrapRef.current, {
          scaleY: 0.05,
          opacity: 0,
          transformOrigin: 'bottom',
        });
        tl.to(svgWrapRef.current, { opacity: 1, duration: 0.01 }).to(
          svgWrapRef.current,
          { scaleY: 1, duration: 1.2, ease: 'power3.out' },
          0,
        );
      }
      if (labelsRef.current) {
        const labels = labelsRef.current.querySelectorAll('[data-dia-label]');
        gsap.set(labels, { opacity: 0, y: 24, filter: 'blur(6px)' });
        tl.to(
          labels,
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, stagger: 0.05, ease: 'power2.out' },
          0.45,
        );
      }
      if (titleRef.current) {
        gsap.set(titleRef.current, { opacity: 0, y: 16, filter: 'blur(6px)' });
        tl.to(
          titleRef.current,
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out' },
          0.55,
        );
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
      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute inset-0 z-0" style={{ opacity: 0.16 }}>
        <div
          className="absolute rounded-full"
          style={{
            top: '-20%',
            left: '-10%',
            width: '60%',
            height: '60%',
            filter: 'blur(40px)',
            background: `radial-gradient(circle, ${colors[0]} 0%, ${colors[1]} 35%, transparent 70%)`,
            transition: 'background 0.4s ease',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: '20%',
            right: '-15%',
            width: '70%',
            height: '70%',
            filter: 'blur(40px)',
            background: `radial-gradient(circle, ${colors[4]} 0%, ${colors[5]} 40%, transparent 70%)`,
            transition: 'background 0.4s ease',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: '-25%',
            left: '20%',
            width: '65%',
            height: '65%',
            filter: 'blur(40px)',
            background: `radial-gradient(circle, ${colors[6]} 0%, ${colors[2]} 45%, transparent 75%)`,
            transition: 'background 0.4s ease',
          }}
        />
      </div>

      {/* Controls */}
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
                style={{
                  background: THEME_SWATCH[t],
                  transform: theme === t ? 'scale(1.3)' : undefined,
                  outline: theme === t ? '1px solid rgba(127,127,127,0.6)' : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
          <div className="flex gap-4 text-[10px] uppercase tracking-wider" style={{ color: textColor }}>
            <button type="button" onClick={() => setBlur((b) => !b)} className="transition-opacity hover:opacity-60">
              {blur ? 'Blur Off' : 'Blur On'}
            </button>
            <button type="button" onClick={randomize} className="transition-opacity hover:opacity-60">
              Randomize
            </button>
          </div>
        </div>
      )}

      {/* Centre title */}
      <div
        ref={titleRef}
        className={`absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center uppercase tracking-wider leading-relaxed ${titleSize}`}
        style={{
          color: textColor,
          transition: 'color 0.3s ease',
          ...(scrollReveal ? { opacity: 0 } : null),
        }}
      >
        Where Light Becomes Color
        <br />
        Across the Infinite Spectrum
      </div>

      {/* Scroll hint */}
      {scrollReveal && (
        <div
          ref={hintRef}
          className="absolute left-1/2 bottom-[20%] z-20 -translate-x-1/2 flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.2em]"
          style={{ color: textColor }}
        >
          Scroll to see the magic
          <span className="animate-bounce text-sm leading-none" aria-hidden="true">
            ↓
          </span>
        </div>
      )}

      {/* Spectrum SVG, anchored to the baseline */}
      <div
        ref={svgWrapRef}
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{
          height: '72%',
          transformOrigin: 'bottom',
          willChange: 'transform, opacity',
          ...(scrollReveal ? { transform: 'scaleY(0.06)' } : null),
        }}
      >
        <svg
          viewBox="0 0 1567 584"
          preserveAspectRatio="none"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath={`url(#${uid}-clip)`} filter={blur ? `url(#${uid}-blur)` : undefined}>
            {BARS.map((bar, i) => (
              <path key={i} d={bar.d} fill={`url(#${uid}-grad${i})`} />
            ))}
          </g>
          <defs>
            <filter
              id={`${uid}-blur`}
              x="-30"
              y="-30"
              width="1627"
              height="644"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation="15" result="effect1_foregroundBlur" />
            </filter>
            {BARS.map((bar, i) => (
              <linearGradient
                key={i}
                id={`${uid}-grad${i}`}
                x1={bar.x}
                y1={584}
                x2={bar.x}
                y2={bar.y2}
                gradientUnits="userSpaceOnUse"
              >
                {STOP_OFFSETS.map((offset, idx) => (
                  <stop
                    key={idx}
                    offset={offset}
                    stopColor={colors[idx] ?? colors[colors.length - 1]}
                    stopOpacity={idx === STOP_OFFSETS.length - 1 ? 0 : 1}
                  />
                ))}
              </linearGradient>
            ))}
            <clipPath id={`${uid}-clip`}>
              <rect width="1567" height="584" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </div>

      {/* Wavelength labels */}
      <div
        ref={labelsRef}
        className="absolute bottom-0 left-0 right-0 z-20 grid grid-cols-9 items-end"
        style={{ paddingBottom: compact ? '0.5rem' : '1.25rem' }}
      >
        {LABELS.map((l, i) => (
          <div
            key={i}
            data-dia-col
            className="flex flex-col items-center"
            style={scrollReveal ? { opacity: 0 } : undefined}
          >
            <div
              data-dia-label
              className={`text-center uppercase tracking-wide leading-tight ${labelSize}`}
              style={{ color: textColor, transition: 'color 0.3s ease' }}
            >
              {l.name}
              <br />
              <span style={{ color: subColor }}>{l.kind}</span>
              <br />
              <span style={{ color: subColor }}>{l.nm}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  // Scroll-scrubbed layout: the visuals pin to the panel while an inner
  // spacer provides the scroll distance that drives the reveal.
  if (scrollReveal) {
    return (
      <div
        ref={rootRef}
        className={`absolute inset-0 overflow-y-auto overflow-x-hidden select-none scrollbar-hide ${className}`}
        style={{
          backgroundColor: bg,
          transition: 'background-color 0.3s ease',
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        }}
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
      style={{
        backgroundColor: bg,
        transition: 'background-color 0.3s ease',
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
      }}
    >
      {inner}
    </div>
  );
}
