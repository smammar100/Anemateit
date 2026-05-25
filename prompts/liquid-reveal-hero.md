# Liquid Reveal Hero

Build a hero where a portrait reveals an alternate "reveal" image (helmet, alt shot, anything) under the cursor, with a **liquid-edged brush mask** plus a **diagonal wireframe sweep** that shimmers across the lit area every few seconds. Two textured planes drawn to a WebGL canvas through a custom GLSL fragment shader. Inspired by landonorris.com (OFF+BRAND); shader adapted from a CodePen by Daniel Muñoz.

## Setup

**Works in:** v0 · Lovable · Bolt · Cursor · Next.js App Router · Vite + React. Single drop-in file.

**Dependencies:** `three` (runtime) and `@types/three` (dev — TypeScript only). Three.js adds ~150 KB gzipped — the GLSL shader is inline, no other graphics libraries required.

```bash
npm i three
npm i -D @types/three
```

**`'use client';` directive:** The component file starts with `'use client';`. **Keep it** in Next.js App Router (v0 default). **Delete that line** in Vite, Lovable, Bolt, or any other plain React setup — it's an inert string there but some bundlers warn on it.

**Fonts:** No custom fonts. The wordmark / backdrop overlays use whatever default sans-serif your project provides (the look is bold + italic via Tailwind utilities — no specific font family).

**Tailwind:** Standard utilities only — used for the wordmark/backdrop overlay positioning (`absolute` + `clamp()`). No custom `tailwind.config` changes, no theme tokens. If you don't have Tailwind, rewrite `className` strings as inline `style` — the layout has no dependency on custom classes.

**Quick usage:**

```tsx
import LiquidRevealHero from './components/LiquidRevealHero';
// <div className="aspect-[16/9] w-full">
//   <LiquidRevealHero portraitSrc="https://picsum.photos/seed/p/1200/1600" revealSrc="https://picsum.photos/seed/h/1200/1600" />
// </div>
```

---

## Component (paste into `components/LiquidRevealHero.tsx`)

