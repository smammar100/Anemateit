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
