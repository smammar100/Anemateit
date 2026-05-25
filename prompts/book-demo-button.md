# Book Demo Button — Sliding Accent + Dot-Wave Chevrons

A dark pill-shaped CTA button with a colored accent slab pinned to the left. The slab contains five dot-based double-chevron icons that pulse in a cascading wave. On hover, the slab slides outward and expands to fill the whole button while the label stays visible — a single CSS transition on `width` with an easing curve does the work. Eight named color variants ship out of the box.

## Setup

**Works in:** v0 · Lovable · Bolt · Cursor · Next.js App Router · Vite + React. Single drop-in file.

**Dependencies:** `clsx` and `tailwind-merge` (used for class merging via a small `cn()` helper).

```bash
npm i clsx tailwind-merge
```

**`'use client';` directive:** The component file starts with `'use client';`. **Keep it** in Next.js App Router (v0 default). **Delete that line** in Vite, Lovable, Bolt, or any other plain React setup — it's an inert string there but some bundlers warn on it.

**Fonts:** No custom fonts. The label "Book a demo" uses whatever default sans-serif your project provides.

**Tailwind:** Standard utilities only — no custom `tailwind.config` changes, no theme tokens. If you don't have Tailwind, rewrite `className` strings as inline `style` — the layout has no dependency on custom classes.

**Quick usage:**

```tsx
import BookDemoButton from './components/BookDemoButton';
// <BookDemoButton variant="lime">Book a demo</BookDemoButton>
// <BookDemoButton variant="sky" onClick={() => console.log('clicked')} />
```

---

## `cn()` utility (paste into `lib/utils.ts` if you don't already have one)

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Component (paste into `components/BookDemoButton.tsx`)

```tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';

export type BookDemoVariant =
  | 'lime'
  | 'sky'
  | 'rose'
  | 'amber'
  | 'emerald'
  | 'violet'
  | 'orange'
  | 'magenta';

interface BookDemoButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BookDemoVariant;
}

const variantStyles: Record<
  BookDemoVariant,
  { from: string; to: string; dot: string }
> = {
  lime: { from: '#d6f54a', to: '#c5ea2c', dot: '#0f0f0f' },
  sky: { from: '#a5e0ff', to: '#6bc8f5', dot: '#0a1f3a' },
  rose: { from: '#ffc4d3', to: '#f590a5', dot: '#3a0a1f' },
  amber: { from: '#ffd66e', to: '#f5a82e', dot: '#3a210a' },
  emerald: { from: '#a8efc5', to: '#5fd49a', dot: '#0a2a1a' },
  violet: { from: '#d4b9ff', to: '#a07bf5', dot: '#1f0a3a' },
  orange: { from: '#ffb88a', to: '#f57a3a', dot: '#3a190a' },
  magenta: { from: '#f5a8e0', to: '#e060c5', dot: '#3a0a2a' },
};

const DoubleChevron = ({ index, color }: { index: number; color: string }) => {
  const base = index * 0.12;
  const dots: { cx: number; cy: number; d: number }[] = [
    { cx: 2, cy: 2, d: 0 },
    { cx: 5, cy: 5, d: 0.05 },
    { cx: 8, cy: 8, d: 0.1 },
    { cx: 5, cy: 11, d: 0.15 },
    { cx: 2, cy: 14, d: 0.2 },
    { cx: 6, cy: 2, d: 0.05 },
    { cx: 9, cy: 5, d: 0.1 },
    { cx: 12, cy: 8, d: 0.15 },
    { cx: 9, cy: 11, d: 0.2 },
    { cx: 6, cy: 14, d: 0.25 },
  ];
  return (
    <svg
      width="14"
      height="16"
      viewBox="0 0 14 16"
      className="shrink-0 overflow-visible"
    >
      <g fill={color}>
        {dots.map((p, i) => (
          <circle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r="1"
            className="bd-dot"
            style={{ animationDelay: `${base + p.d}s` }}
          />
        ))}
      </g>
    </svg>
  );
};

const BookDemoButton = React.forwardRef<HTMLButtonElement, BookDemoButtonProps>(
  ({ className, children, variant = 'lime', ...props }, ref) => {
    const v = variantStyles[variant];
    return (
      <button
        ref={ref}
        className={cn(
          'group/btn relative inline-flex h-11 w-36 rounded-[12px] overflow-hidden transition-transform active:scale-[0.98]',
          className,
        )}
        style={{
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.18)',
        }}
        {...props}
      >
        <style>{`
          @keyframes bd-dot-wave {
            0%, 70%, 100% { opacity: 0.25; transform: scale(0.85); }
            35% { opacity: 1; transform: scale(1); }
          }
          .bd-dot {
            transform-box: fill-box;
            transform-origin: center;
            animation: bd-dot-wave 1.4s ease-in-out infinite;
          }
        `}</style>

        <span className="absolute inset-y-0 right-4 flex items-center text-white font-medium text-[14px] tracking-tight">
          {children || 'Book a demo'}
        </span>

        <span
          className="absolute top-1 left-1 bottom-1 z-10 w-9 group-hover/btn:w-[calc(100%-0.5rem)] flex items-center justify-start overflow-hidden rounded-md pl-3 pr-2.5 gap-2.5 transition-[width,gap] duration-200 ease-[cubic-bezier(0.65,0,0.35,1)]"
          style={{
            background: `linear-gradient(180deg, ${v.from} 0%, ${v.to} 100%)`,
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
          }}
        >
          <DoubleChevron index={0} color={v.dot} />
          <DoubleChevron index={1} color={v.dot} />
          <DoubleChevron index={2} color={v.dot} />
          <DoubleChevron index={3} color={v.dot} />
          <DoubleChevron index={4} color={v.dot} />
        </span>
      </button>
    );
  },
);

BookDemoButton.displayName = 'BookDemoButton';

export default BookDemoButton;
```

