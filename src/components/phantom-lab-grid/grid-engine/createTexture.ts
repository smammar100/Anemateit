/**
 * @fileoverview Card Texture Generation Utilities for OGL
 *
 * This module provides utilities for generating Canvas-based textures used
 * in the InfiniteGridClass system. Each card requires two textures:
 *
 * 1. Foreground Texture: Contains the main card content (title, image, tags, date)
 * 2. Background Texture: Contains a blurred, darkened version of the card image
 *
 * The textures are generated using HTML5 Canvas 2D API and converted to
 * OGL Textures with proper configuration.
 *
 * Key Features:
 * - Automatic text truncation with ellipsis
 * - Image loading with fallback handling
 * - Styled tag pills with rounded corners
 * - Responsive layout within fixed canvas dimensions
 * - Blur effects for background textures
 * - Proper error handling for failed image loads
 *
 * Usage:
 * ```typescript
 * import { generateForegroundTexture, generateBackgroundTexture } from './createTexture';
 *
 * const cardData = {
 *   title: "Project Title",
 *   image: "/path/to/image.jpg",
 *   tags: ["web", "ogl"],
 *   date: "2024"
 * };
 *
 * const foregroundTexture = await generateForegroundTexture(cardData, gl);
 * const backgroundTexture = await generateBackgroundTexture(cardData, gl);
 * ```
 */

// Card Texture Generation Utilities for OGL

import { Texture, type Renderer } from "ogl";
import type { CardData } from "./types";

/** Default when no URL is set — must exist under `public/` */
const FALLBACK_TEXTURE_IMAGE = "/name.webp";

