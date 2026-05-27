# Phantom Lab Grid — Infinite WebGL Card Grid

A draggable, pannable infinite grid of card tiles rendered in WebGL via [ogl](https://github.com/oframe/ogl). Tiles arrange in a 3×3 group that repeats seamlessly in every direction — pan to any distance, the grid never ends. Each tile is a textured plane with a title and tag-strip overlay, a background blur layer that fades in on hover, and a click handler that dispatches a custom event with the tile's data. The whole scene runs through a post-processing pass with subtle distortion and a vignette.

Use this for: portfolio galleries, content explorers, "creative directory" landing experiences, anywhere you want a tactile, oversized canvas of cards rather than a paged list.

## Setup

**Works in:** v0 · Lovable · Bolt · Cursor · Claude Code · Kimi · Next.js App Router · Vite + React. Multi-file component — install once, drop the folder into `src/components/phantom-lab-grid/`, import the entry component.

**Dependencies:**

```bash
npm install ogl gsap
```

That's it. No three.js, no postprocessing libs, no animation extras. `ogl` is a ~30 KB lightweight WebGL library; `gsap` powers the per-frame hover tweens and the intro animation of the vignette/distortion.

**`'use client';` directive:** The renderer component (`PhantomLabGridClient.tsx`) starts with `'use client';`. **Keep it** in Next.js App Router. **Delete that line** in Vite, Lovable, Bolt, or any plain React setup — it's inert there but some bundlers warn on it.

**Tailwind:** Used only for layout utilities on the wrapper `<div>` (cursor, overflow, positioning). The grid's visuals are 100% WebGL — no Tailwind classes affect the canvas itself. Strip the Tailwind classes and replace with inline styles if your project doesn't use Tailwind.

**Quick usage:**

```tsx
import PhantomLabGrid from './components/phantom-lab-grid/PhantomLabGrid';

export default function Page() {
  return (
    <main className="fixed inset-0 bg-black">
      <PhantomLabGrid cards={cards} />
    </main>
  );
}
```

The wrapping element MUST have a width/height (the canvas sizes to its container). `fixed inset-0` or any `position: relative` parent with explicit dimensions both work.

---

## File structure

Drop this folder under `src/components/phantom-lab-grid/`:

```
phantom-lab-grid/
├─ PhantomLabGrid.tsx                # Server component — data wiring (or sync version for non-Next)
├─ PhantomLabGridClient.tsx          # 'use client' — instantiates the engine, handles clicks
└─ grid-engine/
   ├─ index.ts                       # Barrel: exports InfiniteGridClass + types
   ├─ InfiniteGridClass.ts           # Main orchestrator: renderer, camera, scroll, render loop
   ├─ GridManager.ts                 # Builds the 9 tile groups, generates textures, manages meshes
   ├─ EventHandler.ts                # Pointer/touch input, drag, momentum, click + hover dispatch
   ├─ DisposalManager.ts             # Tears down GL state and listeners on unmount
   ├─ PostProcessShader.ts           # Vignette + barrel-distortion fragment shader
   ├─ createTexture.ts               # Canvas 2D → WebGL texture (title, tags, thumbnail composite)
   ├─ shaders.ts                     # Foreground/background tile shaders
   └─ types.ts                       # CardData, InfiniteGridOptions, ScrollState, etc.
```

For LLM-driven generation: it is *not* practical to reproduce ~3,000 lines of WebGL plumbing from this prompt alone. The cleanest approach is:

1. Generate the wrapper components (`PhantomLabGrid.tsx` + `PhantomLabGridClient.tsx`) from this spec.
2. Copy the `grid-engine/` folder verbatim from a reference implementation. The source originated at [github.com/smammar100/The100](https://github.com/smammar100/The100) (`src/lib/infinite-grid/`) and has been simplified — strip the bio-overlay system if present (any file named `bioGridAnchor`, `rasterizeBio`, any field starting with `bio`, the `createBioPlane` method, the `updateTileVisibility` exclusion logic).
3. If the host project routes differ from `/projects/[slug]`, change the `router.push` call in `PhantomLabGridClient.tsx`.

---

## Component API

### `<PhantomLabGrid />` — entry component

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `cards` | `CardData[]` | required | The tile content. Pad to ≥9 for a fully populated 3×3 group. |

### `CardData` shape

```ts
interface CardData {
  title: string;             // Rendered on the tile (large)
  badge: string;             // Small badge above the title (category, etc.)
  description?: string;      // Optional; surfaced in the click event detail
  tags: string[];            // Rendered as a comma-separated tag strip
  date: string;              // Optional date/year string
  image?: string;            // Texture URL — required for a real thumbnail (else solid color)
  slug?: string;             // Echoed in the click event for routing
  imageSrc?: string;         // Optional duplicate of `image` for query-param echo
}
```

### Tile clicks

The container dispatches a `tileClicked` CustomEvent. Listen at the container level:

```tsx
container.addEventListener('tileClicked', (e) => {
  const { cardData } = e.detail;
  router.push(`/projects/${cardData.slug}`);
});
```

`PhantomLabGridClient.tsx` already wires this in to `next/navigation`'s `useRouter`. Replace with your router's equivalent in Vite/Lovable/Bolt setups.

---

## Configuration knobs

Pass `InfiniteGridOptions` to the `InfiniteGridClass` constructor inside `PhantomLabGridClient.tsx`:

| Option | Default | Effect |
|--------|---------|--------|
| `gridCols` | 3 | Columns in one tile group |
| `gridRows` | 3 | Rows in one tile group |
| `gridGap` | 0 | World-unit gap between tiles |
| `tileSize` | 3 | World-unit edge length per tile (raise for larger tiles, lower to fit more on screen) |
| `baseCameraZ` | 10 | Camera distance — larger = wider field of view across more tiles |
| `enablePostProcessing` | true | Toggles the distortion+vignette pass |
| `postProcessParams.distortionIntensity` | 0.0 | Barrel distortion (0 = none, 0.3 = noticeable curve) |
| `postProcessParams.vignetteOffset` | 1.2 | Where the vignette darkening begins (0 = center, 1 = edges) |
| `postProcessParams.vignetteDarkness` | 1.5 | How dark the corners get (should be ≥ vignetteOffset) |

The renderer exposes runtime setters too:

```ts
gridRef.current.distortionIntensity = 0.4;
gridRef.current.vignetteOffset = 0.4;
gridRef.current.vignetteDarkness = 1.3;

// Or tween into a new look:
gridRef.current.animatePostProcessing(0.4, 0.4, 1.3, /* duration */ 1.2);
```

---

## How it works

1. **Infinite 3×3 super-grid.** The scene contains 9 tile groups laid out in a 3×3 super-grid (`TOTAL_GRID_WIDTH = GRID_WIDTH * 3`). On every frame, `updatePositions()` checks the scroll direction and shifts a group's `offset.x/y` by ±`TOTAL_GRID_WIDTH/HEIGHT` whenever it crosses the viewport edge in the direction of travel. The effect is a seamless tiling regardless of pan distance — there's never a visible seam.

2. **Texture composition.** Each card's foreground texture is rendered on an offscreen Canvas 2D context: thumbnail image, title text, tag strip, dark gradient — composited into one image, uploaded to a GL texture once. The background texture is a heavily blurred copy of the same image, used as the hover layer.

3. **Hover + click.** `EventHandler` raycasts the pointer against the foreground meshes every frame. On hover, `fadeInBackground` tweens the background mesh's `uOpacity` from 0 → 1 over 0.6 s (`power2.out`); on leave, it tweens back. A click only fires if the pointer moved less than `maxClickMovement = 5` px between down and up — drags don't trigger navigation.

4. **Momentum scrolling.** Pointer release captures a smoothed velocity and feeds `applyReleaseInertia()`, which damps the scroll by `friction = 0.94` per frame until it's effectively zero. No external inertia plugin needed.

5. **Post-processing.** The scene renders into a `RenderTarget`, then a fullscreen quad samples the target through the fragment shader in `PostProcessShader.ts` to apply barrel distortion and a soft vignette. Toggle with `enablePostProcessing: false` for a flat look.

6. **Cleanup.** `DisposalManager.dispose()` cancels the RAF loop, removes listeners, disposes geometries/programs/textures, clears the meshes, and removes the canvas. Always call `grid.dispose()` in the React cleanup function or you'll leak the GL context across hot reloads.

---

## Customization recipes

- **More tiles visible at once.** Lower `tileSize` (e.g. `2`), or raise `baseCameraZ` (e.g. `14`).
- **Tighter, less moody mood.** Drop `vignetteDarkness` to ~0.6 and raise `vignetteOffset` to ~0.6.
- **Funhouse-mirror feel.** Set `distortionIntensity` to `0.4` or higher.
- **Square tiles instead of 3-wide-by-3-tall groups.** Pass `gridCols: 4, gridRows: 4` and pad `cards` to ≥16.
- **Centered card under the cursor on click.** After a successful click, call `gridRef.current.recenter(400)` to smoothly tween scroll back to origin.
- **Sanity / CMS-backed data.** Map each CMS entry to `CardData`; use the CMS thumbnail URL for `image`. The WebGL engine loads textures via `Image()`, so use still images / gifs, not videos. For video-thumbnail entries, generate or fall back to a still.

---

## Tips for AI coding tools

- **One-shot generation:** Ask for `PhantomLabGrid.tsx`, `PhantomLabGridClient.tsx`, and a stub `grid-engine/index.ts` exporting `InfiniteGridClass`. Then either install `ogl` from the spec or fetch the engine source — most agents handle the wrappers well and stall on the WebGL shader plumbing.
- **Routing:** Replace `/projects/${slug}` in the click handler to match your route shape (`/work/[slug]`, `/case/[slug]`, etc.).
- **Container sizing:** The canvas reads `container.clientWidth/clientHeight` once at init. If the container is `0×0` at mount, nothing renders. Always wrap in a `fixed inset-0` or a parent with explicit `width`/`height`.
- **Mobile:** Add `touch-action: none` (already in the example wrapper) so the browser doesn't intercept drags as page scrolls.
- **Dispose discipline:** This is the #1 reason WebGL components break in dev. The engine's `dispose()` must run in React's effect cleanup, and you must NOT keep a stale `grid` reference after unmount — otherwise hot reload spawns a second `<canvas>` and you double-render forever.
