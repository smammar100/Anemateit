# Phantom Lab Grid

> **Recreate this exact component.** Paste this entire prompt into any AI coding tool (Claude Code, Cursor, v0, Lovable, Bolt…) — it's self-contained, with the full source of every file included below. **Stack:** React 18 + TypeScript, styled with Tailwind CSS (swap the `className`s for inline styles if you're not using Tailwind). **Dependencies:** `npm i ogl gsap`. The card images use Picsum placeholders — swap in your own.

> Infinite, draggable, pannable WebGL card grid. Built on [ogl](https://github.com/oframe/ogl) and [gsap](https://gsap.com).

A 3×3 super-grid of textured card tiles that repeats seamlessly in every direction — pan to any distance, the grid never ends. Each tile renders title, image, tags, and date onto a baked Canvas 2D texture, with a blurred hover layer and a `tileClicked` CustomEvent for routing. The whole scene runs through a post-process pass that adds subtle barrel distortion and a vignette.

Use this for portfolio galleries, content explorers, "creative directory" landing experiences — anywhere you'd rather hand a visitor a tactile canvas of cards than a paged list.

## Installation

```bash
npm install ogl gsap
```

`ogl` is a ~30 KB lightweight WebGL library; `gsap` powers the hover tweens and the post-process intro animation. No three.js, no postprocessing libs.

## Compatibility

| Framework | Notes |
|-----------|-------|
| Next.js App Router | Default — keep the `'use client';` directive at the top of `PhantomLabGridClient.tsx`. |
| Vite + React | Delete the `'use client';` line. Replace `useRouter` from `next/navigation` with your router's equivalent, or just listen for the `tileClicked` event on the container. |
| Lovable / Bolt / v0 | Same as Vite — drop `'use client';`, swap the router. |
| Tailwind | Optional. The wrapper `<div>` uses a few Tailwind utility classes (`absolute inset-0 cursor-grab …`); inline-style equivalents work just as well. |

The renderer reads `container.clientWidth/clientHeight` once at init — the wrapping element must have explicit dimensions (`fixed inset-0`, or a `position: relative` parent with `width`/`height`).

## Usage

```tsx
import PhantomLabGrid from './components/phantom-lab-grid/PhantomLabGrid';

const cards = [
  { title: 'First', badge: 'demo', tags: ['react'], date: '2025', image: 'https://picsum.photos/seed/a/800/600', slug: 'first' },
  // …pad to ≥9 cards for a fully populated 3×3 group, or PhantomLabGrid will
  //  fill the remaining slots with picsum placeholders.
];

export default function Page() {
  return (
    <main className="fixed inset-0 bg-black">
      <PhantomLabGrid cards={cards} />
    </main>
  );
}
```

## Project structure

```
phantom-lab-grid/
├─ PhantomLabGrid.tsx                # Entry — accepts cards prop, pads to ≥9
├─ PhantomLabGridClient.tsx          # 'use client' — instantiates the engine, handles clicks
└─ grid-engine/
   ├─ index.ts                       # Barrel: exports InfiniteGridClass + types
   ├─ types.ts                       # CardData, InfiniteGridOptions, ScrollState, etc.
   ├─ shaders.ts                     # Foreground / background tile + post-process shaders
   ├─ createTexture.ts               # Canvas 2D → WebGL texture (title, tags, thumbnail composite)
   ├─ PostProcessShader.ts           # Vignette + barrel-distortion fragment shader
   ├─ DisposalManager.ts             # Tears down GL state and listeners on unmount
   ├─ EventHandler.ts                # Pointer / touch input, drag, momentum, click + hover dispatch
   ├─ GridManager.ts                 # Builds the 9 tile groups, generates textures, manages meshes
   └─ InfiniteGridClass.ts           # Main orchestrator: renderer, camera, scroll, render loop
```

## Source

### `src/components/phantom-lab-grid/grid-engine/types.ts`

```ts
import type { Texture, Vec3 } from 'ogl';

/** Data for one tile in the grid. */
export interface CardData {
  title: string;
  badge: string;
  description?: string;
  tags: string[];
  date: string;
  /** Texture URL for the tile (preferred for foreground). */
  image?: string;
  /** Project slug, surfaced on tile click via `tileClicked` event detail. */
  slug?: string;
  /** Original image path (echoed back in click events for routing). */
  imageSrc?: string;
}

export interface PostProcessParams {
  distortionIntensity?: number;
  vignetteOffset?: number;
  vignetteDarkness?: number;
}

export interface InfiniteGridOptions {
  gridCols?: number;
  gridRows?: number;
  gridGap?: number;
  tileSize?: number;
  baseCameraZ?: number;
  enablePostProcessing?: boolean;
  postProcessParams?: PostProcessParams;
}

export interface Position2D {
  x: number;
  y: number;
}

export interface ScrollState {
  scale: number;
  current: Position2D;
  last: Position2D;
}

/** One of the 9 tile groups (a 3x3 super-grid creates the infinite illusion). */
export interface TileGroupData {
  basePos: Vec3;
  offset: Position2D;
}

export interface TileUserData {
  groupIndex: number;
  tileIndex: number;
  tileKey: string;
}

export interface TileClickEventDetail {
  groupIndex: number;
  tileIndex: number;
  cardData: CardData;
}

export interface CardTexturePair {
  foreground: Texture | null;
  background: Texture | null;
}

export interface Viewport {
  width: number;
  height: number;
}

declare global {
  interface HTMLElementEventMap {
    tileClicked: CustomEvent<TileClickEventDetail>;
  }
}
```

### `src/components/phantom-lab-grid/grid-engine/shaders.ts`

```ts
// The background texture is already canvas-blurred at bake time
// (see createTexture.ts), so the runtime pass is a single sample.
export const gaussianBlurFragmentShader = /* glsl */ `precision highp float;

uniform sampler2D map;
uniform float uOpacity;

varying vec2 vUv;

void main() {
    vec4 c = texture2D(map, vUv);
    gl_FragColor = vec4(c.rgb, c.a * uOpacity);
}`;

export const gaussianBlurVertexShader = `
  attribute vec2 uv;
  attribute vec3 position;
  
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  
  varying vec2 vUv;
  
  void main() {
    // Flip UV coordinates 180 degrees (both X and Y)
    vUv = vec2(uv.x, 1.0 - uv.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const postProcessFragmentShader = /* glsl */ `precision highp float;

uniform sampler2D tDiffuse;
uniform vec2 distortion;
uniform float vignetteOffset;
uniform float vignetteDarkness;

varying vec2 vUv;

void main() {
    vec2 shiftedUv = 2.0 * (vUv - 0.5);
    float distanceToCenter = length(shiftedUv);

    // Lens distortion effect — radial pull based on distance from center.
    shiftedUv *= (0.88 + distortion.x * dot(shiftedUv, shiftedUv));
    vec2 transformedUv = shiftedUv * 0.5 + 0.5;

    // Standard vignette: smoothstep from offset (where dim begins) to darkness (full dim).
    float vignetteIntensity = smoothstep(vignetteOffset, vignetteDarkness, distanceToCenter);

    vec3 color = texture2D(tDiffuse, transformedUv).rgb * (1.0 - vignetteIntensity);
    gl_FragColor = vec4(color, 1.);
}`;

export const postProcessVertexShader = /* glsl */ `
attribute vec2 uv;
attribute vec3 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
```

### `src/components/phantom-lab-grid/grid-engine/createTexture.ts`

```ts
/**
 * Card Texture Generation Utilities for OGL
 *
 * Each card gets two textures:
 * 1. Foreground — title, image, tags, date composited onto 512×512 Canvas 2D
 * 2. Background — blurred + darkened copy of the same image (hover layer)
 *
 * Blur is baked at canvas-generation time (`ctx.filter = "blur(10px)"`), so the
 * runtime fragment shader is a single texture sample — the "gaussianBlur" name
 * on the shader is historical, not literal.
 */

import { Texture, type Renderer } from "ogl";
import type { CardData } from "./types";

/**
 * Builds a deterministic picsum URL keyed off the card's slug or title. Used
 * as the fallback when `image`/`imageSrc` is missing or fails to load — no
 * `public/` asset required to make a fresh project render.
 */
function fallbackImageUrl(data: CardData): string {
  const seed = data.slug || data.title || 'placeholder';
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/512/512`;
}

function cardImageUrl(data: CardData): string {
  return data.image ?? data.imageSrc ?? fallbackImageUrl(data);
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(String(src)));
    img.src = src;
  });
}

/** Tries the card's image URL, then falls back to a picsum seed. */
async function loadCardImageForTexture(data: CardData): Promise<HTMLImageElement | null> {
  const primaryUrl = cardImageUrl(data);
  try {
    return await loadImageElement(primaryUrl);
  } catch {
    const fallback = fallbackImageUrl(data);
    if (primaryUrl !== fallback) {
      try {
        return await loadImageElement(fallback);
      } catch {
        return null;
      }
    }
    return null;
  }
}

const cardWidth = 512;
const cardHeight = 512;
const padding = 30;

function createCanvasContext(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = cardWidth;
  canvas.height = cardHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context for canvas");
  }
  return { canvas, ctx };
}

// Module-level cache keyed on slug+url+tags — reused across all 9 tile groups
// so we generate N textures total (not 9N).
const textureCache = new Map<string, Texture>();

/**
 * Builds the foreground texture (title, image, tags, date). Returns the
 * canvas-baked OGL Texture. Falls back to a dark gradient placeholder if
 * both the primary URL and the picsum seed fail to load.
 */