function cardImageUrl(data: CardData): string {
  return data.image ?? data.imageSrc ?? FALLBACK_TEXTURE_IMAGE;
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

/** Tries project URL, then a bundled public asset if `/projects/*` is missing locally. */
async function loadCardImageForTexture(primaryUrl: string): Promise<HTMLImageElement | null> {
  try {
    return await loadImageElement(primaryUrl);
  } catch {
    if (primaryUrl !== FALLBACK_TEXTURE_IMAGE) {
      try {
        return await loadImageElement(FALLBACK_TEXTURE_IMAGE);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Canvas dimensions for all generated textures
 * These dimensions affect the resolution and memory usage of the textures
 */
const cardWidth = 512;
const cardHeight = 512;
const padding = 30;

/**
 * Creates a canvas element with 2D rendering context
 *
 * This helper function ensures consistent canvas setup across all texture
 * generation functions and provides proper error handling for context creation.
 *
 * @returns Object containing the canvas element and its 2D context
 * @throws {Error} If 2D context creation fails
 */
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

// Option 1: Pre-generate textures once, reuse them
const textureCache = new Map<string, Texture>();

/**
 * Generates the foreground texture for a card using Canvas 2D API
 *
 * This function creates the main visible content of each card including:
 * - Title text with automatic truncation and ellipsis
 * - Main image with aspect ratio preservation and centering
 * - Styled tag pills at the bottom
 * - Date text in the bottom-right corner
 * - Border outline around the entire card
 *
 * The generated texture is used for the front-facing mesh that users
 * can interact with (hover and click).
 *
 * @param data - Card data containing title, image, tags, date, etc.
 * @param renderer - OGL Renderer for texture creation
 * @returns Promise resolving to an OGL Texture
 *
 * @example
 * ```typescript
 * const cardData = {
 *   title: "Amazing Project",
 *   image: "/images/project.jpg",
 *   tags: ["web", "ogl"],
 *   date: "2024",
 *   badge: "NEW",
 *   description: "A cool project"
 * };
 * const texture = await generateForegroundTexture(cardData, renderer);
 * ```
 */
export async function generateForegroundTexture(data: CardData, renderer: Renderer): Promise<Texture> {
  const cacheKey = `${data.slug ?? data.title}-${cardImageUrl(data)}-${data.tags?.join("-")}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const { canvas, ctx } = createCanvasContext();

  // Set default styles
  ctx.fillStyle = "white";
  ctx.strokeStyle = "rgba(60, 60, 60, 1)";
  ctx.lineWidth = 1;

  // Card background and border (transparent for foreground to show background)
  ctx.beginPath();
  ctx.rect(0, 0, cardWidth, cardHeight);
  ctx.stroke(); // Draw border
  // ctx.fill() is not needed as background is transparent

  let currentY = padding;

  // Title Text
  ctx.font = "24px Arial, sans-serif";
  ctx.fillStyle = "white";
  ctx.textBaseline = "top";

  // Measure text to determine actual width
  const titleText = data.title;
  const titleMaxWidth = cardWidth - padding * 2;

  // For `ellipsis` and `wrap: 'none'`, we need to manually truncate
  let truncatedTitle = titleText;
  let textMetrics = ctx.measureText(truncatedTitle);

  // Simple truncation if text exceeds maxWidth
  while (textMetrics.width > titleMaxWidth && truncatedTitle.length > 3) {
    truncatedTitle = truncatedTitle.substring(0, truncatedTitle.length - 4) + "...";
    textMetrics = ctx.measureText(truncatedTitle);
  }
  ctx.fillText(truncatedTitle, padding, currentY);

  const headerHeight = 24; // Assuming 24px font height is a good approximation for header height

  currentY += headerHeight + 30; // Move Y cursor down

  const topElementsMaxY = currentY;
  const bottomReservedSpace = 100;
  const availableImageHeight = cardHeight - topElementsMaxY - bottomReservedSpace;
  const availableImageWidth = cardWidth - padding * 2;

  // Image loading — fallback to FALLBACK_TEXTURE_IMAGE if /projects/* is missing
  const imageObj = await loadCardImageForTexture(cardImageUrl(data));
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
    const grad = ctx.createLinearGradient(
      0,
      topElementsMaxY,
      0,
      cardHeight - bottomReservedSpace,
    );
    grad.addColorStop(0, "#1a1a1a");
    grad.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = grad;
    ctx.fillRect(padding, topElementsMaxY, availableImageWidth, availableImageHeight);
  }

  // Tags — reserve the bottom-right for the year so pills never overlap the date
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
  ctx.textAlign = "right"; // Align text to the right
  ctx.textBaseline = "bottom"; // Align text to the bottom of its bounding box
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
 * Generates the background texture for a card using Canvas 2D API
 *
 * This function creates a blurred, darkened version of the card's image
 * that serves as the background layer visible during hover effects.
 * The background provides visual depth and context while maintaining
 * readability of the foreground content.
 *
 * Processing steps:
 * 1. Loads the same image used in the foreground
 * 2. Scales it up for better blur coverage
 * 3. Applies canvas blur filter
 * 4. Adds a semi-transparent dark overlay
 * 5. Falls back to solid color if image loading fails
 *
 * @param data - Card data containing the image URL
 * @param renderer - OGL Renderer for texture creation
 * @returns Promise resolving to an OGL Texture for background layer
 *
 * @example
 * ```typescript
 * const backgroundTexture = await generateBackgroundTexture(cardData, renderer);
 * // Use this texture for the background mesh with shader material
 * ```
 */
export async function generateBackgroundTexture(data: CardData, renderer: Renderer): Promise<Texture> {
  const { canvas, ctx } = createCanvasContext();

  // Start with transparent background - image will fill the canvas
  // Alternative: ctx.fillStyle = 'rgba(0,0,0,0.5)' for solid fallback

  const bgImgEl = await loadCardImageForTexture(cardImageUrl(data));

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

/**
 * Helper function to draw a rounded rectangle using Canvas 2D API
 *
 * Canvas doesn't have a built-in rounded rectangle method, so this
 * function uses quadratic curves to create smooth corners. This is
 * used for drawing the tag pill backgrounds.
 *
 * @param ctx - The 2D rendering context to draw on
 * @param x - X coordinate of the top-left corner
 * @param y - Y coordinate of the top-left corner
 * @param width - Width of the rectangle
 * @param height - Height of the rectangle
 * @param radius - Corner radius in pixels
 */
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

/**
 * Convenience function to generate both foreground and background textures
 *
 * This function generates both texture types in parallel for efficiency.
 * While the individual generation functions are typically used separately
 * in the main grid system, this function can be useful for testing or
 * simpler use cases.
 *
 * @param data - Card data for texture generation
 * @param renderer - OGL Renderer for texture creation
 * @returns Promise resolving to an object with both texture types
 *
 * @example
 * ```typescript
 * const { foreground, background } = await generateCardTextures(cardData, renderer);
 * // Use foreground for main mesh, background for hover effect
 * ```
 */
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
