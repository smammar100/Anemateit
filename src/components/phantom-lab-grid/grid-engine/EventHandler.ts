/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @fileoverview EventHandler - Event Management System for InfiniteGrid
 *
 * This module handles all user interactions for the infinite grid system,
 * including pointer events (mouse/touch), hover effects, click detection,
 * and window resize handling.
 *
 * Key Responsibilities:
 * - Pointer down/move/up event handling for scrolling
 * - Touch event support with proper coordinate handling
 * - Hover state management with background blur effects
 * - Click detection with movement threshold
 * - Window resize handling for responsive behavior
 * - Event listener lifecycle management
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

/**
 * Interface defining the required properties and methods that the EventHandler
 * needs to access from the main InfiniteGrid class
 */
export interface EventHandlerHost {
  // Container and interaction state
  container: HTMLElement;
  pointer: Vec2;
  raycast: Raycast;
  camera: any;
  renderer: any;

  // Post processing
  sceneRenderTarget: any;
  postProcessShader: any;

  // Scroll and movement state
  scroll: ScrollState;
  isDown: boolean;
  isHoveringCanvas: boolean;
  hasMovedSignificantly: boolean;
  startPosition: Position2D;
  scrollPosition: Position2D;

  // Hover state
  currentHoveredTileKey: string;
  backgroundMeshMap: Map<string, Mesh>;
  foregroundMeshMap: Map<string, Mesh>;

  // Configuration
  options: {
    baseCameraZ: number;
  };

  // Animation constants
  maxClickMovement: number;
  hoverTransitionDuration: number;
  hoverEase: string;
  initialBackgroundOpacity: number;
  hoveredBackgroundOpacity: number;

  // Card data
  cardData: CardData[];

  /** Optional: run after camera/renderer/post target size changes. */
  afterContainerResize?(): void;

  // Methods that need to be called
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

/**
 * EventHandler class manages all user interactions for the infinite grid
 * 
 * This class encapsulates event handling logic including:
 * - Mouse and touch input processing
 * - Hover state management with visual feedback
 * - Click detection with drag threshold
 * - Responsive window resize handling
 * - Event listener lifecycle management
 */
export class EventHandler {
  private host: EventHandlerHost;
  private isInitialized: boolean = false;
  /** Previous pointer position while dragging (for release velocity) */
  private prevClientX = 0;
  private prevClientY = 0;
  /** Smoothed pointer velocity (pixels per move event) */
  private velX = 0;
  private velY = 0;

  /**
   * Creates a new EventHandler instance
   * @param host - The main grid class that provides required properties and methods
   */
  constructor(host: EventHandlerHost) {
    this.host = host;

    // Bind all event handler methods to maintain proper 'this' context
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerOut = this.onPointerOut.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.handleMouseClick = this.handleMouseClick.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.onWheel = this.onWheel.bind(this);
  }

  /**
   * Initializes event listeners
   * Should be called once after the grid is set up
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.warn('EventHandler already initialized');
      return;
    }

    this.addEventListeners();
    this.isInitialized = true;
  }

  /**
   * Handles pointer down events (mouse button press or touch start)
   * Initiates drag interaction and camera zoom
   */
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

  /**
   * Handles pointer move events (mouse move or touch move)
   * Processes scrolling or hover states depending on interaction state
   */
  private onPointerMove(e: MouseEvent | TouchEvent): void {
    if (!this.host.isDown) {
      // Only handle hover when pointer is over the container
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
    // per-event GSAP tween is needed and we avoid the overhead of spawning
    // ~100 tweens/sec during a drag.
    this.host.scroll.current.x = this.host.scrollPosition.x - distanceX;
    this.host.scroll.current.y = this.host.scrollPosition.y + distanceY;

    const dx = clientX - this.prevClientX;
    const dy = clientY - this.prevClientY;
    this.prevClientX = clientX;
    this.prevClientY = clientY;
    this.velX = dx * 0.35 + this.velX * 0.65;
    this.velY = dy * 0.35 + this.velY * 0.65;
  }

  /**
   * Handles pointer up events (mouse button release or touch end)
   * Ends drag interaction and applies inertia scrolling
   */
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

  /**
   * Handles pointer leaving the canvas area
   * Clears hover states when mouse exits
   */
  private onPointerOut(): void {
    this.host.isHoveringCanvas = false;

    // Clear hover state when pointer leaves canvas
    if (this.host.currentHoveredTileKey) {
      const mesh = this.host.backgroundMeshMap.get(this.host.currentHoveredTileKey);
      if (mesh) {
        this.host.fadeOutBackground(mesh);
      }
      this.host.currentHoveredTileKey = "";
    }
  }

  /**
   * Handles window resize events
   * Updates camera aspect ratio and renderer size
   */
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

    // Update post-processing render targets
    if (this.host.sceneRenderTarget) {
      this.host.sceneRenderTarget.setSize(newWidth, newHeight);
    }
    if (this.host.postProcessShader) {
      this.host.postProcessShader.resize(newWidth, newHeight);
    }

    this.host.afterContainerResize?.();
    this.host.wake();
  }

