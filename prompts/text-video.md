# Text Video

> **Recreate this exact component.** Paste this entire prompt into any AI coding tool (Claude Code, Cursor, v0, Lovable, Bolt…) — it's self-contained, with the full source included below. **Stack:** React 18 + TypeScript, styled with Tailwind CSS (swap the `className`s for inline styles if you're not using Tailwind). **Dependencies:** none — pure React + CSS. Swap the example GIF URL for your own asset.

A React component that clips a GIF or image into text shapes using CSS `background-clip: text`. The effect makes your text appear as if it is "cut out" of a moving image — a striking visual treatment for hero headings, wordmarks, and display copy.

## Usage

```tsx
import TextVideo from '@/components/text-video/TextVideo';

<TextVideo className="text-8xl font-extrabold tracking-tight">
  ANIMATE
</TextVideo>

// With a custom GIF
<TextVideo
  gifUrl="https://example.com/your-loop.gif"
  className="text-6xl font-black"
>
  MOTION
</TextVideo>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Text to render inside the clip |
| `gifUrl` | `string` | internal GIF | URL of the GIF or image to use as fill |
| `className` | `string` | `''` | Tailwind classes for size, weight, tracking |

## Component source

```tsx
const DEFAULT_GIF =
  'https://i.pinimg.com/originals/80/b7/5e/80b75eb774b647c67b2efa531b57ba13.gif';

export default function TextVideo({
  children,
  gifUrl = DEFAULT_GIF,
  className = '',
}: {
  children: React.ReactNode;
  gifUrl?: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `url('${gifUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {children}
    </div>
  );
}
```

## How it works

`background-clip: text` (Tailwind's `bg-clip-text`) constrains the background painting area to the glyph shapes only. Setting the text color to `transparent` reveals the background beneath — in this case a GIF served as a CSS `background-image`. The result: moving imagery visible only inside the letterforms.

## Styling tips

- **Bold weights work best** — use `font-extrabold` or `font-black`. Thin strokes give the GIF too little area to show through.
- **Larger type sizes** — `text-6xl` and up let GIF detail read clearly inside the glyphs.
- **Tracking** — both `tracking-tight` and `tracking-widest` work well; tight creates density, wide gives each letter room to breathe.
- **Contrasting background** — placing the component on a dark background (e.g. `bg-black`) maximises the visual contrast between the clipped GIF and the surrounding space.

## Framer Motion entrance

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  <TextVideo className="text-8xl font-black">ANIMATE</TextVideo>
</motion.div>
```

The clip is preserved during CSS opacity animations — wrap in a `motion.div` rather than animating the `TextVideo` element directly to keep the clip stable during the transition.