```tsx
'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Props = {
  /** Bottom layer image (always visible). */
  portraitSrc: string;
  /** Top layer image (revealed inside the cursor brush). */
  revealSrc: string;
  firstName?: string;
  lastName?: string;
  backdrop?: string;
  /** Scale of the helmet (reveal) plane relative to the portrait. Default 1. */
  revealScale?: number;
};

export default function LiquidRevealHero({
  portraitSrc,
  revealSrc,
  firstName = 'LANDO',
  lastName = 'NORRIS',
  backdrop = '04',
  revealScale = 1,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    // ── scene & camera ──────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const sizeToContainer = () => {
      const { width, height } = wrap.getBoundingClientRect();
      renderer.setSize(width, height, false);
      const aspect = width / height;
      camera.left = -aspect;
      camera.right = aspect;
      camera.top = 1;
      camera.bottom = -1;
      camera.updateProjectionMatrix();
    };

    // Contain (letterbox) sizing — keeps near-square assets from cropping.
    const fitContain = (plane: THREE.Mesh, tex: THREE.Texture) => {
      if (!tex.image) return;
      const { width, height } = wrap.getBoundingClientRect();
      const imgAspect = tex.image.width / tex.image.height;
      const winAspect = width / height;
      if (imgAspect >= winAspect) {
        plane.scale.set(winAspect, winAspect / imgAspect, 1);
      } else {
        plane.scale.set(imgAspect, 1, 1);
      }
    };

    // ── paint mask (canvas-backed texture) ──────────────────────────────
    const MASK_SIZE = 1024;
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = MASK_SIZE;
    maskCanvas.height = MASK_SIZE;
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, MASK_SIZE, MASK_SIZE);
    const maskTexture = new THREE.CanvasTexture(maskCanvas);

    const BRUSH_RADIUS = 120;
    const paintBrush = (x: number, y: number, dx = 0, dy = 0) => {
      const speed = Math.hypot(dx, dy);
      const angle = speed > 1 ? Math.atan2(dy, dx) : 0;
      const stretch = 1 + Math.min(speed / (BRUSH_RADIUS * 0.4), 3.0);
      maskCtx.save();
      maskCtx.translate(x, y);
      maskCtx.rotate(angle);
      maskCtx.scale(stretch, 1);
      const g = maskCtx.createRadialGradient(0, 0, 0, 0, 0, BRUSH_RADIUS);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.65, 'rgba(255,255,255,0.9)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      maskCtx.fillStyle = g;
      maskCtx.beginPath();
      maskCtx.arc(0, 0, BRUSH_RADIUS, 0, Math.PI * 2);
      maskCtx.fill();
      maskCtx.restore();
      maskTexture.needsUpdate = true;
    };

    // ── pointer tracking ────────────────────────────────────────────────
    let mouseNormX = 0, mouseNormY = 0, smoothX = 0, smoothY = 0, smoothZ = 0;
    let prevMouse: { x: number; y: number } | null = null;
    let lastMouseTime = performance.now();

    const handleMove = (clientX: number, clientY: number) => {
      const r = wrap.getBoundingClientRect();
      if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) {
        prevMouse = null;
        return;
      }
      lastMouseTime = performance.now();
      const localX = clientX - r.left;
      const localY = clientY - r.top;
      mouseNormX = (localX / r.width - 0.5) * 2;
      mouseNormY = -(localY / r.height - 0.5) * 2;
      const winAspect = r.width / r.height;
      const worldX = ((localX / r.width) * 2 - 1) * winAspect;
      const worldY = 1 - (localY / r.height) * 2;
      const scaleX = plane2.scale.x;
      const scaleY = plane2.scale.y;
      const cx = ((worldX + scaleX) / (2 * scaleX)) * MASK_SIZE;
      const cy = ((scaleY - worldY) / (2 * scaleY)) * MASK_SIZE;
      if (prevMouse) {
        const dx = cx - prevMouse.x;
        const dy = cy - prevMouse.y;
        const steps = Math.max(1, Math.floor(Math.hypot(dx, dy) / (BRUSH_RADIUS * 0.25)));
        for (let i = 0; i <= steps; i++) {
          paintBrush(prevMouse.x + (dx * i) / steps, prevMouse.y + (dy * i) / steps, dx, dy);
        }
      } else {
        paintBrush(cx, cy);
      }
      prevMouse = { x: cx, y: cy };
    };

    const onMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onLeave = () => { prevMouse = null; };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('touchend', onLeave);

    // ── textures ───────────────────────────────────────────────────────
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';

    const plane1Material = new THREE.MeshBasicMaterial({ transparent: true });
    const plane1 = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), plane1Material);
    scene.add(plane1);
    textureLoader.load(portraitSrc, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      plane1Material.map = tex;
      plane1Material.needsUpdate = true;
      fitContain(plane1, tex);
    });

    // ── reveal plane: liquid edge mask + diagonal wireframe SHIMMER ────
    const plane2Material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTexture: { value: null },
        uMask: { value: maskTexture },
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTexture;
        uniform sampler2D uMask;
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          // ---- LIQUID REVEAL ----
          // Domain-warp the UV used to sample the brush mask so the edge
          // wobbles like a liquid surface instead of a hard circle.
          vec2 wUv = vUv + vec2(
            sin(vUv.y * 5.0 + uTime * 0.9) * 0.02,
            cos(vUv.x * 5.0 + uTime * 0.7) * 0.02
          );
          vec2 d1 = vec2(
            sin(wUv.y * 4.0 + uTime * 1.4) * cos(wUv.x * 3.0 + uTime * 1.1),
            cos(wUv.x * 3.5 + uTime * 1.3) * sin(wUv.y * 2.5 + uTime * 0.9)
          ) * 0.045;
          vec2 d2 = vec2(
            sin(wUv.y * 11.0 - uTime * 2.6 + wUv.x * 5.0),
            cos(wUv.x * 9.0  + uTime * 2.9 - wUv.y * 6.0)
          ) * 0.022;
          vec2 distort = d1 + d2;

          float mask = texture2D(uMask, vUv + distort).r;

          // Additional high-frequency noise, but ONLY at the mask edge.
          float noise =
            sin(vUv.x * 18.0 + uTime * 2.0) * cos(vUv.y * 16.0 + uTime * 1.7) * 0.22
          + sin(vUv.x * 38.0 - uTime * 3.2) * cos(vUv.y * 33.0 + uTime * 2.6) * 0.11;
          float edgeMask = smoothstep(0.05, 0.35, mask) * (1.0 - smoothstep(0.35, 0.65, mask));
          float liquidMask = mask + noise * edgeMask * 1.8;
          float alpha = smoothstep(0.45, 0.55, liquidMask);

          vec4 imgColor = texture2D(uTexture, vUv);
          vec4 revealColor = vec4(imgColor.rgb, alpha);

          // ---- DIAGONAL WIREFRAME SHIMMER ----
          // A diagonal line sweeps from top-left to bottom-right every 5s.
          // Within ±0.1 of the line we draw the image texture at low alpha,
          // and on a 100x100 grid (line condition below) at full alpha —
          // giving the characteristic "scanned hologram" shimmer.
          float t = mod(uTime, 5.0) / 5.0;
          float target = t * 2.5 - 0.25;
          float dist = (vUv.x + vUv.y) - target;
          float sweepIntensity = max(0.0, 1.0 - abs(dist) / 0.1);

          vec2 grid = fract(vUv * 100.0);
          float thickness = 0.03;
          bool isLine = grid.x < thickness || grid.y < thickness || abs(grid.x - grid.y) < thickness;

          vec4 wireColor = vec4(0.0);
          if (sweepIntensity > 0.0) {
            float baseAlpha = sweepIntensity * 0.18;
            wireColor = vec4(imgColor.rgb, isLine ? sweepIntensity : baseAlpha);
          }

          gl_FragColor = mix(revealColor, wireColor, wireColor.a);
        }
      `,
    });
    const plane2 = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), plane2Material);
    plane2.position.z = 0.01;
    scene.add(plane2);
    textureLoader.load(revealSrc, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      plane2Material.uniforms.uTexture.value = tex;
      plane2Material.needsUpdate = true;
      fitContain(plane2, tex);
      plane2.scale.multiplyScalar(revealScale);
    });

    sizeToContainer();
    if (plane1Material.map) fitContain(plane1, plane1Material.map);

    const ro = new ResizeObserver(() => {
      sizeToContainer();
      if (plane1Material.map) fitContain(plane1, plane1Material.map);
      if (plane2Material.uniforms.uTexture.value) {
        fitContain(plane2, plane2Material.uniforms.uTexture.value);
        plane2.scale.multiplyScalar(revealScale);
      }
    });
    ro.observe(wrap);

    // ── tick ────────────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      const elapsed = clock.getElapsedTime();
      plane2Material.uniforms.uTime.value = elapsed;

      // Idle Lissajous sweep keeps the shimmer alive when the cursor is still.
      const secondsSinceMouse = (performance.now() - lastMouseTime) / 1000;
      const targetX = mouseNormX;
      const targetY = mouseNormY;
      if (secondsSinceMouse > 2.0) {
        const zigX = Math.sin(elapsed * 1.1);
        const zigY = Math.sin(elapsed * 0.7);
        const r = wrap.getBoundingClientRect();
        const winAspect = r.width / r.height;
        const worldX = zigX * winAspect;
        const worldY = zigY;
        const scaleX = plane2.scale.x;
        const scaleY = plane2.scale.y;
        const cx = ((worldX + scaleX) / (2 * scaleX)) * MASK_SIZE;
        const cy = ((scaleY - worldY) / (2 * scaleY)) * MASK_SIZE;
        paintBrush(cx, cy);
      }

      // Soft parallax — planes drift toward the cursor on x/y, and toward
      // the camera on z when the cursor moves far from center.
      smoothX += (targetX - smoothX) * 0.06;
      smoothY += (targetY - smoothY) * 0.06;
      const distNorm = Math.hypot(targetX, targetY);
      smoothZ += (distNorm - smoothZ) * 0.06;
      plane1.position.set(smoothX * 0.012, smoothY * 0.012, -smoothZ * 0.03);
      plane2.position.set(smoothX * 0.02, smoothY * 0.02, 0.01 + smoothZ * 0.05);

      const lookTarget = new THREE.Vector3(smoothX * 0.3, smoothY * 0.3, 5);
      plane1.lookAt(lookTarget);
      plane2.lookAt(lookTarget);

      // Fade the brush trail every frame so the reveal collapses again.
      maskCtx.fillStyle = 'rgba(0,0,0,0.018)';
      maskCtx.fillRect(0, 0, MASK_SIZE, MASK_SIZE);
      maskTexture.needsUpdate = true;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('touchend', onLeave);
      plane1Material.map?.dispose();
      plane1Material.dispose();
      plane2Material.uniforms.uTexture.value?.dispose?.();
      plane2Material.dispose();
      maskTexture.dispose();
      plane1.geometry.dispose();
      plane2.geometry.dispose();
      renderer.dispose();
    };
  }, [portraitSrc, revealSrc, revealScale]);

  return (
    <section
      ref={wrapRef}
      className="relative w-full h-full overflow-hidden bg-black text-white cursor-crosshair"
    >
      <div className="absolute inset-0 grid place-items-center pointer-events-none select-none z-0">
        <span
          aria-hidden
          className="font-black italic leading-[0.85] tracking-[-0.05em] text-transparent"
          style={{
            WebkitTextStroke: '2.5px #d2ff00',
            fontSize: 'clamp(120px, 22vw, 420px)',
            filter:
              'drop-shadow(0 0 24px rgba(210,255,0,0.4)) drop-shadow(0 0 48px rgba(210,255,0,0.2))',
          }}
        >
          {backdrop}
        </span>
      </div>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 block" />
      <h1
        className="absolute m-0 font-black uppercase tracking-[-0.03em] text-white z-20 pointer-events-none"
        style={{
          top: 'clamp(20px, 3.5vw, 56px)',
          left: 'clamp(16px, 3vw, 40px)',
          fontSize: 'clamp(32px, 5vw, 82px)',
          lineHeight: 0.92,
        }}
      >
        {firstName}
      </h1>
      <h2
        className="absolute m-0 font-black uppercase tracking-[-0.03em] text-white z-20 pointer-events-none"
        style={{
          bottom: 'clamp(20px, 3.5vw, 56px)',
          right: 'clamp(16px, 3vw, 40px)',
          fontSize: 'clamp(32px, 5vw, 82px)',
          lineHeight: 0.92,
        }}
      >
        {lastName}
      </h2>
      <span
        className="absolute uppercase font-medium z-20 text-white/60 pointer-events-none"
        style={{
          left: 'clamp(16px, 3vw, 40px)',
          bottom: 'clamp(20px, 3vw, 40px)',
          fontSize: 11,
          letterSpacing: '0.22em',
        }}
      >
        Move to reveal
      </span>
    </section>
  );
}
```

## Use it

```tsx
<div className="aspect-[16/9] w-full">
  <LiquidRevealHero
    portraitSrc="/portrait.webp"
    revealSrc="/helmet.webp"
    firstName="LANDO"
    lastName="NORRIS"
    backdrop="04"
    revealScale={0.75}
  />
