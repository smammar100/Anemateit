# Lissajous Curves

> **Recreate this exact component.** Paste this entire prompt into any AI coding tool (Claude Code, Cursor, v0, Lovable, Bolt…) — it's self-contained, with the full source included below. **Stack:** React 18+ + TypeScript, SVG + `requestAnimationFrame` (swap the `className`s for inline styles if you're not using Tailwind). **Dependencies:** none.

The **"ANEMATE"** wordmark as a row of seven coloured Lissajous curves — a faithful port of the **cursor.com/compile** hero engine. Every letter is a *pure* Lissajous figure, `x = cx + A·sin(a·t + δ)`, `y = cy + B·sin(b·t)`, whose frequency ratio, phase and rotation are chosen so the raw mathematical curve **evokes** the letter: A = a degenerate 2:1 parabola folded into an italic A-frame, N = a 1:3 zigzag (left stem, diagonal, right stem), E = 3:1 at δ=π/2 (three horizontal lobes), M = the classic 1:2 lemniscate, T = two strokes in one cell: a doubled-lens arch as the bar plus a thin standing figure-8 as the stem.

## How it works

- **Letters as cells.** Each glyph lives in a 200×200 cell; cells overlap via negative `gapBefore` so the curves interleave across the row. Amplitude is 90% of the half-cell, scaled per-letter (`scaleX`/`scaleY`); the figure is then CSS-rotated around the cell centre.
- **Intro = phase rewind.** Each letter mounts with its phase offset by `−amount` (mostly −π) and eases to 0 over ~2s, staggered left → right (delays 0–0.6s). Tilted letters also rotate in. While the phase eases, the curve morphs through every intermediate Lissajous state — the signature "settling" effect.
- **Hover = phase drift.** Each letter has its own transparent 200×200 hit-rect. While hovered, its phase drifts `+0.3π` over 4s (easeOutQuart) and *stays* there; on leave it eases back. Mid-transition reversals capture current progress, so rapid pointer moves stay smooth.
- **Idle parking.** The rAF loop re-renders all paths each frame only while a tween is active, then parks; pointer events wake it. `prefers-reduced-motion` skips the intro.
- To spell a different word, edit the `LETTERS` array — pick `(a, b, delta, rotation)` so the figure gestures at each letter, set colours and overlaps.

## Component source