export async function generateForegroundTexture(data: CardData, renderer: Renderer): Promise<Texture> {
  const cacheKey = `${data.slug ?? data.title}-${cardImageUrl(data)}-${data.tags?.join("-")}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const { canvas, ctx } = createCanvasContext();

  ctx.fillStyle = "white";
  ctx.strokeStyle = "rgba(60, 60, 60, 1)";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.rect(0, 0, cardWidth, cardHeight);
  ctx.stroke();

  let currentY = padding;

  // Title
  ctx.font = "24px Arial, sans-serif";
  ctx.fillStyle = "white";
  ctx.textBaseline = "top";

  const titleText = data.title;
  const titleMaxWidth = cardWidth - padding * 2;

  let truncatedTitle = titleText;
  let textMetrics = ctx.measureText(truncatedTitle);
  while (textMetrics.width > titleMaxWidth && truncatedTitle.length > 3) {
    truncatedTitle = truncatedTitle.substring(0, truncatedTitle.length - 4) + "...";
    textMetrics = ctx.measureText(truncatedTitle);
  }
  ctx.fillText(truncatedTitle, padding, currentY);

  const headerHeight = 24;
  currentY += headerHeight + 30;

  const topElementsMaxY = currentY;
  const bottomReservedSpace = 100;
  const availableImageHeight = cardHeight - topElementsMaxY - bottomReservedSpace;
  const availableImageWidth = cardWidth - padding * 2;

  const imageObj = await loadCardImageForTexture(data);
  if (imageObj && imageObj.naturalWidth > 0) {
    let imgWidth = imageObj.naturalWidth;
    let imgHeight = imageObj.naturalHeight;
    const naturalAspectRatio = imgWidth / imgHeight;

    if (imgWidth > availableImageWidth || imgHeight > availableImageHeight) {
      if (availableImageWidth / naturalAspectRatio <= availableImageHeight) {
        imgWidth = availableImageWidth;
        imgHeight = availableImageWidth / naturalAspectRatio;
      } else {
        imgHeight = availableImageHeight;
        imgWidth = availableImageHeight * naturalAspectRatio;
      }
    }

    const imageX = padding + (availableImageWidth - imgWidth) / 2;
    const imageY = topElementsMaxY + (availableImageHeight - imgHeight) / 2;
    ctx.drawImage(imageObj, imageX, imageY, imgWidth, imgHeight);
  } else {
    const grad = ctx.createLinearGradient(0, topElementsMaxY, 0, cardHeight - bottomReservedSpace);
    grad.addColorStop(0, "#1a1a1a");
    grad.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = grad;
    ctx.fillRect(padding, topElementsMaxY, availableImageWidth, availableImageHeight);
  }

  // Tags (rounded pills) — reserve bottom-right for the date so pills don't overlap.
  const tagFontSize = 16;
  const tagPaddingX = 15;
  const tagPaddingY = 8;
  const tagGap = 10;
  const tagsY = cardHeight - padding - tagFontSize - tagPaddingY;

  ctx.font = "20px Arial, sans-serif";
  const dateGap = 20;
  const dateWidth = ctx.measureText(data.date).width;
  const maxTagExtent = cardWidth - padding - dateWidth - dateGap;

  let currentXForTags = padding;
  for (const tagText of data.tags) {
    ctx.font = `${tagFontSize}px Helvetica, Arial, sans-serif`;
    ctx.textBaseline = "middle";

    const textToDraw = `#${tagText.toUpperCase()}`;
    const textMetrics = ctx.measureText(textToDraw);
    const tagLabelWidth = textMetrics.width;

    const tagShapeWidth = tagLabelWidth + tagPaddingX;
    const tagShapeHeight = tagFontSize + tagPaddingY;

    if (currentXForTags + tagShapeWidth > maxTagExtent) {
      break;
    }

    ctx.fillStyle = "rgba(248,250, 252, 0.15)";
    drawRoundedRect(ctx, currentXForTags, tagsY, tagShapeWidth, tagShapeHeight, tagShapeHeight / 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(textToDraw, currentXForTags + tagShapeWidth / 2, tagsY + tagShapeHeight / 2);

    currentXForTags += tagShapeWidth + tagGap;
  }

  // Date
  ctx.font = "20px Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 1)";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(data.date, cardWidth - padding, cardHeight - padding);

  const texture = new Texture(renderer.gl, {
    image: canvas,
    generateMipmaps: false,
    flipY: false,
  });

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Builds the background texture: scales the same image 2×, runs a canvas
 * blur over it, then overlays rgba(0,0,0,0.4). This is the hover layer —
 * it fades in when the foreground tile is hovered.
 */
export async function generateBackgroundTexture(data: CardData, renderer: Renderer): Promise<Texture> {
  const { canvas, ctx } = createCanvasContext();

  const bgImgEl = await loadCardImageForTexture(data);

  if (bgImgEl && bgImgEl.naturalWidth > 0) {
    const backgroundScale = 2.0;
    const bgImgWidth = bgImgEl.naturalWidth * backgroundScale;
    const bgImgHeight = bgImgEl.naturalHeight * backgroundScale;

    ctx.drawImage(
      bgImgEl,
      (cardWidth - bgImgWidth) / 2,
      (cardHeight - bgImgHeight) / 2,
      bgImgWidth,
      bgImgHeight,
    );

    ctx.filter = "blur(10px)";
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = "none";

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, cardWidth, cardHeight);
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, cardWidth, cardHeight);
  }

  const backgroundTexture = new Texture(renderer.gl, {
    image: canvas,
    generateMipmaps: false,
    flipY: false,
  });

  return backgroundTexture;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export async function generateCardTextures(data: CardData, renderer: Renderer): Promise<{
  foreground: Texture;
  background: Texture;
}> {
  const [foreground, background] = await Promise.all([
    generateForegroundTexture(data, renderer),
    generateBackgroundTexture(data, renderer),
  ]);
  return { foreground, background };
}
```

### `src/components/phantom-lab-grid/grid-engine/PostProcessShader.ts`

```ts
import {
  Program,
  RenderTarget,
  Mesh,
  Plane,
  Vec2,
  Renderer,
  Transform,
  Camera,
  Texture,
  type OGLRenderingContext,
} from "ogl";
import { gsap } from "gsap";
import { postProcessVertexShader, postProcessFragmentShader } from "./shaders";

interface CustomPostProcessShaderParameters {
  distortionIntensity?: number;
  vignetteOffset?: number;
  vignetteDarkness?: number;
}

/**
 * Renders a fullscreen quad sampling an input RenderTarget through a
 * distortion + vignette fragment shader. Parameters are GSAP-animatable
 * via the public getters/setters.
 */
export class CustomPostProcessShader {
  private gl: OGLRenderingContext;
  private mainRenderer: Renderer;
  private program: Program;
  private renderTarget: RenderTarget;
  private mesh: Mesh;
  private geometry: Plane;
  private scene: Transform;
  private camera: Camera;

  private _distortionIntensity: number = 0;
  private _vignetteOffset: number = 0.8;
  private _vignetteDarkness: number = 1.0;

  constructor(
    gl: OGLRenderingContext,
    mainRenderer: Renderer,
    initialParams: CustomPostProcessShaderParameters = {},
  ) {
    this.gl = gl;
    this.mainRenderer = mainRenderer;

    this._distortionIntensity = initialParams.distortionIntensity ?? 0;
    this._vignetteOffset = initialParams.vignetteOffset ?? 1.2;
    this._vignetteDarkness = initialParams.vignetteDarkness ?? 1.5;

    this.renderTarget = new RenderTarget(gl, {
      width: gl.canvas.width,
      height: gl.canvas.height,
    });

    this.geometry = new Plane(gl, { width: 2, height: 2 });

    this.program = new Program(gl, {
      vertex: postProcessVertexShader,
      fragment: postProcessFragmentShader,
      uniforms: {
        tDiffuse: { value: null },
        distortion: { value: new Vec2(0, 0) },
        vignetteOffset: { value: this._vignetteOffset },
        vignetteDarkness: { value: this._vignetteDarkness },
      },
      transparent: false,
      cullFace: false,
    });

    this.mesh = new Mesh(gl, {
      geometry: this.geometry,
      program: this.program,
    });

    this.scene = new Transform();
    this.mesh.setParent(this.scene);

    this.camera = new Camera(gl, {
      left: -1,
      right: 1,
      bottom: -1,
      top: 1,
      near: 0,
      far: 2,
    });
    this.camera.position.set(0, 0, 1);

    this.updateUniforms();
  }

  get distortionIntensity(): number {
    return this._distortionIntensity;
  }

  set distortionIntensity(value: number) {
    this._distortionIntensity = value;
    this.updateUniforms();
  }

  get vignetteOffset(): number {
    return this._vignetteOffset;
  }

  set vignetteOffset(value: number) {
    this._vignetteOffset = value;
    this.updateUniforms();
  }

  get vignetteDarkness(): number {
    return this._vignetteDarkness;
  }

  set vignetteDarkness(value: number) {
    this._vignetteDarkness = value;
    this.updateUniforms();
  }

  updateUniforms(): void {
    const aspectRatio = window.innerWidth / window.innerHeight;
    this.program.uniforms.distortion.value.set(
      this._distortionIntensity * aspectRatio,
      this._distortionIntensity,
    );
    this.program.uniforms.vignetteOffset.value = this._vignetteOffset;
    this.program.uniforms.vignetteDarkness.value = this._vignetteDarkness;
  }

  animate(
    targetDistortion: number,
    targetVignetteOffset: number,
    targetVignetteDarkness: number,
    duration: number = 1,
    delay: number = 0,
    ease: string = "power2.out",
  ): void {
    gsap.to(this, {
      distortionIntensity: targetDistortion,
      vignetteOffset: targetVignetteOffset,
      vignetteDarkness: targetVignetteDarkness,
      duration: duration,
      delay: delay,
      ease: ease,
      onUpdate: () => this.updateUniforms(),
    });
  }

