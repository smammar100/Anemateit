import Button from '@/components/fundations/elements/Button';
import Wrapper from '@/components/fundations/containers/Wrapper';
import ProjectCard from '@/components/projects/ProjectCard';
import { getAllProjects, getAllCategories } from '@/lib/queries';
import type { Project } from '@/lib/types';
import SitesPreviewClient from './SitesPreviewClient';

// Synthetic Phantom Lab Grid entry — surfaced on the homepage without
// requiring a Sanity record. Remove once a real Sanity project with slug
// `phantom-lab-grid` is published.
const PHANTOM_LAB_GRID: Project = {
  _id: 'synthetic-phantom-lab-grid',
  _type: 'project',
  title: 'Phantom Lab Grid',
  slug: { _type: 'slug', current: 'phantom-lab-grid' },
  description:
    'Infinite WebGL grid of card tiles with momentum drag, distortion + vignette post-processing, and per-tile click events. Built on ogl + gsap.',
  thumbnailType: 'gif',
  technologies: ['React', 'TypeScript', 'WebGL', 'ogl', 'GSAP'],
  copyPrompt: '',
};

export default async function SitesPreview() {
  const [sanityProjects, categories] = await Promise.all([
    getAllProjects(),
    getAllCategories(),
  ]);
  const projects: Project[] = [PHANTOM_LAB_GRID, ...sanityProjects];
  const initialVisible = 7;

  return (
    <section>
      <Wrapper variant="standard" className="py-24">
        {categories.length > 0 && (
          <div className="relative flex snap-x snap-proximity gap-1 py-2 overflow-x-scroll scrollbar-hide">
            {categories.map((cat) => (
              <Button
                key={cat._id}
                isLink
                size="xs"
                variant="muted"
                title={cat.title}
                aria-label={cat.title}
                href={`/?category=${encodeURIComponent(cat.slug.current)}`}
              >
                {cat.title}
              </Button>
            ))}
          </div>
        )}
        {projects.length === 0 ? (
          <div className="py-24 text-center text-base-500">
            No projects yet. Add one in the Sanity Studio.
          </div>
        ) : (
          <SitesPreviewClient initialVisible={initialVisible} step={initialVisible}>
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </SitesPreviewClient>
        )}
      </Wrapper>
    </section>
  );
}
