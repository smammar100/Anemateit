import Button from '@/components/fundations/elements/Button';
import Wrapper from '@/components/fundations/containers/Wrapper';
import ProjectCard from '@/components/projects/ProjectCard';
import { getAllProjects } from '@/lib/queries';
import SitesPreviewClient from './SitesPreviewClient';

export default async function SitesPreview() {
  const projects = await getAllProjects();
  const allTechs = [...new Set(projects.flatMap((p) => p.technologies || []))];
  const sortedTechs = allTechs.sort((a, b) => a.localeCompare(b));
  const initialVisible = 7;

  return (
    <section>
      <Wrapper variant="standard" className="py-24">
        {sortedTechs.length > 0 && (
          <div className="relative flex snap-x snap-proximity gap-1 py-2 overflow-x-scroll scrollbar-hide">
            {sortedTechs.map((tech) => (
              <Button
                key={tech}
                isLink
                size="xs"
                variant="muted"
                title={tech}
                aria-label={tech}
                href={`/?tech=${encodeURIComponent(tech)}`}
                className="capitalize"
              >
                {tech}
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