  setInputTexture(texture: Texture | null): void {
    this.program.uniforms.tDiffuse.value = texture;
  }

  render(target: RenderTarget | null = null): void {
    if (target) {
      this.mainRenderer.render({ scene: this.scene, camera: this.camera, target });
    } else {
      this.mainRenderer.render({ scene: this.scene, camera: this.camera });
    }
  }

  resize(width: number, height: number): void {
    this.renderTarget.setSize(width, height);
    this.updateUniforms();
  }

  dispose(): void {
    /* Release references; WebGL objects follow context lifetime. */
    /* eslint-disable @typescript-eslint/no-explicit-any -- clear private OGL refs */
    const s = this as any;
    s.renderTarget = null;
    s.geometry = null;
    s.program = null;
    s.mesh = null;
    s.scene = null;
    s.camera = null;
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
}
```

### `src/components/phantom-lab-grid/grid-engine/DisposalManager.ts`

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DisposalManager — tears down the WebGL grid cleanly so React StrictMode
 * double-mounts and Fast Refresh don't leak GL contexts or orphan canvases.
 * Call `dispose()` in the React effect cleanup; everything else follows.
 */

import { Mesh, Transform, Renderer, Camera, RenderTarget } from 'ogl';
import type { CardTexturePair, TileGroupData } from "./types";
import { CustomPostProcessShader } from "./PostProcessShader";
import { EventHandler } from "./EventHandler";
import { GridManager } from "./GridManager";

export interface DisposableHost {
  animationFrameId: number | null;
  eventHandler?: EventHandler;
  gridManager: GridManager;
  scene: Transform;
  camera: Camera | null;
  renderer: Renderer | null;
  postProcessShader: CustomPostProcessShader | null;
  sceneRenderTarget: RenderTarget | null;
  groupObjects: Transform[];
  foregroundMeshMap: Map<string, Mesh>;
  backgroundMeshMap: Map<string, Mesh>;
  cardTextures: CardTexturePair[];
  staticUniforms: Map<string, any>;
  tileGroupsData: TileGroupData[];
  raycast: any;
  pointer: any;
  scrollTracker: { kill?: () => void } | null;
  container: HTMLElement;
}

export class DisposalManager {
  private host: DisposableHost;

  constructor(host: DisposableHost) {
    this.host = host;
  }

  public dispose(): void {
    this.stopAnimationLoop();
    this.cleanupEventListeners();
    this.cleanupGridManager();
    this.disposeSceneObjects();
    this.disposePostProcessing();
    this.disposeRenderer();
    this.clearDataStructures();
    this.cleanupAnimationSystems();
  }

  private stopAnimationLoop(): void {
    if (this.host.animationFrameId) {
      cancelAnimationFrame(this.host.animationFrameId);
      this.host.animationFrameId = null;
    }
  }

  private cleanupEventListeners(): void {
    if (this.host.eventHandler) {
      this.host.eventHandler.removeEventListeners();
    }
  }

  private cleanupGridManager(): void {
    if (this.host.gridManager) {
      this.host.gridManager.clear();
    }
  }

  private disposeSceneObjects(): void {
    this.host.groupObjects.forEach((group) => {
      this.disposeTransformAndChildren(group);
    });
    this.disposeTransformAndChildren(this.host.scene);
    this.host.foregroundMeshMap.forEach((mesh) => this.disposeMesh(mesh));
    this.host.backgroundMeshMap.forEach((mesh) => this.disposeMesh(mesh));
  }

  private disposeTransformAndChildren(transform: Transform): void {
    if (!transform) return;
    transform.traverse((child) => {
      if (child instanceof Mesh) {
        this.disposeMesh(child);
      }
    });
    (transform as any).parent = null;
    (transform as any).children = [];
  }

  private disposeMesh(mesh: Mesh): void {
    if (!mesh) return;
    (mesh as any).geometry = null;
    if ((mesh as any).program) {
      (mesh as any).program = null;
    }
    (mesh as any).userData = null;
    (mesh as any).parent = null;
  }

  private disposePostProcessing(): void {
    if (this.host.postProcessShader) {
      this.host.postProcessShader.dispose();
      this.host.postProcessShader = null;
    }
    if (this.host.sceneRenderTarget) {
      this.host.sceneRenderTarget = null;
    }
  }

  private disposeRenderer(): void {
    if (this.host.renderer) {
      const canvas = this.host.renderer.gl.canvas;
      if (canvas.parentNode === this.host.container) {
        this.host.container.removeChild(canvas);
      }
      this.host.renderer = null;
    }
    this.host.camera = null;
  }

  private clearDataStructures(): void {
    this.host.cardTextures.forEach((texturePair) => {
      texturePair.foreground = null;
      texturePair.background = null;
    });
    this.host.groupObjects = [];
    this.host.foregroundMeshMap.clear();
    this.host.backgroundMeshMap.clear();
    this.host.staticUniforms.clear();
    this.host.cardTextures = [];
    this.host.tileGroupsData = [];
    this.host.raycast = null;
    this.host.pointer = null;
  }

  private cleanupAnimationSystems(): void {
    this.host.scrollTracker?.kill?.();
    this.host.scrollTracker = null;
  }

  public partialCleanup(): void {
    this.stopAnimationLoop();
    this.host.cardTextures.forEach((texturePair) => {
      texturePair.foreground = null;
      texturePair.background = null;
    });
    this.host.cardTextures = [];
    this.host.foregroundMeshMap.clear();
    this.host.backgroundMeshMap.clear();
    this.host.staticUniforms.clear();
  }
}
```

### `src/components/phantom-lab-grid/grid-engine/EventHandler.ts`

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * EventHandler — pointer/touch input, drag + momentum, hover raycast,
 * click-with-drag-threshold, wheel, window resize. Calls back into the
 * host (InfiniteGridClass) for the actual scene updates.
 *
 * `wake()` is called on every input event so the host's idle rAF skip
 * resumes the render loop.
 */

import { gsap } from "gsap";
import { Mesh, Vec2 } from "ogl";
import type { Raycast } from "ogl";
import type { Position2D, ScrollState, TileUserData, TileClickEventDetail, CardData } from "./types";

function normalizeWheel(e: WheelEvent): { dx: number; dy: number } {
  let dx = e.deltaX;
  let dy = e.deltaY;
  if (e.deltaMode === 1) {
    dx *= 16;
    dy *= 16;
  } else if (e.deltaMode === 2) {
    dx *= window.innerWidth;
    dy *= window.innerHeight;
  }
  return { dx, dy };
}

export interface EventHandlerHost {
  container: HTMLElement;
  pointer: Vec2;
  raycast: Raycast;
  camera: any;
  renderer: any;
  sceneRenderTarget: any;
  postProcessShader: any;
  scroll: ScrollState;
  isDown: boolean;
  isHoveringCanvas: boolean;
  hasMovedSignificantly: boolean;
  startPosition: Position2D;
  scrollPosition: Position2D;
  currentHoveredTileKey: string;
  backgroundMeshMap: Map<string, Mesh>;
  foregroundMeshMap: Map<string, Mesh>;
  options: { baseCameraZ: number };
  maxClickMovement: number;
  hoverTransitionDuration: number;
  hoverEase: string;
  initialBackgroundOpacity: number;
  hoveredBackgroundOpacity: number;
  cardData: CardData[];
  afterContainerResize?(): void;
  updatePositions(): void;
  applyReleaseInertia(velXScreen: number, velYScreen: number): void;
  getTileKeyFromMesh(mesh: Mesh): string;
  getCardDataForTile(groupIndex: number, tileIndex: number): CardData;
  getInteractiveMeshes(): Mesh[];
  updatePointerCoordinates(clientX: number, clientY: number): void;
  performRaycast(): Mesh[];
  fadeInBackground(mesh: Mesh): void;
  fadeOutBackground(mesh: Mesh): void;
  /** Resume the render loop. Called whenever input arrives. */
  wake(): void;
  /** Toggle the cameraAnimating flag so rAF stays awake during tweens. */
  setCameraAnimating(on: boolean): void;
}

export class EventHandler {
  private host: EventHandlerHost;
  private isInitialized: boolean = false;
  private prevClientX = 0;
  private prevClientY = 0;
  /** Smoothed pointer velocity, exponential moving average. */
  private velX = 0;
  private velY = 0;

  constructor(host: EventHandlerHost) {
    this.host = host;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerOut = this.onPointerOut.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.handleMouseClick = this.handleMouseClick.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.onWheel = this.onWheel.bind(this);
  }

  public initialize(): void {
    if (this.isInitialized) {
      console.warn('EventHandler already initialized');
      return;
    }
    this.addEventListeners();
    this.isInitialized = true;
  }

  private onPointerDown(e: MouseEvent | TouchEvent): void {
    e.preventDefault();

    this.host.currentHoveredTileKey = "";
    this.host.isDown = true;
    this.host.hasMovedSignificantly = false;
    this.host.scrollPosition.x = this.host.scroll.current.x;
    this.host.scrollPosition.y = this.host.scroll.current.y;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    this.host.startPosition.x = clientX;
    this.host.startPosition.y = clientY;
    this.prevClientX = clientX;
    this.prevClientY = clientY;
    this.velX = 0;
    this.velY = 0;

    this.host.updatePointerCoordinates(clientX, clientY);
    this.host.wake();

    if (this.host.camera) {
      this.host.setCameraAnimating(true);
      gsap.to(this.host.camera.position, {
        z: this.host.options.baseCameraZ * 1.3,
        duration: 0.3,
        ease: "power2.out",
        overwrite: true,
        onComplete: () => this.host.setCameraAnimating(false),
      });
    }
  }

