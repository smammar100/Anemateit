import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Project } from './types';

/**
 * Synthetic project entries — surfaced in the homepage list and accepted
 * by `/projects/[slug]` without requiring a Sanity record. Remove a
 * synthetic entry once a real Sanity project with the same slug is
 * published.
 */

export const TEXT_VIDEO_SLUG = 'text-video';
export const DIA_SPECTRUM_SLUG = 'dia-browser-footer-color-spectrum';
export const AI_SPHERE_SLUG = 'ai-sphere';
export const PHANTOM_LAB_GRID_SLUG = 'phantom-lab-grid';

const promptFileCache = new Map<string, string | null>();
const SLUG_RE = /^[a-z0-9-]+$/;

/**
 * Reads `prompts/{slug}.md` and returns its verbatim contents, or `null`
 * when no such file exists. This makes the committed prompt files the
 * single source of truth for a project's copy prompt — `/projects/[slug]`
 * prefers the file and falls back to the Sanity `copyPrompt` only when no
 * file is present. The slug is validated against the kebab-case pattern to
 * prevent path traversal; results (including the `null` "absent" result)
 * are cached in-process.
 */
export async function loadPromptFile(slug: string): Promise<string | null> {
  if (!SLUG_RE.test(slug)) return null;
  if (promptFileCache.has(slug)) return promptFileCache.get(slug)!;

  const promptPath = path.join(process.cwd(), 'prompts', `${slug}.md`);
  let contents: string | null;
  try {
    contents = await fs.readFile(promptPath, 'utf8');
  } catch (err) {
    // Missing file → fall back to Sanity. Re-throw anything that is not
    // ENOENT so genuine IO/permission faults are not silently swallowed.
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
      contents = null;
    } else {
      throw err;
    }
  }
  promptFileCache.set(slug, contents);
  return contents;
}

export async function getTextVideoProject(): Promise<Project> {
  const copyPrompt = (await loadPromptFile(TEXT_VIDEO_SLUG)) ?? '';
  return {
    _id: 'synthetic-text-video',
    _type: 'project',
    title: 'Text Video',
    slug: { _type: 'slug', current: TEXT_VIDEO_SLUG },
    description:
      'CSS background-clip text effect — a GIF clipped to the letterforms of your heading. Achieves in pure CSS what used to require canvas compositing.',
    thumbnailType: 'gif',
    technologies: ['React', 'CSS', 'Tailwind CSS'],
    copyPrompt,
  };
}

export async function getDiaSpectrumProject(): Promise<Project> {
  const copyPrompt = (await loadPromptFile(DIA_SPECTRUM_SLUG)) ?? '';
  return {
    _id: 'synthetic-dia-browser-footer-color-spectrum',
    _type: 'project',
    title: 'Dia Browser Footer Color Spectrum',
    slug: { _type: 'slug', current: DIA_SPECTRUM_SLUG },
    description:
      'A scroll-revealed color-spectrum footer inspired by Dia Browser — nine blurred gradient bars forming a light spectrum, with live theme switching, blur toggle, and randomize. Built on GSAP.',
    thumbnailType: 'gif',
    technologies: ['React', 'TypeScript', 'GSAP', 'SVG', 'Tailwind CSS'],
    copyPrompt,
  };
}

export async function getAISphereProject(): Promise<Project> {
  const copyPrompt = (await loadPromptFile(AI_SPHERE_SLUG)) ?? '';
  return {
    _id: 'synthetic-ai-sphere',
    _type: 'project',
    title: 'AI Sphere',
    slug: { _type: 'slug', current: AI_SPHERE_SLUG },
    description:
      'A true-3D plasma sphere — a glass fresnel shell wrapping volumetric FBM gas that you can spin in real 3D, with a glowing flower-bloom anchored at its centre. Shifts color across 5 states. Built on Three.js.',
    thumbnailType: 'gif',
    technologies: ['React', 'TypeScript', 'Three.js', 'WebGL', 'GLSL'],
    copyPrompt,
  };
}

export async function getPhantomLabGridProject(): Promise<Project> {
  const copyPrompt = (await loadPromptFile(PHANTOM_LAB_GRID_SLUG)) ?? '';
  return {
    _id: 'synthetic-phantom-lab-grid',
    _type: 'project',
    title: 'Phantom Lab Grid',
    slug: { _type: 'slug', current: PHANTOM_LAB_GRID_SLUG },
    description:
      'Infinite WebGL grid of card tiles with momentum drag, distortion + vignette post-processing, and per-tile click events. Built on ogl + gsap.',
    thumbnailType: 'gif',
    technologies: ['React', 'TypeScript', 'WebGL', 'ogl', 'GSAP'],
    copyPrompt,
  };
}