## How it works

1. **Button shell** — Fixed `h-11 w-36` dark pill (`rounded-[12px]`) with a `linear-gradient` from `#1a1a1a` to `#0a0a0a`, plus an inset highlight + drop shadow for depth. `active:scale-[0.98]` gives the click a tactile press.

2. **Right-aligned label** — The text sits absolutely-positioned on the right (`absolute inset-y-0 right-4`) so it stays anchored even while the accent slab grows over it.

3. **The accent slab** — Pinned to the top/left/bottom 1px inside the button, the slab starts at `w-9` (just enough to show the first chevron). On `group-hover/btn` it grows to `w-[calc(100%-0.5rem)]`, covering everything except the 4px frame. The transition uses `cubic-bezier(0.65, 0, 0.35, 1)` over `200ms` for a confident, sliding feel — not bouncy.

4. **Dot-wave keyframes** — A single `bd-dot-wave` keyframe (defined in an inline `<style>` block inside the component) animates each dot's opacity (`0.25 → 1 → 0.25`) and scale (`0.85 → 1 → 0.85`) over `1.4s` ease-in-out infinite.

5. **Cascading delay** — Each chevron is rendered with a different `index` (0–4); each dot inside a chevron gets a stagger from `0` to `0.25s`. Combined with the chevron index (`index * 0.12s`), the dots ripple from left to right like a slow shimmering wave.

6. **Color variants** — Eight presets supply a `from`/`to` gradient for the slab and a `dot` color for the chevrons. Passing `variant="lime"` (default) uses lime → green with near-black dots; the other seven (`sky`, `rose`, `amber`, `emerald`, `violet`, `orange`, `magenta`) are tonal pairs designed to read well on the dark shell.

## Customisation

| Knob | Effect |
|------|--------|
| `variant` prop | Switch between the 8 built-in color combos. |
| Add a new `variantStyles` entry | Define `{ from, to, dot }` and use it like `variant="custom"`. |
| `h-11 w-36` | Button size. Both dimensions can be tweaked together — the slab scales relative to the button. |
| `w-9` start width | How much of the slab is visible at rest. Larger → more accent showing. |
| `duration-200` | Hover-expansion speed. |
| `cubic-bezier(0.65, 0, 0.35, 1)` | Easing curve. Swap for a different feel (try `ease-out` for snappier). |
| `bd-dot-wave` keyframe timings | Make the dots pulse faster, brighter, or with different min/max opacity. |
| Number of `<DoubleChevron>` calls | Currently 5 — add/remove to taste. |
