import Button from '@/components/fundations/elements/Button';
import Wrapper from '@/components/fundations/containers/Wrapper';
import ProjectCard from '@/components/projects/ProjectCard';
import { getAllProjects, getAllCategories } from '@/lib/queries';
import {
  getPhantomLabGridProject,
  getTextVideoProject,
  getDiaSpectrumProject,
  getAISphereProject,
} from '@/lib/synthetic-projects';
import type { Project } from '@/lib/types';
import SitesPreviewClient from './SitesPreviewClient';

export default async function SitesPreview() {
  const [
    sanityProjects,
    categories,
    aiSphere,
    diaSpectrum,
    textVideo,
    phantomLabGrid,
  ] = await Promise.all([
    getAllProjects(),
    getAllCategories(),
    getAISphereProject(),
    getDiaSpectrumProject(),
    getTextVideoProject(),
    getPhantomLabGridProject(),
  ]);
  const projects: Project[] = [
    aiSphere,
    diaSpectrum,
    textVideo,
    phantomLabGrid,
    ...sanityProjects,
  ];
  // Keep this a multiple of the widest grid (lg:grid-cols-4) so the initial
  // rows fill completely — otherwise the last row leaves an empty cell.
  const initialVisible = 8;

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
