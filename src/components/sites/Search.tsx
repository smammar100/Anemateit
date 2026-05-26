import { getAllProjects } from '@/lib/queries';
import { fileUrl, urlFor } from '@/lib/sanity';
import SearchClient from './SearchClient';

export default async function Search() {
  const projects = await getAllProjects();
  const items = projects.map((project) => {
    let thumbnailUrl: string | null = null;
    let thumbnailType: 'video' | 'gif' | null = null;
    if (project.thumbnailType === 'video' && project.thumbnailVideo?.asset?._ref) {
      thumbnailUrl = fileUrl(project.thumbnailVideo.asset._ref);
      thumbnailType = 'video';
    } else if (project.thumbnailType === 'gif' && project.thumbnailGif?.asset?._ref) {
      thumbnailUrl = urlFor(project.thumbnailGif).width(400).fit('max').url();
      thumbnailType = 'gif';
    }
    return {
      title: project.title,
      description: project.description,
      slug: project.slug.current,
      thumbnailUrl,
      thumbnailType,
    };
  });
  return <SearchClient items={items} />;
}
