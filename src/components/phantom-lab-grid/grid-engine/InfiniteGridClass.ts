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
 * OGL-backed infinite-scrolling 3x3 grid of card tiles with optional
 * post-processing (distortion + vignette). Pan with pointer/touch; clicks
 * dispatch a `tileClicked` CustomEvent on the container with the tile's
 * `CardData`.
 */
export class InfiniteGridClass
  implements EventHandlerHost, DisposableHost, GridManagerHost
{
  public container: HTMLElement;
  public cardData: CardData[];
  public options: ResolvedInfiniteGridOptions;

  // Grid layout (world units)
  public readonly GRID_GAP: number;
  public readonly TILE_SIZE: number;
  public readonly TILE_SPACE: number;
  public readonly GRID_COLS: number;
  public readonly GRID_ROWS: number;
  public readonly GRID_WIDTH: number;
  public readonly GRID_HEIGHT: number;
  private readonly TOTAL_GRID_WIDTH: number;
  private readonly TOTAL_GRID_HEIGHT: number;

  // OGL core
  public scene: Transform;
  public camera: Camera | null;
  public renderer: Renderer | null;
  public pointer: Vec2;
  public raycast: Raycast;

  // Post-processing
  public postProcessShader: CustomPostProcessShader | null;
  public sceneRenderTarget: RenderTarget | null;

  // Scene structure
  public groupObjects: Transform[];
  public foregroundMeshMap: Map<string, Mesh>;
  public backgroundMeshMap: Map<string, Mesh>;
  public cardTextures: CardTexturePair[];
  public staticUniforms: Map<string, any>;

  // Interaction state
  public currentHoveredTileKey: string;
  public isDown: boolean;
  public isHoveringCanvas: boolean;
  public hasMovedSignificantly: boolean;
  public startPosition: Position2D;
  public scrollPosition: Position2D;
  public scroll: ScrollState;
  private direction: Position2D;
  /** Kept null — retained for DisposableHost shape. */
  public scrollTracker: { kill?: () => void } | null;
  public scrollVelocity: Position2D;

  // Hover animation knobs
  public readonly hoverTransitionDuration: number;
  public readonly hoverEase: string;
  public readonly initialBackgroundOpacity: number;
  public readonly hoveredBackgroundOpacity: number;
  public readonly maxClickMovement: number;

  public animationFrameId: number | null;
  public tileGroupsData: TileGroupData[];

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

    // Light intro animation: settle from slight distortion into resting params.
    this.animatePostProcessing(-0.1, 0.3, 1.25, 1.5, 1.5, 'power3.out');

    this.updatePositions();
    this.render();
  }

  private setupRenderer(): void {
    const gl =
      this.container.ownerDocument
        .createElement('canvas')
        .getContext('webgl2') ||
      this.container.ownerDocument.createElement('canvas').getContext('webgl');
    if (!gl) throw new Error('WebGL not supported');

    this.renderer = new Renderer({
      canvas: gl.canvas as HTMLCanvasElement,
      width: this.container.clientWidth,
      height: this.container.clientHeight,
      dpr: window.devicePixelRatio,
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

  /** Scroll position translated to CSS pixels (for HTML overlays). */
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

      // Wrap groups around for the infinite effect.
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

  /** Apply friction-based inertia after pointer release. */
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
    if (mesh.program?.uniforms.uOpacity) {
      gsap.to(mesh.program.uniforms.uOpacity, {
        value: this.hoveredBackgroundOpacity,
        duration: this.hoverTransitionDuration,
        ease: this.hoverEase,
        overwrite: true,
      });
    }
  }

  public fadeOutBackground(mesh: Mesh): void {
    if (mesh.program?.uniforms.uOpacity) {
      gsap.to(mesh.program.uniforms.uOpacity, {
        value: this.initialBackgroundOpacity,
        duration: this.hoverTransitionDuration,
        ease: this.hoverEase,
        overwrite: true,
      });
    }
  }

  public getCardDataForTile(groupIndex: number, tileIndex: number): CardData {
    return this.gridManager.getCardDataForTile(groupIndex, tileIndex);
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
    this.postProcessShader?.animate(
      targetDistortion,
      targetVignetteOffset,
      targetVignetteDarkness,
      duration,
      delay,
      ease,
    );
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