```tsx
'use client';

/*
 * Lissajous Curves — the "ANEMATE" wordmark.
 *
 * A faithful port of the cursor.com/compile hero engine: every letter is a
 * pure Lissajous figure — x = cx + A·sin(a·t + δ), y = cy + B·sin(b·t) — whose
 * frequencies, phase and rotation are chosen so the raw curve EVOKES the
 * letter. Letters live in 200×200 cells that overlap (negative gapBefore), so
 * the curves interleave across the row.
 *
 * Animation is pure phase/rotation drift:
 *  - Intro: each letter mounts with its phase offset by −amount (mostly −π)
 *    and eases to 0 over ~2s, staggered left to right; some letters also
 *    rotate in.
 *  - Hover: each letter has its own transparent hit-rect; while hovered its
 *    phase drifts +0.3π over 4s (easeOutQuart) and stays there, easing back
 *    on leave. Mid-transition reversals resume from current progress.
 */

import { useEffect, useMemo, useRef } from 'react';

const CELL = 200; // square cell per letter (viewBox units)
const GAP = 8; // default gap when a letter doesn't set gapBefore
const RESOLUTION = 500; // samples per curve

type AnimSpec = {
  amount: number;
  duration: number;
  stagger: number;
  delay?: number;
  easing: keyof typeof EASINGS;
};

type LetterAnim = { phase?: AnimSpec; rotation?: AnimSpec };

type Figure = {
  a: number; // x frequency
  b: number; // y frequency
  delta: number; // x phase (radians)
  rotation: number; // rotation of the figure inside the cell (deg, clockwise)
  scaleX?: number;
  scaleY?: number;
  offsetX?: number;
  offsetY?: number;
};

type Letter = {
  a: number; // x frequency
  b: number; // y frequency
  delta: number; // x phase (radians)
  rotation: number; // CSS rotation of the whole figure (deg, clockwise)
  stroke: string;
  gapBefore?: number; // negative = overlap the previous cell
  width?: number;
  scale?: number; // overrides the auto rotation-fit scale
  scaleX?: number;
  scaleY?: number;
  offsetX?: number;
  offsetY?: number;
  // Optional second Lissajous stroke in the same cell (e.g. T = bar + stem).
  // It shares the letter's phase/rotation animation and colour.
  extra?: Figure;
  intro?: LetterAnim;
  hover?: LetterAnim;
};

/*
 * ANEMATE — colours follow the COMPILE palette positionally. E and M reuse the
 * original site's own E (3:1, δ=π/2) and M (1:2, δ=0) figures verbatim. The
 * other glyphs stay in the same vocabulary:
 *  - A: degenerate 2:1 parabola (the site's C family) at δ slightly past π/2,
 *    so the stroke doubles into a narrow lens — an italic A-frame. The two
 *    A's mirror each other's tilt (−95° / −85°).
 *  - N: 1:3 at δ=0 — M's exact recipe one harmonic higher — a tall zigzag:
 *    left stem, hairpin, descending diagonal, right stem. Rotated −10° so the
 *    stems stand vertical.
 *  - T: two strokes in one cell — the 2:1 doubled-lens arch as the top bar
 *    plus a thin standing figure-8 (2:1, δ=0.25, squashed) as the centre stem
 *    hanging from it.
 */
const LETTERS: Letter[] = [
  {
    a: 2, b: 1, delta: 1.42, rotation: -95, scaleX: 0.95, scaleY: 0.8, stroke: '#F76D18',
    intro: {
      phase: { amount: Math.PI, duration: 1.8, stagger: 0, delay: 0, easing: 'easeInOut' },
      rotation: { amount: -30, duration: 1.8, stagger: 0, delay: 0, easing: 'easeInOut' },
    },
  },
  {
    a: 1, b: 3, delta: 0, rotation: -10, scaleX: 0.85, scaleY: 1, stroke: '#2C9F28', gapBefore: -50,
    intro: { phase: { amount: Math.PI, duration: 2, stagger: 0, delay: 0.1, easing: 'easeInOut' } },
  },
  {
    a: 3, b: 1, delta: Math.PI / 2, rotation: 0, stroke: '#A88D02', gapBefore: -30,
    intro: { phase: { amount: Math.PI / 1.5, duration: 2.2, stagger: 0, delay: 0.2, easing: 'easeInOut' } },
  },
  {
    a: 1, b: 2, delta: 0, rotation: 0, stroke: '#8C89E7', gapBefore: -25,
    intro: { phase: { amount: Math.PI, duration: 2, stagger: 0, delay: 0.3, easing: 'easeInOut' } },
  },
  {
    a: 2, b: 1, delta: 1.42, rotation: -85, scaleX: 0.95, scaleY: 0.8, stroke: 'currentColor', gapBefore: -30,
    intro: {
      phase: { amount: Math.PI, duration: 1.6, stagger: 0, delay: 0.4, easing: 'easeInOut' },
      rotation: { amount: 30, duration: 1.6, stagger: 0, delay: 0.4, easing: 'easeInOut' },
    },
  },
  {
    // T = two strokes: a doubled-lens arch as the top bar + a thin standing
    // figure-8 as the centre stem hanging from it.
    a: 2, b: 1, delta: 1.25, rotation: -90, scaleX: 0.45, scaleY: 1, stroke: '#916031', gapBefore: -40, offsetY: -45,
    extra: { a: 2, b: 1, delta: 0.25, rotation: 0, scaleX: 0.18, scaleY: 0.8, offsetY: 58 },
    intro: {
      phase: { amount: Math.PI / 4, duration: 2, stagger: 0, delay: 0.5, easing: 'easeInOut' },
      rotation: { amount: -20, duration: 2, stagger: 0, delay: 0.5, easing: 'easeInOut' },
    },
  },
  {
    a: 3, b: 1, delta: Math.PI / 2, rotation: 0, stroke: '#2268FF', gapBefore: -50,
    intro: { phase: { amount: Math.PI, duration: 2, stagger: 0, delay: 0.6, easing: 'easeInOut' } },
  },
];

// Component-level defaults (per-letter intro/hover specs win over these).
const INTRO_DEFAULT: LetterAnim = {
  phase: { amount: 2 * Math.PI, duration: 2, stagger: 0.1, easing: 'easeInOut' },
};
const HOVER_DEFAULT: LetterAnim = {
  phase: { amount: 0.3 * Math.PI, duration: 4, stagger: 0.4, easing: 'easeOutQuart' },
};

const EASINGS = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => 1 - (1 - t) * (1 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  easeOutQuart: (t: number) => 1 - (1 - t) ** 4,
};

// Eased progress (0..1) of an AnimSpec at `elapsed` seconds for letter `index`.
function progress(spec: AnimSpec, index: number, elapsed: number): number {
  const raw = (elapsed - ((spec.delay ?? 0) + index * spec.stagger)) / spec.duration;
  const clamped = raw <= 0 ? 0 : raw >= 1 ? 1 : raw;
  return EASINGS[spec.easing](clamped);
}

// The site's exact path generator: amplitude is 90% of the half-cell.
function buildPath(
  a: number, b: number, delta: number,
  res: number, w: number, h: number, sx: number, sy: number,
): string {
  const ax = ((0.9 * w) / 2) * sx;
  const ay = ((0.9 * h) / 2) * sy;
  const cx = w / 2;
  const cy = h / 2;
  const pts: string[] = [];
  for (let i = 0; i <= res; i++) {
    const t = (i / res) * Math.PI * 2;
    pts.push(
      `${i === 0 ? 'M' : 'L'}${(cx + ax * Math.sin(a * t + delta)).toFixed(2)},${(cy + ay * Math.sin(b * t)).toFixed(2)}`,
    );
  }
  return pts.join(' ');
}

type Props = {
  compact?: boolean;
  className?: string;
};

export default function Lissajous({ compact = false, className = '' }: Props) {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const extraPathRefs = useRef<(SVGPathElement | null)[]>([]);
  const groupRefs = useRef<(SVGGElement | null)[]>([]);
  const rafRef = useRef(0);
  const frameRef = useRef<((now: number) => void) | null>(null);
  // Per-letter hover state (mirrors the site: progress 0..1, toggle timestamp,
  // hovered flag). Progress persists across reversals so they stay smooth.
  const hoverProg = useRef(LETTERS.map(() => ({ phase: 0, rotation: 0 })));
  const hoverAt = useRef<(number | null)[]>(LETTERS.map(() => null));
  const hovered = useRef<boolean[]>(LETTERS.map(() => false));
  const introStart = useRef<number | null>(null);

  // Cell layout: x accumulation with (negative) gaps; rotated letters without
  // an explicit scale shrink by 1/(|sin r|+|cos r|) so they stay in-cell.
  const layout = useMemo(() => {
    let acc = 0;
    return LETTERS.map((cfg, i) => {
      const w = cfg.width ?? CELL;
      const x = acc + (i === 0 ? 0 : (cfg.gapBefore ?? GAP));
      acc = x + w;
      const r = (cfg.rotation * Math.PI) / 180;
      const fit = cfg.scale ?? 1 / (Math.abs(Math.sin(r)) + Math.abs(Math.cos(r)));
      return { x, width: w, scaleX: cfg.scaleX ?? fit, scaleY: cfg.scaleY ?? fit };
    });
  }, []);
  const svgW = layout.length ? layout[layout.length - 1].x + layout[layout.length - 1].width : 0;
  const svgH = layout.reduce((m, c) => Math.max(m, c.width), 0);

  const anim = (i: number) => ({
    introPhase: LETTERS[i].intro?.phase ?? INTRO_DEFAULT.phase,
    introRot: LETTERS[i].intro?.rotation ?? INTRO_DEFAULT.rotation,
    hoverPhase: LETTERS[i].hover?.phase ?? HOVER_DEFAULT.phase,
    hoverRot: LETTERS[i].hover?.rotation ?? HOVER_DEFAULT.rotation,
  });

  // Initial offsets: letters mount with intro animations rewound (−amount).
  const initial = useMemo(
    () =>
      LETTERS.map((cfg, i) => {
        const { introPhase, introRot } = anim(i);
        return { phase: introPhase ? -introPhase.amount : 0, rotation: introRot ? -introRot.amount : 0 };
      }),
    [],
  );

  const maxHoverDur = useMemo(
    () =>
      LETTERS.map((_, i) => {
        const { hoverPhase, hoverRot } = anim(i);
        return Math.max(
          hoverPhase ? (hoverPhase.delay ?? 0) + hoverPhase.duration : 0,
          hoverRot ? (hoverRot.delay ?? 0) + hoverRot.duration : 0,
        );
      }),
    [],
  );

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const frame = (now: number) => {
      if (introStart.current === null) introStart.current = now;
      const tAbs = now / 1000;
      const tIntro = (now - introStart.current) / 1000;
      let active = false;

      for (let i = 0; i < LETTERS.length; i++) {
        const cfg = LETTERS[i];
        const { introPhase, introRot, hoverPhase, hoverRot } = anim(i);
        let dPhase = 0;
        let dRot = 0;

        if (introPhase) {
          const p = reduce ? 1 : progress(introPhase, i, tIntro);
          dPhase = (p - 1) * introPhase.amount;
          if (p < 1) active = true;
        }
        if (introRot) {
          const p = reduce ? 1 : progress(introRot, i, tIntro);
          dRot = (p - 1) * introRot.amount;
          if (p < 1) active = true;
        }

        const at = hoverAt.current[i];
        const prog = hoverProg.current[i];
        if (hoverPhase || hoverRot) {
          if (at === null) {
            if (hoverPhase) dPhase += prog.phase * hoverPhase.amount;
            if (hoverRot) dRot += prog.rotation * hoverRot.amount;
          } else {
            const e = tAbs - at;
            const target = hovered.current[i] ? 1 : 0;
            if (hoverPhase) dPhase += (prog.phase + (target - prog.phase) * progress(hoverPhase, 0, e)) * hoverPhase.amount;
            if (hoverRot) dRot += (prog.rotation + (target - prog.rotation) * progress(hoverRot, 0, e)) * hoverRot.amount;
            active = true;
            if (e >= maxHoverDur[i]) {
              prog.phase = target;
              prog.rotation = target;
              hoverAt.current[i] = null;
            }
          }
        }

        const { width, scaleX, scaleY } = layout[i];
        pathRefs.current[i]?.setAttribute(
          'd',
          buildPath(cfg.a, cfg.b, cfg.delta + dPhase, RESOLUTION, width, width, scaleX, scaleY),
        );
        const x = cfg.extra;
        if (x) {
          extraPathRefs.current[i]?.setAttribute(
            'd',
            buildPath(x.a, x.b, x.delta + dPhase, RESOLUTION, width, width, x.scaleX ?? 1, x.scaleY ?? 1),
          );
        }
        const g = groupRefs.current[i];
        if (g) g.style.transform = `rotate(${cfg.rotation + dRot}deg)`;
      }

      // The site re-renders every frame forever; we park the loop once all
      // tweens settle (visually identical) and pointer events restart it.
      rafRef.current = active ? requestAnimationFrame(frame) : 0;
    };

    frameRef.current = frame;
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      frameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Port of the site's pointer handler: capture mid-transition progress, then
  // retime the tween toward the new target.
  const onHover = (entering: boolean, i: number) => {
    const tAbs = performance.now() / 1000;
    const at = hoverAt.current[i];
    if (at !== null) {
      const e = tAbs - at;
      const target = hovered.current[i] ? 1 : 0;
      const { hoverPhase, hoverRot } = anim(i);
      const prog = hoverProg.current[i];
      if (hoverPhase) prog.phase = prog.phase + (target - prog.phase) * progress(hoverPhase, 0, e);
      if (hoverRot) prog.rotation = prog.rotation + (target - prog.rotation) * progress(hoverRot, 0, e);
    }
    hovered.current[i] = entering;
    hoverAt.current[i] = tAbs;
    // resume the parked loop (the intro clock keeps its original start)
    if (!rafRef.current && frameRef.current) rafRef.current = requestAnimationFrame(frameRef.current);
  };

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
      style={{ background: '#EDECE8' }}
    >
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`h-auto w-full max-w-[1120px] text-[#26251E] ${compact ? 'stroke-[6px]' : 'stroke-[4px] md:stroke-[3px] lg:stroke-[2px]'}`}
        style={{ overflow: 'visible' }}
        role="img"
        aria-label="Anemate"
        focusable="false"
      >
        {LETTERS.map((cfg, i) => {
          const { x, width, scaleX, scaleY } = layout[i];
          const y = (svgH - width) / 2;
          return (
            <g key={i} transform={`translate(${x + (cfg.offsetX ?? 0)}, ${y + (cfg.offsetY ?? 0)})`}>
              <g
                ref={(el) => {
                  groupRefs.current[i] = el;
                }}
                style={{
                  transformOrigin: `${width / 2}px ${width / 2}px`,
                  transform: `rotate(${cfg.rotation + initial[i].rotation}deg)`,
                  willChange: 'transform',
                }}
                onPointerEnter={() => onHover(true, i)}
                onPointerLeave={() => onHover(false, i)}
              >
                <rect width={width} height={width} fill="transparent" pointerEvents="all" />
                <path
                  ref={(el) => {
                    pathRefs.current[i] = el;
                  }}
                  d={buildPath(cfg.a, cfg.b, cfg.delta + initial[i].phase, RESOLUTION, width, width, scaleX, scaleY)}
                  stroke={cfg.stroke}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                {cfg.extra && (
                  // second stroke: counter-rotated so its own rotation is
                  // independent of the letter's, then offset within the cell
                  <g
                    transform={`rotate(${cfg.extra.rotation - cfg.rotation}, ${width / 2}, ${width / 2}) translate(${cfg.extra.offsetX ?? 0}, ${cfg.extra.offsetY ?? 0})`}
                  >
                    <path
                      ref={(el) => {
                        extraPathRefs.current[i] = el;
                      }}
                      d={buildPath(cfg.extra.a, cfg.extra.b, cfg.extra.delta + initial[i].phase, RESOLUTION, width, width, cfg.extra.scaleX ?? 1, cfg.extra.scaleY ?? 1)}
                      stroke={cfg.stroke}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </g>
                )}
              </g>
            </g>
          );
        }).reverse()}
      </svg>
    </div>
  );
}
```

## Credit

A study of the **cursor.com/compile** event hero — a word drawn as pure Lissajous curves with phase-spin intro and per-letter hover drift — re-parameterised to spell "ANEMATE". Lissajous technique reference: CodePen **"Lissajous"** by **jake** (jak_e): <https://codepen.io/jak_e/pen/ZvwgOg>.