  private onPointerMove(e: MouseEvent | TouchEvent): void {
    if (!this.host.isDown) {
      if (e.target instanceof Node && this.host.container.contains(e.target)) {
        this.handleHover(e);
      }
      return;
    }

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const movementDistance = Math.sqrt(
      Math.pow(clientX - this.host.startPosition.x, 2) +
      Math.pow(clientY - this.host.startPosition.y, 2),
    );

    if (movementDistance > this.host.maxClickMovement) {
      this.host.hasMovedSignificantly = true;
    }

    const distanceX = (this.host.startPosition.x - clientX) * this.host.scroll.scale;
    const distanceY = (this.host.startPosition.y - clientY) * this.host.scroll.scale;

    // Direct write — the render loop is awake while isDown is true, so no
    // per-event GSAP tween is needed and we avoid spawning ~100 tweens/sec.
    this.host.scroll.current.x = this.host.scrollPosition.x - distanceX;
    this.host.scroll.current.y = this.host.scrollPosition.y + distanceY;

    const dx = clientX - this.prevClientX;
    const dy = clientY - this.prevClientY;
    this.prevClientX = clientX;
    this.prevClientY = clientY;
    this.velX = dx * 0.35 + this.velX * 0.65;
    this.velY = dy * 0.35 + this.velY * 0.65;
  }

  private onPointerUp(): void {
    this.host.isDown = false;

    if (this.host.currentHoveredTileKey) {
      const mesh = this.host.backgroundMeshMap.get(this.host.currentHoveredTileKey);
      if (mesh) {
        this.host.fadeOutBackground(mesh);
      }
      this.host.currentHoveredTileKey = "";
    }

    if (this.host.camera) {
      this.host.setCameraAnimating(true);
      gsap.to(this.host.camera.position, {
        z: this.host.options.baseCameraZ,
        duration: 0.3,
        ease: "power2.out",
        overwrite: true,
        onComplete: () => this.host.setCameraAnimating(false),
      });
    }

    this.host.applyReleaseInertia(this.velX, this.velY);
    this.host.wake();
  }

  private onPointerOut(): void {
    this.host.isHoveringCanvas = false;

    if (this.host.currentHoveredTileKey) {
      const mesh = this.host.backgroundMeshMap.get(this.host.currentHoveredTileKey);
      if (mesh) {
        this.host.fadeOutBackground(mesh);
      }
      this.host.currentHoveredTileKey = "";
    }
  }

  private onWindowResize(): void {
    const newWidth = this.host.container.clientWidth;
    const newHeight = this.host.container.clientHeight;

    if (this.host.camera) {
      this.host.camera.aspect = newWidth / newHeight;
      this.host.camera.perspective({ aspect: newWidth / newHeight });
    }

    if (this.host.renderer) {
      this.host.renderer.setSize(newWidth, newHeight);
    }

    if (this.host.sceneRenderTarget) {
      this.host.sceneRenderTarget.setSize(newWidth, newHeight);
    }
    if (this.host.postProcessShader) {
      this.host.postProcessShader.resize(newWidth, newHeight);
    }

    this.host.afterContainerResize?.();
    this.host.wake();
  }

  private handleHover(e: MouseEvent | TouchEvent): void {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    this.host.updatePointerCoordinates(clientX, clientY);

    const hits = this.host.performRaycast();
    const newHoveredTileKey = hits.length > 0 ? this.host.getTileKeyFromMesh(hits[0]) : "";

    if (newHoveredTileKey !== this.host.currentHoveredTileKey) {
      if (this.host.currentHoveredTileKey) {
        const prevMesh = this.host.backgroundMeshMap.get(this.host.currentHoveredTileKey);
        if (prevMesh) {
          this.host.fadeOutBackground(prevMesh);
        }
      }

      if (newHoveredTileKey) {
        const newMesh = this.host.backgroundMeshMap.get(newHoveredTileKey);
        if (newMesh) {
          this.host.fadeInBackground(newMesh);
        }
      }

      this.host.currentHoveredTileKey = newHoveredTileKey;
    }
  }

  private handleMouseClick(e: MouseEvent): void {
    if (this.host.hasMovedSignificantly) {
      return;
    }
    this.host.updatePointerCoordinates(e.clientX, e.clientY);
    this.performTileClick();
  }

  private handleTouchEnd(e: TouchEvent): void {
    this.onPointerUp();

    if (this.host.hasMovedSignificantly) {
      return;
    }

    if (e.changedTouches && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      this.host.updatePointerCoordinates(touch.clientX, touch.clientY);
      this.performTileClick();
    }
  }

  private performTileClick(): void {
    const hits = this.host.performRaycast();

    if (hits.length > 0) {
      const clickedMesh = hits[0];
      const userData = (clickedMesh as any).userData as TileUserData;

      if (userData) {
        const cardData = this.host.getCardDataForTile(userData.groupIndex, userData.tileIndex);

        const eventDetail: TileClickEventDetail = {
          groupIndex: userData.groupIndex,
          tileIndex: userData.tileIndex,
          cardData: cardData,
        };

        const customEvent = new CustomEvent<TileClickEventDetail>("tileClicked", {
          detail: eventDetail,
          bubbles: true,
          cancelable: true,
        });

        this.host.container.dispatchEvent(customEvent);
      }
    }
  }

  private addEventListeners(): void {
    this.host.container.addEventListener("mousedown", this.onPointerDown);
    // Listen on window so drag tracking works even when pointer leaves the container.
    window.addEventListener("mousemove", this.onPointerMove);
    window.addEventListener("mouseup", this.onPointerUp);
    this.host.container.addEventListener("mouseleave", this.onPointerOut);
    this.host.container.addEventListener("touchstart", this.onPointerDown, { passive: false });
    this.host.container.addEventListener("touchmove", this.onPointerMove, { passive: false });
    this.host.container.addEventListener("touchend", this.handleTouchEnd, { passive: true });

    this.host.container.addEventListener("click", this.handleMouseClick);

    window.addEventListener("resize", this.onWindowResize);
    this.host.container.addEventListener("wheel", this.onWheel, { passive: false });
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const { dx, dy } = normalizeWheel(e);
    const s = this.host.scroll.scale;
    this.host.scroll.current.x += dx * s;
    this.host.scroll.current.y += dy * s;
    this.host.updatePositions();
    this.host.wake();
  }

  public removeEventListeners(): void {
    if (!this.isInitialized) {
      return;
    }

    this.host.container.removeEventListener("mousedown", this.onPointerDown);
    window.removeEventListener("mousemove", this.onPointerMove);
    window.removeEventListener("mouseup", this.onPointerUp);
    this.host.container.removeEventListener("mouseleave", this.onPointerOut);
    this.host.container.removeEventListener("touchstart", this.onPointerDown);
    this.host.container.removeEventListener("touchmove", this.onPointerMove);
    this.host.container.removeEventListener("touchend", this.handleTouchEnd);
    this.host.container.removeEventListener("click", this.handleMouseClick);

    window.removeEventListener("resize", this.onWindowResize);
    this.host.container.removeEventListener("wheel", this.onWheel);

    this.isInitialized = false;
  }

  public get initialized(): boolean {
    return this.isInitialized;
  }
}
```

### `src/components/phantom-lab-grid/grid-engine/GridManager.ts`

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GridManager — builds the 3×3 super-grid of 9 tile groups, generates
 * foreground + background textures from card data, and wires every tile
 * mesh to share one Plane geometry + two Programs (foreground/background)
 * with per-mesh uniforms swapped via `onBeforeRender`.
 *
 * Note on `mesh.onBeforeRender`: it's a METHOD that pushes callbacks onto
 * `mesh.beforeRenderCallbacks`, NOT a property to assign. The callback
 * runs before `program.use()` uploads uniforms, so swapping the program's
 * uniform pointers in the callback lets one Program serve every tile.
 */

import { Renderer, Transform, Texture, Program, Mesh, Vec3, Plane } from 'ogl';
import { generateForegroundTexture, generateBackgroundTexture } from "./createTexture";
import { gaussianBlurVertexShader, gaussianBlurFragmentShader } from "./shaders";

import type { CardData, TileGroupData, TileUserData, CardTexturePair } from "./types";

const FOREGROUND_VERTEX_SHADER = `
  attribute vec2 uv;
  attribute vec3 position;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  varying vec2 vUv;

  void main() {
    vUv = vec2(uv.x, 1.0 - uv.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FOREGROUND_FRAGMENT_SHADER = `
  precision highp float;

  uniform sampler2D map;

  varying vec2 vUv;

  void main() {
    gl_FragColor = texture2D(map, vUv);
  }
`;

export interface GridManagerHost {
  renderer: Renderer | null;
  scene: Transform;
  cardData: CardData[];

  GRID_COLS: number;
  GRID_ROWS: number;
  GRID_WIDTH: number;
  GRID_HEIGHT: number;
  TILE_SIZE: number;
  TILE_SPACE: number;

  initialBackgroundOpacity: number;

  tileGroupsData: TileGroupData[];
  groupObjects: Transform[];
  foregroundMeshMap: Map<string, Mesh>;
  backgroundMeshMap: Map<string, Mesh>;
  cardTextures: CardTexturePair[];
  staticUniforms: Map<string, any>;
}

export class GridManager {
  private host: GridManagerHost;
  private isInitialized: boolean = false;

  // Shared resources reused across every tile to avoid 162 program
  // compilations + 162 geometry buffers for what is fundamentally 2
  // shader pairs and 1 plane.
  private sharedPlane: Plane | null = null;
  private sharedForegroundProgram: Program | null = null;
  private sharedBackgroundProgram: Program | null = null;

  constructor(host: GridManagerHost) {
    this.host = host;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('GridManager already initialized');
      return;
    }

    this.initializeTileGroups();
    await this.generateTexturesForCardData();
    this.createTiles();

    this.isInitialized = true;
  }

  /**
   * 3×3 super-grid: 9 tile groups laid out around the origin. Each group
   * gets shifted by ±TOTAL_GRID_WIDTH/HEIGHT as the scroll crosses the
   * viewport edge, producing the seamless infinite pan.
   */
  private initializeTileGroups(): void {
    this.host.tileGroupsData = [];
    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        this.host.tileGroupsData.push({
          basePos: new Vec3(this.host.GRID_WIDTH * c, this.host.GRID_HEIGHT * r, 0),
          offset: { x: 0, y: 0 },
        });
      }
    }
  }

