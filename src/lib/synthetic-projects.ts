import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Project } from './types';

/**
 * Synthetic project entries — surfaced in the homepage list and accepted
 * by `/projects/[slug]` without requiring a Sanity record. Remove a
 * synthetic entry once a real Sanity project with the same slug is
 * published.
 */

export const PHANTOM_LAB_GRID_SLUG = 'phantom-lab-grid';

let cachedPhantomPrompt: string | null = null;

async function readPhantomLabGridPrompt(): Promise<string> {
  if (cachedPhantomPrompt !== null) return cachedPhantomPrompt;
  const promptPath = path.join(process.cwd(), 'prompts', 'phantom-lab-grid.md');
  try {
    cachedPhantomPrompt = await fs.readFile(promptPath, 'utf8');
  } catch {
    cachedPhantomPrompt = '';
  }
  return cachedPhantomPrompt;
}

export async function getPhantomLabGridProject(): Promise<Project> {
  const copyPrompt = await readPhantomLabGridPrompt();
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