</div>
```

The component is container-bound (it watches its own size via `ResizeObserver`), so wrap it in whatever aspect-ratio box you want — `aspect-[16/9]`, `aspect-square`, full viewport via `w-screen h-screen`, etc.

Best results: portrait-orientation PNG/WebP with a transparent or matching-color background, subject anchored to the bottom of the frame. The shader uses `contain` (letterbox) sizing so near-square assets don't get aggressively zoomed.

### Paste-and-run demo

```tsx
<div className="aspect-[16/9] w-full">
  <LiquidRevealHero
    portraitSrc="https://picsum.photos/seed/portrait/1200/1600"
    revealSrc="https://picsum.photos/seed/helmet/1200/1600"
  />
</div>
```

## How it works (1-minute mental model)

1. **Two textured planes** in an orthographic Three.js scene — `plane1` is the always-visible portrait, `plane2` is the helmet (reveal layer) rendered just in front.
2. **Brush-painted mask** — every cursor move paints a soft-radial white blob into an off-screen 1024×1024 canvas that's wrapped as a `THREE.CanvasTexture`. Each frame, a thin 1.8% black rectangle is overlaid so the brush trail fades naturally.
3. **Liquid edge** — the fragment shader samples that mask using domain-warped UVs (`d1` and `d2` sums of sin/cos), then adds high-frequency noise but only inside an `edgeMask` that isolates the soft border. The result is a wobbling, water-on-glass edge instead of a hard circle.
4. **Diagonal wireframe shimmer** — a sweep line `(vUv.x + vUv.y) = target` walks across the frame every 5 s (`t = mod(uTime, 5.0) / 5.0`). Within ±0.1 of that line, the shader draws the reveal texture at low alpha *plus* a 100×100 grid (`fract(vUv * 100.0)` with `thickness = 0.03`) at full alpha — giving a brief scanned-hologram pass over whatever you're hovering.
5. **Parallax + look-at** — both planes slow-lerp toward the cursor in x/y and toward the camera in z. They also subtly `lookAt` a point offset by the cursor, so the whole hero reads as a slightly 3D object rather than a flat composite.
6. **Idle motion** — if the cursor sits still for >2 s, an internal Lissajous oscillator keeps painting the mask, so the shimmer/reveal never goes static when nobody's interacting.

## Tweak knobs

| Want | Change |
|---|---|
| Bigger brush | `BRUSH_RADIUS = 120` → `180` |
| Sharper edge (less liquid) | Drop the noise multiplier `* 1.8` to `* 0.6`, or shorten the `smoothstep(0.45, 0.55, ...)` range to `(0.48, 0.52, ...)` |
| Wobblier liquid | Increase `d1` and `d2` amplitude (currently `0.045`, `0.022`) — try `0.08` and `0.04` |
| Faster shimmer sweep | Lower `mod(uTime, 5.0) / 5.0` divisor → `mod(uTime, 2.0) / 2.0` |
| Wider shimmer band | Increase `0.1` in `1.0 - abs(dist) / 0.1` → `0.2` |
| Different shimmer grid | Change `vUv * 100.0` (denser) / `vUv * 50.0` (sparser); `thickness = 0.03` controls line weight |
| Smaller helmet relative to portrait | `revealScale={0.75}` (default 1) |
| Snappier parallax | Raise the `0.06` lerp factors |
| Different backdrop color | Replace `#d2ff00` in the `WebkitTextStroke` / `drop-shadow` filter |

## Mobile fallback

Touch is wired (`touchstart`, `touchmove`, `touchend`) — tap-and-drag paints the brush exactly like the mouse, and the idle Lissajous still runs. For `prefers-reduced-motion`, wrap the whole `useEffect` body in a `matchMedia('(prefers-reduced-motion: reduce)').matches` early-return and render a static `<img src={portraitSrc}>` instead.

## Done.

Two image URLs, one component file (~330 lines), one `npm i three`. Move the cursor across the hero — the helmet is revealed inside a liquid blob, the shimmer wireframe sweeps across whatever's lit every 5 s, and the whole thing parallaxes subtly toward your cursor.