  private createTiles(): void {
    // Renderer can be null if dispose() ran mid-init (StrictMode double-mount
    // races, Fast Refresh, navigation away during async texture load).
    // Abort silently — the disposed instance has nothing left to render to.
    if (!this.host.renderer) return;

    const gl = this.host.renderer.gl;

    this.sharedPlane = new Plane(gl, {
      width: this.host.TILE_SIZE,
      height: this.host.TILE_SIZE,
    });
    this.sharedForegroundProgram = new Program(gl, {
      vertex: FOREGROUND_VERTEX_SHADER,
      fragment: FOREGROUND_FRAGMENT_SHADER,
      uniforms: { map: { value: null } },
      transparent: true,
      cullFace: false,
    });
    this.sharedBackgroundProgram = new Program(gl, {
      vertex: gaussianBlurVertexShader,
      fragment: gaussianBlurFragmentShader,
      uniforms: { map: { value: null }, uOpacity: { value: 0 } },
      transparent: true,
      cullFace: false,
    });

    this.host.tileGroupsData.forEach((groupData, groupIndex) => {
      const groupObject = new Transform();
      groupObject.position.set(groupData.basePos.x, groupData.basePos.y, groupData.basePos.z);
      groupObject.setParent(this.host.scene);
      this.host.groupObjects[groupIndex] = groupObject;

      const startX = -((this.host.GRID_COLS - 1) / 2) * this.host.TILE_SPACE;
      const startY = ((this.host.GRID_ROWS - 1) / 2) * this.host.TILE_SPACE;

      for (let row = 0; row < this.host.GRID_ROWS; row++) {
        for (let col = 0; col < this.host.GRID_COLS; col++) {
          const x = startX + col * this.host.TILE_SPACE;
          const y = startY - row * this.host.TILE_SPACE;

          const tileIndex = row * this.host.GRID_COLS + col;
          const tileKey = this.getTileKey(groupIndex, tileIndex);

          this.createBackgroundMesh(gl, groupObject, groupIndex, tileIndex, tileKey, x, y);
          this.createForegroundMesh(gl, groupObject, groupIndex, tileIndex, tileKey, x, y);
        }
      }
    });
  }

  /**
   * Background mesh shares the global Plane + Program but carries per-mesh
   * uniforms (texture, hover opacity) swapped in via onBeforeRender.
   */
  private createBackgroundMesh(
    gl: any,
    groupObject: Transform,
    groupIndex: number,
    tileIndex: number,
    tileKey: string,
    x: number,
    y: number
  ): void {
    if (!this.sharedPlane || !this.sharedBackgroundProgram) return;

    const texture = this.getCardBackgroundTexture(groupIndex, tileIndex);
    const uniforms = {
      map: { value: texture },
      uOpacity: { value: this.host.initialBackgroundOpacity },
    };
    this.host.staticUniforms.set(tileKey, uniforms);

    const backgroundMesh = new Mesh(gl, {
      geometry: this.sharedPlane,
      program: this.sharedBackgroundProgram,
    });
    // All bg meshes share one Program. Swap the program's uniforms to this
    // mesh's values right before its draw call — OGL uploads uniforms in
    // `program.use()`, which runs AFTER `onBeforeRender`.
    (backgroundMesh as any).meshUniforms = uniforms;
    backgroundMesh.onBeforeRender(() => {
      const u = this.sharedBackgroundProgram?.uniforms;
      if (!u) return;
      u.map.value = uniforms.map.value;
      u.uOpacity.value = uniforms.uOpacity.value;
    });
    backgroundMesh.position.set(x, y, -0.01);
    backgroundMesh.visible = uniforms.uOpacity.value > 0;
    backgroundMesh.setParent(groupObject);
    this.host.backgroundMeshMap.set(tileKey, backgroundMesh);
  }

  private createForegroundMesh(
    gl: any,
    groupObject: Transform,
    groupIndex: number,
    tileIndex: number,
    tileKey: string,
    x: number,
    y: number
  ): void {
    if (!this.sharedPlane || !this.sharedForegroundProgram) return;

    const texture = this.getCardForegroundTexture(groupIndex, tileIndex);
    const uniforms = { map: { value: texture } };

    const foregroundMesh = new Mesh(gl, {
      geometry: this.sharedPlane,
      program: this.sharedForegroundProgram,
    });
    (foregroundMesh as any).meshUniforms = uniforms;
    foregroundMesh.onBeforeRender(() => {
      const u = this.sharedForegroundProgram?.uniforms;
      if (!u) return;
      u.map.value = uniforms.map.value;
    });
    foregroundMesh.position.set(x, y, 0);
    foregroundMesh.setParent(groupObject);

    (foregroundMesh as any).userData = {
      groupIndex,
      tileIndex,
      tileKey,
    } as TileUserData;

    this.host.foregroundMeshMap.set(tileKey, foregroundMesh);
  }

  public getTileKey(groupIndex: number, tileIndex: number): string {
    return `${groupIndex}-${tileIndex}`;
  }

  public getCardTextureIndex(groupIndex: number, tileIndex: number): number {
    const tilesPerGroup = this.host.GRID_COLS * this.host.GRID_ROWS;
    return (groupIndex * tilesPerGroup + tileIndex) % this.host.cardData.length;
  }

  public getCardForegroundTexture(groupIndex: number, tileIndex: number): Texture | null {
    if (this.host.cardTextures.length === 0) return null;
    const textureIndex = this.getCardTextureIndex(groupIndex, tileIndex);
    return this.host.cardTextures[textureIndex]?.foreground || null;
  }

  public getCardBackgroundTexture(groupIndex: number, tileIndex: number): Texture | null {
    if (this.host.cardTextures.length === 0) return null;
    const textureIndex = this.getCardTextureIndex(groupIndex, tileIndex);
    return this.host.cardTextures[textureIndex]?.background || null;
  }

  private async generateTexturesForCardData(): Promise<void> {
    // Capture synchronously: after `await`, `this.host.renderer` can be null
    // (e.g. Strict Mode dispose mid-init).
    const renderer = this.host.renderer;
    if (!renderer) throw new Error('Renderer not initialized');

    if (this.host.cardData.length === 0) {
      this.host.cardTextures = [];
      return;
    }

    const texturePromises = this.host.cardData.map(async (card): Promise<CardTexturePair> => {
      const foreground = await generateForegroundTexture(card, renderer);
      const background = await generateBackgroundTexture(card, renderer);
      return { foreground, background };
    });

    this.host.cardTextures = await Promise.all(texturePromises);
  }

  public getTileKeyFromMesh(mesh: Mesh): string {
    const userData = (mesh as any).userData as TileUserData;
    return userData?.tileKey || "";
  }

  public getCardDataForTile(groupIndex: number, tileIndex: number): CardData {
    const cardIndex = this.getCardTextureIndex(groupIndex, tileIndex);
    return (
      this.host.cardData[cardIndex] || {
        title: "Default Card",
        badge: "",
        description: "No data available",
        tags: [],
        date: new Date().getFullYear().toString(),
        slug: "",
      }
    );
  }

  public async updateCardData(newCardData: CardData[]): Promise<void> {
    this.host.cardData = newCardData;
    await this.generateTexturesForCardData();
    this.updateTileTextures();
  }

  private updateTileTextures(): void {
    this.host.tileGroupsData.forEach((_, groupIndex) => {
      for (let row = 0; row < this.host.GRID_ROWS; row++) {
        for (let col = 0; col < this.host.GRID_COLS; col++) {
          const tileIndex = row * this.host.GRID_COLS + col;
          const tileKey = this.getTileKey(groupIndex, tileIndex);

          const foregroundMesh = this.host.foregroundMeshMap.get(tileKey);
          const fgUniforms = (foregroundMesh as any)?.meshUniforms;
          if (fgUniforms) {
            const t = this.getCardForegroundTexture(groupIndex, tileIndex);
            if (t) fgUniforms.map.value = t;
          }

          const backgroundMesh = this.host.backgroundMeshMap.get(tileKey);
          const bgUniforms = (backgroundMesh as any)?.meshUniforms;
          if (bgUniforms) {
            const t = this.getCardBackgroundTexture(groupIndex, tileIndex);
            if (t) bgUniforms.map.value = t;
          }
        }
      }
    });
  }

  public getInteractiveMeshes(): Mesh[] {
    return Array.from(this.host.foregroundMeshMap.values());
  }

  public clear(): void {
    this.host.tileGroupsData = [];

    this.host.groupObjects.forEach((group) => {
      if (group && group.parent) {
        group.parent.removeChild(group);
      }
    });
    this.host.groupObjects = [];

    this.host.foregroundMeshMap.clear();
    this.host.backgroundMeshMap.clear();

    this.host.staticUniforms.clear();
    this.host.cardTextures = [];

    this.sharedPlane = null;
    this.sharedForegroundProgram = null;
    this.sharedBackgroundProgram = null;

    this.isInitialized = false;
  }

