import { getAllProjects } from '@/lib/queries';
import { urlFor, fileUrl } from '@/lib/sanity';

/**
 * Server-side thumbnail for the Phantom Lab Grid project card on the
 * homepage. Renders up to 9 real Sanity project thumbnails in a 3x3 grid
 * to visually represent the WebGL grid without spawning a WebGL context
 * inside every homepage card.
 *
 * - Projects with `thumbnailType === 'video'` render as autoplaying
 *   muted/looped <video> tiles (same approach the rest of the site uses).
 * - Projects with `thumbnailType === 'gif'` render as <img> tiles.
 * - Slots beyond the project count stay empty (dark) so the mockup keeps
 *   its 3x3 shape even when there are fewer than 9 projects.
 */
export default async function PhantomLabGridThumbnail() {
  const projects = await getAllProjects();
  const tiles = projects.slice(0, 9);
  const slots = Array.from({ length: 9 }, (_, i) => tiles[i]);

  return (
    <div className="aspect-[8/5] w-full rounded shadow overflow-hidden bg-black grid grid-cols-3 grid-rows-3 gap-0.5 p-0.5">
      {slots.map((project, i) => {
        if (!project) {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`stock-${i}`}
              src={`https://picsum.photos/seed/phantom-grid-${i}/300/200`}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          );
        }
        if (
          project.thumbnailType === 'video' &&
          project.thumbnailVideo?.asset?._ref
        ) {
          return (
            <video
              key={project._id}
              src={fileUrl(project.thumbnailVideo.asset._ref) ?? undefined}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              disablePictureInPicture
            />
          );
        }
        if (
          project.thumbnailType === 'gif' &&
          project.thumbnailGif?.asset?._ref
        ) {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={project._id}
              src={urlFor(project.thumbnailGif).width(300).fit('max').url()}
              alt={project.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          );
        }
        // Project has no usable image thumbnail (video-only) — use a stock
        // photo seeded by slug so the tile stays populated until a still
        // exists. Easy to swap once the project has a gif/image thumbnail.
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={project._id}
            src={`https://picsum.photos/seed/${project.slug.current}/300/200`}
            alt={project.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        );
      })}
    </div>
  );
}
