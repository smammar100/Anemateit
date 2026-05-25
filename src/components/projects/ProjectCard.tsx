import Link from 'next/link';
import Text from '@/components/fundations/elements/Text';
import { urlFor, fileUrl } from '@/lib/sanity';
import type { Project } from '@/lib/types';

export default function ProjectCard({ project }: { project: Project }) {
  const url = `/projects/${project.slug.current}`;

  const videoSrc =
    project.thumbnailType === 'video' && project.thumbnailVideo?.asset?._ref
      ? fileUrl(project.thumbnailVideo.asset._ref)
      : null;

  const gifSrc =
    project.thumbnailType === 'gif' && project.thumbnailGif?.asset?._ref
      ? urlFor(project.thumbnailGif).width(1200).fit('max').url()
      : null;

  return (
    <div className="group-hover:opacity-30 hover:opacity-100 peer hover:peer-hover:opacity-30 duration-300 group">
      <div className="relative p-8 bg-base-50 rounded-lg overflow-hidden">
        {videoSrc && (
          <video
            src={videoSrc}
            className="object-cover aspect-[8/5] w-full object-top rounded shadow bg-base-100"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            disablePictureInPicture
          />
        )}
        {gifSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gifSrc}
            alt={project.title}
            className="object-cover aspect-[8/5] w-full object-top rounded shadow bg-base-100"
            loading="lazy"
          />
        )}
        {!videoSrc && !gifSrc && (
          <div className="aspect-[8/5] w-full rounded shadow bg-base-100 flex items-center justify-center">
            <Text tag="span" variant="textXS" className="text-base-400">
              No preview
            </Text>
          </div>
        )}
        <Link href={url} title={project.title}>
          <span className="absolute inset-0"></span>
        </Link>
      </div>
      <div className="flex items-center mt-2 gap-2">
        <Text tag="h3" variant="textSM" className="text-base-600 capitalize">
          {project.title}
        </Text>
      </div>
    </div>
  );
}