  public get initialized(): boolean {
    return this.isInitialized;
  }
}
```

### `src/components/phantom-lab-grid/grid-engine/InfiniteGridClass.ts`

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Renderer,
  Camera,
  Transform,
  Mesh,
  Vec2,
  RenderTarget,
  Raycast,
} from 'ogl';
import { gsap } from 'gsap';
import { CustomPostProcessShader } from './PostProcessShader';
import { EventHandler, type EventHandlerHost } from './EventHandler';
import { DisposalManager, type DisposableHost } from './DisposalManager';
import { GridManager, type GridManagerHost } from './GridManager';
import type {
  CardData,
  CardTexturePair,
  InfiniteGridOptions,
  PostProcessParams,
  Position2D,
  ScrollState,
  TileGroupData,
  Viewport,
} from './types';

export type ResolvedInfiniteGridOptions = Required<
  Omit<InfiniteGridOptions, 'postProcessParams'>
> & {
  postProcessParams: Required<PostProcessParams>;
};

/**
 * OGL-backed infinite-scrolling 3×3 grid of card tiles with optional
 * post-processing (distortion + vignette). Pan with pointer/touch; clicks
 * dispatch a `tileClicked` CustomEvent on the container with the tile's
 * CardData.
 *
 * Performance: render loop pauses after 3 idle frames (no drag, no inertia,
 * no camera tween) and resumes via `wake()` on input. Off-screen pauses
 * are handled by an IntersectionObserver; container resizes by a
 * ResizeObserver. DPR is capped at 2.
 */
export class InfiniteGridClass
  implements EventHandlerHost, DisposableHost, GridManagerHost
{
  public container: HTMLElement;
  public cardData: CardData[];
  public options: ResolvedInfiniteGridOptions;

  public readonly GRID_GAP: number;
  public readonly TILE_SIZE: number;
  public readonly TILE_SPACE: number;
  public readonly GRID_COLS: number;
  public readonly GRID_ROWS: number;
  public readonly GRID_WIDTH: number;
  public readonly GRID_HEIGHT: number;
  private readonly TOTAL_GRID_WIDTH: number;
  private readonly TOTAL_GRID_HEIGHT: number;

  public scene: Transform;
  public camera: Camera | null;
  public renderer: Renderer | null;
  public pointer: Vec2;
  public raycast: Raycast;

  public postProcessShader: CustomPostProcessShader | null;
  public sceneRenderTarget: RenderTarget | null;

  public groupObjects: Transform[];
  public foregroundMeshMap: Map<string, Mesh>;
  public backgroundMeshMap: Map<string, Mesh>;
  public cardTextures: CardTexturePair[];
  public staticUniforms: Map<string, any>;

  public currentHoveredTileKey: string;
  public isDown: boolean;
  public isHoveringCanvas: boolean;
  public hasMovedSignificantly: boolean;
  public startPosition: Position2D;
  public scrollPosition: Position2D;
  public scroll: ScrollState;
  private direction: Position2D;
  public scrollTracker: { kill?: () => void } | null;
  public scrollVelocity: Position2D;

  public readonly hoverTransitionDuration: number;
  public readonly hoverEase: string;
  public readonly initialBackgroundOpacity: number;
  public readonly hoveredBackgroundOpacity: number;
  public readonly maxClickMovement: number;

  public animationFrameId: number | null;
  public tileGroupsData: TileGroupData[];

  /** Number of consecutive idle frames seen — pause after a small grace
   *  period so GSAP-tween onUpdate side effects flush. */
  private idleFrameCount = 0;
  private cameraAnimating = false;
  /** True when the IntersectionObserver reports the grid is on-screen. */
  private isOnScreen = true;
  private visibilityObserver: IntersectionObserver | null = null;
  private containerResizeObserver: ResizeObserver | null = null;

  public eventHandler?: EventHandler;
  public gridManager: GridManager;
  private disposalManager: DisposalManager;

  /** Optional callback fired each frame with the scroll offset in CSS px. */
  public onScrollTransform:
    | ((offset: { x: number; y: number }) => void)
    | null = null;

  constructor(
    containerElement: HTMLElement,
    cardData: CardData[] = [],
    options: Partial<InfiniteGridOptions> = {},
  ) {
    if (!containerElement) {
      throw new Error('InfiniteGridClass: container element is required');
    }

    this.container = containerElement;
    this.cardData = cardData;

    this.options = {
      gridCols: options.gridCols ?? 3,
      gridRows: options.gridRows ?? 3,
      gridGap: options.gridGap ?? 0,
      tileSize: options.tileSize ?? 3,
      baseCameraZ: options.baseCameraZ ?? 10,
      enablePostProcessing: options.enablePostProcessing ?? true,
      postProcessParams: {
        distortionIntensity: 0.0,
        vignetteOffset: 1.2,
        vignetteDarkness: 1.5,
        ...options.postProcessParams,
      },
    } as ResolvedInfiniteGridOptions;

    this.GRID_GAP = this.options.gridGap;
    this.TILE_SIZE = this.options.tileSize;
    this.TILE_SPACE = this.TILE_SIZE + this.GRID_GAP;
    this.GRID_COLS = this.options.gridCols;
    this.GRID_ROWS = this.options.gridRows;
    this.GRID_WIDTH = this.TILE_SPACE * this.GRID_COLS;
    this.GRID_HEIGHT = this.TILE_SPACE * this.GRID_ROWS;
    this.TOTAL_GRID_WIDTH = this.GRID_WIDTH * 3;
    this.TOTAL_GRID_HEIGHT = this.GRID_HEIGHT * 3;

    this.scene = new Transform();
    this.camera = null;
    this.renderer = null;
    this.pointer = new Vec2();
    this.raycast = new Raycast();

    this.postProcessShader = null;
    this.sceneRenderTarget = null;

    this.groupObjects = [];
    this.foregroundMeshMap = new Map();
    this.backgroundMeshMap = new Map();
    this.cardTextures = [];
    this.staticUniforms = new Map();

    this.currentHoveredTileKey = '';
    this.isDown = false;
    this.isHoveringCanvas = false;
    this.hasMovedSignificantly = false;
    this.startPosition = { x: 0, y: 0 };
    this.scrollPosition = { x: 0, y: 0 };
    this.scroll = {
      scale: 0.012,
      current: { x: 0, y: 0 },
      last: { x: 0, y: 0 },
    };
    this.direction = { x: 0, y: 0 };
    this.scrollTracker = null;
    this.scrollVelocity = { x: 0, y: 0 };

    this.hoverTransitionDuration = 0.6;
    this.hoverEase = 'power2.out';
    this.initialBackgroundOpacity = 0.0;
    this.hoveredBackgroundOpacity = 1.0;
    this.maxClickMovement = 5;

    this.animationFrameId = null;
    this.tileGroupsData = [];

    this.eventHandler = new EventHandler(this);
    this.gridManager = new GridManager(this);
    this.disposalManager = new DisposalManager(this);

    this.render = this.render.bind(this);
  }

  public async init(): Promise<void> {
    this.setupRenderer();
    this.setupCamera();
    this.setupPostProcessing();

    await this.gridManager.initialize();

    this.eventHandler?.initialize();
    this.setupVisibilityObserver();
    this.setupContainerResizeObserver();

    // Light intro animation: settle from slight distortion into resting params.
    this.animatePostProcessing(-0.1, 0.3, 1.25, 1.5, 1.5, 'power3.out');

    this.updatePositions();
    this.idleFrameCount = 0;
    this.animationFrameId = requestAnimationFrame(this.render);
  }

  private setupVisibilityObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    this.visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          this.setOnScreen(entry.isIntersecting);
        }
      },
      { threshold: 0 },
    );
    this.visibilityObserver.observe(this.container);
  }

  private setupContainerResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') return;
    this.containerResizeObserver = new ResizeObserver(() => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      if (w === 0 || h === 0) return;
      if (this.camera) {
        this.camera.aspect = w / h;
        this.camera.perspective({ aspect: w / h });
      }
      this.renderer?.setSize(w, h);
      this.sceneRenderTarget?.setSize(w, h);
      this.postProcessShader?.resize(w, h);
      this.wake();
    });
    this.containerResizeObserver.observe(this.container);
  }

  private setupRenderer(): void {
    const gl =
      this.container.ownerDocument
        .createElement('canvas')
        .getContext('webgl2') ||
      this.container.ownerDocument.createElement('canvas').getContext('webgl');
    if (!gl) throw new Error('WebGL not supported');

    // Cap DPR at 2 — on 3× phone displays this is the difference between
    // ~2× and ~4× fragment work for an effect that doesn't benefit visibly
    // from the extra resolution.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.renderer = new Renderer({
      canvas: gl.canvas as HTMLCanvasElement,
      width: this.container.clientWidth,
      height: this.container.clientHeight,
      dpr,
      alpha: true,
      antialias: true,
    });

    this.renderer.gl.canvas.style.width = '100%';
    this.renderer.gl.canvas.style.height = '100%';

    this.container.appendChild(this.renderer.gl.canvas);
  }

  private setupCamera(): void {
    const aspectRatio =
      this.container.clientWidth / this.container.clientHeight;
    this.camera = new Camera(this.renderer!.gl, {
      fov: 45,
      aspect: aspectRatio,
      near: 1,
      far: 1000,
    });
    this.camera.position.set(0, 0, this.options.baseCameraZ);
  }

  private setupPostProcessing(): void {
    if (!this.options.enablePostProcessing || !this.renderer) return;

    this.sceneRenderTarget = new RenderTarget(this.renderer.gl, {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    });

    this.postProcessShader = new CustomPostProcessShader(
      this.renderer.gl,
      this.renderer,
      this.options.postProcessParams,
    );
  }

  private get viewport(): Viewport {
    if (!this.camera) return { width: 0, height: 0 };
    const fov = this.camera.fov * (Math.PI / 180);
    const viewHeight = 2 * Math.tan(fov / 2) * this.camera.position.z;
    return { width: viewHeight * this.camera.aspect, height: viewHeight };
  }

  public getScrollCssOffset(): { x: number; y: number } {
    const v = this.viewport;
    if (v.width <= 0 || v.height <= 0) return { x: 0, y: 0 };
    return {
      x: (this.scroll.current.x / v.width) * this.container.clientWidth,
      y: -(this.scroll.current.y / v.height) * this.container.clientHeight,
    };
  }

  public updatePositions(): void {
    const scrollX = this.scroll.current.x;
    const scrollY = this.scroll.current.y;

    this.direction.y =
      this.scroll.current.y > this.scroll.last.y
        ? -1
        : this.scroll.current.y < this.scroll.last.y
          ? 1
          : 0;
    this.direction.x =
      this.scroll.current.x > this.scroll.last.x
        ? -1
        : this.scroll.current.x < this.scroll.last.x
          ? 1
          : 0;

    this.tileGroupsData.forEach((groupData, i) => {
      const groupObject = this.groupObjects[i];
      if (!groupObject) return;

      const posX = groupData.basePos.x + scrollX + groupData.offset.x;
      const posY = groupData.basePos.y + scrollY + groupData.offset.y;

      const groupOffX = this.GRID_WIDTH / 2;
      const groupOffY = this.GRID_HEIGHT / 2;
      const v = this.viewport;
      const viewportOffX = v.width / 2;
      const viewportOffY = v.height / 2;

      if (this.direction.x < 0 && posX - groupOffX > viewportOffX) {
        groupData.offset.x -= this.TOTAL_GRID_WIDTH;
      } else if (this.direction.x > 0 && posX + groupOffX < -viewportOffX) {
        groupData.offset.x += this.TOTAL_GRID_WIDTH;
      }
      if (this.direction.y < 0 && posY - groupOffY > viewportOffY) {
        groupData.offset.y -= this.TOTAL_GRID_HEIGHT;
      } else if (this.direction.y > 0 && posY + groupOffY < -viewportOffY) {
        groupData.offset.y += this.TOTAL_GRID_HEIGHT;
      }

      groupObject.position.x =
        groupData.basePos.x + scrollX + groupData.offset.x;
      groupObject.position.y =
        groupData.basePos.y + scrollY + groupData.offset.y;
      groupObject.position.z = groupData.basePos.z;
    });
  }

  public applyReleaseInertia(velXScreen: number, velYScreen: number): void {
    const s = this.scroll.scale;
    this.scrollVelocity.x = -velXScreen * s;
    this.scrollVelocity.y = velYScreen * s;
  }

  /** Smoothly tween scroll back to origin. */
  public recenter(durationMs = 600): void {
    const sx = this.scroll.current.x;
    const sy = this.scroll.current.y;
    const start = performance.now();
    this.scrollVelocity.x = 0;
    this.scrollVelocity.y = 0;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const ease = 1 - Math.pow(1 - t, 3);
      this.scroll.current.x = sx + (0 - sx) * ease;
      this.scroll.current.y = sy + (0 - sy) * ease;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  public getInteractiveMeshes(): Mesh[] {
    return this.gridManager.getInteractiveMeshes();
  }

  public updatePointerCoordinates(clientX: number, clientY: number): void {
    if (!this.renderer) return;
    const rect = this.renderer.gl.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    this.pointer.set(x, y);
  }

  public performRaycast(): Mesh[] {
    if (!this.camera || !this.renderer) return [];
    this.raycast.castMouse(this.camera, this.pointer);
    const hits = this.raycast.intersectBounds(this.getInteractiveMeshes());
    return hits.filter((m) => m.visible);
  }

  public getTileKeyFromMesh(mesh: Mesh): string {
    return this.gridManager.getTileKeyFromMesh(mesh);
  }

  public fadeInBackground(mesh: Mesh): void {
    const u = (mesh as any).meshUniforms;
    if (!u?.uOpacity) return;
    mesh.visible = true;
    this.wake?.();
    gsap.to(u.uOpacity, {
      value: this.hoveredBackgroundOpacity,
      duration: this.hoverTransitionDuration,
      ease: this.hoverEase,
      overwrite: true,
      onUpdate: () => this.wake?.(),
    });
  }

  public fadeOutBackground(mesh: Mesh): void {
    const u = (mesh as any).meshUniforms;
    if (!u?.uOpacity) return;
    this.wake?.();
    gsap.to(u.uOpacity, {
      value: this.initialBackgroundOpacity,
      duration: this.hoverTransitionDuration,
      ease: this.hoverEase,
      overwrite: true,
      onUpdate: () => this.wake?.(),
      onComplete: () => {
        if (u.uOpacity.value <= 0) mesh.visible = false;
      },
    });
  }

  public getCardDataForTile(groupIndex: number, tileIndex: number): CardData {
    return this.gridManager.getCardDataForTile(groupIndex, tileIndex);
  }

  /** Indicates the render loop has real work to do this frame. */
  private isBusy(): boolean {
    if (this.isDown) return true;
    if (this.cameraAnimating) return true;
    if (Math.abs(this.scrollVelocity.x) > 1e-7) return true;
    if (Math.abs(this.scrollVelocity.y) > 1e-7) return true;
    return false;
  }

  /** Resume the rAF loop. Safe to call repeatedly; no-ops if already running. */
  public wake = (): void => {
    this.idleFrameCount = 0;
    if (!this.isOnScreen) return;
    if (this.animationFrameId !== null) return;
    this.animationFrameId = requestAnimationFrame(this.render);
  };

  public setOnScreen(on: boolean): void {
    this.isOnScreen = on;
    if (on) this.wake();
    else if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public setCameraAnimating(on: boolean): void {
    this.cameraAnimating = on;
    if (on) this.wake();
  }

  private render(): void {
    if (!this.isDown) {
      const vx = this.scrollVelocity.x;
      const vy = this.scrollVelocity.y;
      if (Math.abs(vx) > 1e-7 || Math.abs(vy) > 1e-7) {
        this.scroll.current.x += vx;
        this.scroll.current.y += vy;
        const friction = 0.94;
        this.scrollVelocity.x *= friction;
        this.scrollVelocity.y *= friction;
        if (Math.abs(this.scrollVelocity.x) < 1e-6) this.scrollVelocity.x = 0;
        if (Math.abs(this.scrollVelocity.y) < 1e-6) this.scrollVelocity.y = 0;
      }
    }

    this.updatePositions();
    this.onScrollTransform?.(this.getScrollCssOffset());

    if (this.renderer && this.camera) {
      if (
        this.options.enablePostProcessing &&
        this.postProcessShader &&
        this.sceneRenderTarget
      ) {
        this.renderer.render({
          scene: this.scene,
          camera: this.camera,
          target: this.sceneRenderTarget,
        });
        this.postProcessShader.setInputTexture(this.sceneRenderTarget.texture);
        this.postProcessShader.render(null);
      } else {
        this.renderer.render({ scene: this.scene, camera: this.camera });
      }
    }

    this.scroll.last.x = this.scroll.current.x;
    this.scroll.last.y = this.scroll.current.y;

    // Idle skip: render a couple of trailing frames so GSAP-driven uniforms
    // (uOpacity fades, postProcessShader animations) settle before we pause.
    if (this.isBusy()) {
      this.idleFrameCount = 0;
    } else {
      this.idleFrameCount += 1;
    }

    if (this.idleFrameCount >= 3 || !this.isOnScreen) {
      this.animationFrameId = null;
      return;
    }
    this.animationFrameId = requestAnimationFrame(this.render);
  }

  public animatePostProcessing(
    targetDistortion: number,
    targetVignetteOffset: number,
    targetVignetteDarkness: number,
    duration = 1,
    delay = 0,
    ease = 'power2.out',
  ): void {
    if (!this.postProcessShader) return;
    // Keep the render loop awake while the post-process tween is running so
    // the new uniforms actually paint to screen.
    this.cameraAnimating = true;
    this.wake();
    this.postProcessShader.animate(
      targetDistortion,
      targetVignetteOffset,
      targetVignetteDarkness,
      duration,
      delay,
      ease,
    );
    const totalMs = (delay + duration) * 1000;
    window.setTimeout(() => {
      this.cameraAnimating = false;
    }, totalMs + 32);
  }

  public setPostProcessingEnabled(enabled: boolean): void {
    this.options.enablePostProcessing = enabled;
  }

  public get distortionIntensity(): number {
    return this.postProcessShader?.distortionIntensity ?? 0;
  }
  public set distortionIntensity(value: number) {
    if (this.postProcessShader) this.postProcessShader.distortionIntensity = value;
  }

  public get vignetteOffset(): number {
    return this.postProcessShader?.vignetteOffset ?? 0.8;
  }
  public set vignetteOffset(value: number) {
    if (this.postProcessShader) this.postProcessShader.vignetteOffset = value;
  }

  public get vignetteDarkness(): number {
    return this.postProcessShader?.vignetteDarkness ?? 1.0;
  }
  public set vignetteDarkness(value: number) {
    if (this.postProcessShader) this.postProcessShader.vignetteDarkness = value;
  }

  public dispose(): void {
    this.onScrollTransform = null;
    this.visibilityObserver?.disconnect();
    this.visibilityObserver = null;
    this.containerResizeObserver?.disconnect();
    this.containerResizeObserver = null;
    this.disposalManager.dispose();
  }

  public getEventHandler(): EventHandler | undefined {
    return this.eventHandler;
  }

  public getGridManager(): GridManager {
    return this.gridManager;
  }

  public getDisposalManager(): DisposalManager {
    return this.disposalManager;
  }

  public async updateCardData(newCardData: CardData[]): Promise<void> {
    this.cardData = newCardData;
    await this.gridManager.updateCardData(newCardData);
  }
}
```