  /**
   * Handles hover effects when not dragging
   * Manages background blur fade in/out based on tile intersection
   */
  private handleHover(e: MouseEvent | TouchEvent): void {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    // Update pointer coordinates for raycasting
    this.host.updatePointerCoordinates(clientX, clientY);

    const hits = this.host.performRaycast();

    // Handle hover state changes
    const newHoveredTileKey = hits.length > 0 ? this.host.getTileKeyFromMesh(hits[0]) : "";

    // If hovering over a different tile
    if (newHoveredTileKey !== this.host.currentHoveredTileKey) {
      // Fade out previous hovered tile
      if (this.host.currentHoveredTileKey) {
        const prevMesh = this.host.backgroundMeshMap.get(this.host.currentHoveredTileKey);
        if (prevMesh) {
          this.host.fadeOutBackground(prevMesh);
        }
      }

      // Fade in new hovered tile
      if (newHoveredTileKey) {
        const newMesh = this.host.backgroundMeshMap.get(newHoveredTileKey);
        if (newMesh) {
          this.host.fadeInBackground(newMesh);
        }
      }

      this.host.currentHoveredTileKey = newHoveredTileKey;
    }
  }

  /**
   * Handles mouse click events
   * Processes clicks only if no significant movement occurred
   */
  private handleMouseClick(e: MouseEvent): void {
    // Don't handle clicks if the user has moved significantly (drag vs click)
    if (this.host.hasMovedSignificantly) {
      return;
    }

    // Update pointer coordinates for raycasting
    this.host.updatePointerCoordinates(e.clientX, e.clientY);

    // Perform click logic
    this.performTileClick();
  }

  /**
   * Handles touch end events
   * Combines pointer up logic with click detection for touch devices
   */
  private handleTouchEnd(e: TouchEvent): void {
    // Call the original onPointerUp logic first
    this.onPointerUp();

    // Don't handle clicks if the user has moved significantly (drag vs click)
    if (this.host.hasMovedSignificantly) {
      return;
    }

    // For touch end, use changedTouches to get the final touch position
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      this.host.updatePointerCoordinates(touch.clientX, touch.clientY);

      // Perform click logic
      this.performTileClick();
    }
  }

  /**
   * Performs tile click detection and event dispatching
   * Uses raycasting to determine which tile was clicked
   */
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

  /**
   * Adds all event listeners to the container and window
   * Should be called once during initialization
   */
  private addEventListeners(): void {
    this.host.container.addEventListener("mousedown", this.onPointerDown);
    // Listen on window so drag tracking works even when pointer leaves the container
    window.addEventListener("mousemove", this.onPointerMove);
    window.addEventListener("mouseup", this.onPointerUp);
    this.host.container.addEventListener("mouseleave", this.onPointerOut);
    this.host.container.addEventListener("touchstart", this.onPointerDown, { passive: false });
    this.host.container.addEventListener("touchmove", this.onPointerMove, { passive: false });
    this.host.container.addEventListener("touchend", this.handleTouchEnd, { passive: true });

    // Only add click event for mouse interactions
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

  /**
   * Removes all event listeners
   * Should be called during cleanup/disposal
   */
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

  /**
   * Gets the initialization status
   */
  public get initialized(): boolean {
    return this.isInitialized;
  }
}