### `src/components/phantom-lab-grid/grid-engine/index.ts`

```ts
export { InfiniteGridClass } from './InfiniteGridClass';
export type { ResolvedInfiniteGridOptions } from './InfiniteGridClass';
export type {
  CardData,
  InfiniteGridOptions,
  PostProcessParams,
  TileClickEventDetail,
} from './types';
```

### `src/components/phantom-lab-grid/PhantomLabGridClient.tsx`

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { InfiniteGridClass } from './grid-engine';
import type { CardData, TileClickEventDetail } from './grid-engine/types';

/**
 * Client wrapper around the OGL InfiniteGridClass engine. Renders a
 * full-bleed WebGL canvas of card tiles, pannable with momentum. Clicking
 * a tile routes to `/projects/[slug]`.
 *
 * Mount guard: React StrictMode + Fast Refresh in dev can run this effect
 * twice in quick succession. We use a ref-guarded singleton + prune any
 * stray <canvas> children from a previous instance on mount.
 */
export default function PhantomLabGridClient({ cards }: { cards: CardData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<InfiniteGridClass | null>(null);
  const router = useRouter();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || cards.length === 0) return;

    // Guard against double-mount: if an instance is already running on
    // this container, leave it alone.
    if (gridRef.current) return;

    // Defensive: prune any orphan canvases left behind by a previous
    // mount whose cleanup didn't fully run (Fast Refresh, etc.).
    container.querySelectorAll('canvas').forEach((c) => c.remove());

    const onTileClicked = (e: Event) => {
      const slug = (e as CustomEvent<TileClickEventDetail>).detail.cardData.slug;
      if (slug) router.push(`/projects/${slug}`);
    };
    container.addEventListener('tileClicked', onTileClicked);

    const grid = new InfiniteGridClass(container, cards, {
      gridCols: 3,
      gridRows: 3,
      tileSize: 3,
      baseCameraZ: 10,
      enablePostProcessing: true,
      postProcessParams: {
        distortionIntensity: 0,
        vignetteOffset: 0.3,
        vignetteDarkness: 1.25,
      },
    });
    gridRef.current = grid;

    grid.init().catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error('[PhantomLabGrid] init error:', err);
    });

    return () => {
      container.removeEventListener('tileClicked', onTileClicked);
      grid.dispose();
      gridRef.current = null;
    };
  }, [cards, router]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Phantom Lab Grid"
      className="absolute inset-0 h-full w-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: 'none', background: '#080808' }}
    />
  );
}
```

### `src/components/phantom-lab-grid/PhantomLabGrid.tsx`

```tsx
import type { CardData } from './grid-engine/types';
import PhantomLabGridClient from './PhantomLabGridClient';

const MIN_CARDS = 9;

interface PhantomLabGridProps {
  /** Tile content. Pad to ≥9 for a fully populated 3×3 group; this entry
   *  pads with picsum placeholders if you pass fewer. */
  cards: CardData[];
}

/**
 * Generic, prop-based entry — works in any framework. Replace with your
 * own data wiring (CMS query, server component fetch, etc.) once the
 * integration is validated.
 */
export default function PhantomLabGrid({ cards }: PhantomLabGridProps) {
  const fillerCount = Math.max(0, MIN_CARDS - cards.length);
  const fillerCards: CardData[] = Array.from({ length: fillerCount }, (_, i) => {
    const src = `https://picsum.photos/seed/phantom-grid-filler-${i}/800/600`;
    return { title: '', badge: '', tags: [], date: '', image: src, imageSrc: src };
  });

  return <PhantomLabGridClient cards={[...cards, ...fillerCards]} />;
}
```

## API reference

### `<PhantomLabGrid />`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `cards` | `CardData[]` | yes | Tile content. The entry pads with picsum placeholders when fewer than 9. |

### `CardData`

```ts
interface CardData {
  title: string;             // Rendered on the tile (large)
  badge: string;             // Small badge label
  description?: string;      // Echoed in the click event detail
  tags: string[];            // Rendered as rounded pills at the tile bottom
  date: string;              // Date/year string in the bottom-right corner
  image?: string;            // Texture URL — picsum is the fallback if missing/broken
  slug?: string;             // Echoed in the click event for routing
  imageSrc?: string;         // Optional duplicate of `image` for query-param echo
}
```

### `InfiniteGridOptions`

Pass these to the `InfiniteGridClass` constructor inside `PhantomLabGridClient.tsx`:

| Option | Default | Effect |
|--------|---------|--------|
| `gridCols` | 3 | Columns in one tile group |
| `gridRows` | 3 | Rows in one tile group |
| `gridGap` | 0 | World-unit gap between tiles |
| `tileSize` | 3 | World-unit edge length per tile (raise for larger tiles, lower to fit more on screen) |
| `baseCameraZ` | 10 | Camera distance — larger = wider field of view across more tiles |
| `enablePostProcessing` | true | Toggles the distortion + vignette pass |
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

### Tile clicks

The container dispatches a `tileClicked` CustomEvent. `PhantomLabGridClient.tsx` already wires this to `next/navigation`'s `useRouter`. To use a different router, replace the listener:

```tsx
container.addEventListener('tileClicked', (e) => {
  const { cardData } = e.detail;
  // Vite / Lovable / Bolt: window.location.assign(`/projects/${cardData.slug}`);
  // React Router:         navigate(`/projects/${cardData.slug}`);
});
```

## How it works

1. **Infinite 3×3 super-grid.** The scene contains 9 tile groups laid out in a 3×3 super-grid (`TOTAL_GRID_WIDTH = GRID_WIDTH * 3`). On every frame, `updatePositions()` checks the scroll direction and shifts a group's `offset.x/y` by ±`TOTAL_GRID_WIDTH/HEIGHT` whenever it crosses the viewport edge in the direction of travel. The effect is seamless tiling regardless of pan distance.

2. **Texture composition.** Each card's foreground texture is rendered on an offscreen Canvas 2D context — thumbnail image, title, tag pills, date — composited into one image and uploaded to a GL texture once. The background texture is a pre-blurred, darkened copy of the same image. Blur is baked at canvas time (`ctx.filter = "blur(10px)"`), so the runtime fragment shader is a single texture sample with an opacity multiplier.

3. **Shared programs + per-mesh uniforms.** All 81 foreground tiles share one `Plane` geometry + one `Program`; all 81 background tiles share another `Program`. Each mesh registers an `onBeforeRender` callback that swaps the program's uniform values to its own `meshUniforms` right before the draw call. This collapses ~162 program compilations into 2.

4. **Hover + click.** `EventHandler` raycasts the pointer against the foreground meshes on every move. On hover, `fadeInBackground` tweens the background mesh's `uOpacity` from 0 → 1 over 0.6s (`power2.out`); on leave it tweens back and the mesh is hidden when `uOpacity` reaches 0 (so 81 invisible bg tiles aren't drawn at rest). A click only fires if the pointer moved less than `maxClickMovement = 5` px between down and up — drags don't trigger navigation.

5. **Momentum scrolling.** Pointer release captures a smoothed velocity (`v = dx * 0.35 + v * 0.65`, exponential moving average) and feeds `applyReleaseInertia()`, which damps the scroll by `friction = 0.94` per frame until effectively zero. No external inertia plugin.

6. **Post-processing.** The scene renders into a `RenderTarget`, then a fullscreen quad samples the target through the distortion + vignette fragment shader. Toggle with `enablePostProcessing: false` for a flat look.

7. **Idle rAF skip.** The render loop pauses after 3 consecutive idle frames (no drag, no inertia, no camera tween). Input events call `wake()` to resume it. Zero WebGL work at rest.

8. **Off-screen pause.** An `IntersectionObserver` on the container suspends the loop while the grid scrolls out of view; a `ResizeObserver` updates the camera, renderer, and post-target when the container resizes.

9. **DPR cap.** Renderer DPR is clamped to 2 (on 3× phone displays this is the difference between 2× and ~4× fragment work).

10. **Cleanup.** `DisposalManager.dispose()` cancels the rAF loop, removes listeners, disposes geometries/programs/textures, clears the meshes, and removes the canvas. The React effect cleanup in `PhantomLabGridClient.tsx` calls `grid.dispose()` — never keep a stale `grid` reference after unmount or hot reload will spawn a second canvas.

## Customization recipes

- **More tiles visible at once.** Lower `tileSize` (e.g. `2`), or raise `baseCameraZ` (e.g. `14`).
- **Tighter, less moody mood.** Drop `vignetteDarkness` to ~0.6 and raise `vignetteOffset` to ~0.6.
- **Funhouse-mirror feel.** Set `distortionIntensity` to `0.4` or higher.
- **Square tiles instead of 3×3 groups.** Pass `gridCols: 4, gridRows: 4` and pad `cards` to ≥16.
- **Center the clicked card after navigation.** Call `gridRef.current.recenter(400)` after a successful click to smoothly tween scroll back to origin.
- **CMS-backed data.** Map each CMS entry to `CardData`; use the CMS thumbnail URL for `image`. The WebGL engine loads textures via `Image()`, so use still images or gifs, not videos. For video-thumbnail entries, generate or fall back to a still.

## Notes

- The renderer initializes from `container.clientWidth/clientHeight`. A `0×0` parent renders nothing — always wrap in `fixed inset-0` or a parent with explicit dimensions.
- `mesh.onBeforeRender(fn)` is a method that pushes `fn` onto `mesh.beforeRenderCallbacks`. Don't assign `mesh.onBeforeRender = fn` — that overwrites the method and the callback never runs.
- The mount guard in `PhantomLabGridClient.tsx`'s `useEffect` is load-bearing under React StrictMode and Fast Refresh. Keep it.
- `touch-action: none` on the wrapper is required so mobile browsers don't intercept drags as page scrolls.
