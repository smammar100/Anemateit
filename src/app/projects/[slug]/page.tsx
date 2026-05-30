import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteShell from '@/components/global/SiteShell';
import Text from '@/components/fundations/elements/Text';
import Wrapper from '@/components/fundations/containers/Wrapper';
import BookDemoButtonDemo from '@/components/book-demo/BookDemoButtonDemo';
import MorphingSvgMaskSlider from '@/components/morphing/MorphingSvgMaskSlider';
import NextjsConfCTADemo from '@/components/nextjs-conf-cta/NextjsConfCTADemo';
import { getAllProjects, getProjectBySlug, getAllProjectSlugs } from '@/lib/queries';
import { urlFor, fileUrl } from '@/lib/sanity';
import {
  getPhantomLabGridProject,
  PHANTOM_LAB_GRID_SLUG,
  getTextVideoProject,
  TEXT_VIDEO_SLUG,
  getDiaSpectrumProject,
  DIA_SPECTRUM_SLUG,
  loadPromptFile,
} from '@/lib/synthetic-projects';
import type { CardData } from '@/components/phantom-lab-grid/grid-engine/types';
import ProjectClient from './ProjectClient';

const CARD_IMAGES = [
  'https://picsum.photos/seed/morph1/1200/750',
  'https://picsum.photos/seed/morph2/1200/750',
  'https://picsum.photos/seed/morph3/1200/750',
  'https://picsum.photos/seed/morph4/1200/750',
  'https://picsum.photos/seed/morph5/1200/750',
];

export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let project = await getProjectBySlug(slug);
  // Fall back to a synthetic project for slugs we host locally without a
  // Sanity record (e.g. the WebGL Phantom Lab Grid demo).
  if (!project && slug === TEXT_VIDEO_SLUG) {
    project = await getTextVideoProject();
  }
  if (!project && slug === DIA_SPECTRUM_SLUG) {
    project = await getDiaSpectrumProject();
  }
  if (!project && slug === PHANTOM_LAB_GRID_SLUG) {
    project = await getPhantomLabGridProject();
  }
  if (!project) notFound();

  // Prefer a committed prompts/{slug}.md file when present; otherwise keep the
  // copyPrompt that came from Sanity (or the synthetic getter). This makes the
  // repo prompt files the single source of truth for every project.
  const filePrompt = await loadPromptFile(slug);
  if (filePrompt !== null) {
    project = { ...project, copyPrompt: filePrompt };
  }

  const videoSrc =
    project.thumbnailType === 'video' && project.thumbnailVideo?.asset?._ref
      ? fileUrl(project.thumbnailVideo.asset._ref)
      : null;

  const gifSrc =
    project.thumbnailType === 'gif' && project.thumbnailGif?.asset?._ref
      ? urlFor(project.thumbnailGif).width(1800).fit('max').url()
      : null;

  const allProjects = await getAllProjects();
  const relatedProjects = allProjects
    .filter((p) => p._id !== project._id)
    .slice(0, 4);

  // For the Phantom Lab Grid animation, prebuild the card list so the
  // WebGL grid can render the full project gallery without re-fetching
  // from the client.
  const phantomLabCards: CardData[] | undefined =
    slug === 'phantom-lab-grid'
      ? allProjects.map((p) => {
          let imageSrc = '';
          if (p.thumbnailType === 'gif' && p.thumbnailGif?.asset?._ref) {
            imageSrc = urlFor(p.thumbnailGif).width(800).fit('max').url();
          } else {
            imageSrc = `https://picsum.photos/seed/${p.slug.current}/800/600`;
          }
          return {
            title: p.title,
            badge: p.category?.title ?? '',
            description: p.description,
            tags: p.technologies ?? [],
            date: '',
            image: imageSrc,
            imageSrc,
            slug: p.slug.current,
          };
        })
      : undefined;

  return (
    <SiteShell hideNavigation showSearch>
      <ProjectClient
        project={project}
        videoSrc={videoSrc}
        gifSrc={gifSrc}
        phantomLabCards={phantomLabCards}
      />

      {relatedProjects.length > 0 && (
        <section className="border-t border-base-100">
          <Wrapper variant="standard" className="py-16">
            <Text
              tag="h2"
              variant="displaySM"
              className="text-base-900 font-display font-thin mb-8 text-center"
            >
              More animations
            </Text>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {relatedProjects.map((p) => {
                const isMorphingSlider = p.slug.current === 'morphing-svg-mask-slider';
                const isBookDemo = p.slug.current === 'book-demo-button';
                const isNextjsConfCta = p.slug.current === 'nextjs-conf-cta';
                const rVideo =
                  p.thumbnailType === 'video' && p.thumbnailVideo?.asset?._ref
                    ? fileUrl(p.thumbnailVideo.asset._ref)
                    : null;
                const rGif =
                  p.thumbnailType === 'gif' && p.thumbnailGif?.asset?._ref
                    ? urlFor(p.thumbnailGif).width(900).fit('max').url()
                    : null;
                return (
                  <Link
                    key={p._id}
                    href={`/projects/${p.slug.current}`}
                    className="group block"
                    title={p.title}
                  >
                    <div
                      className="relative p-4 bg-base-50 rounded-lg overflow-hidden"
                      {...(isNextjsConfCta ? { 'data-cta-trigger': '' } : {})}
                    >
                      {isMorphingSlider ? (
                        <div
                          className="w-full rounded shadow bg-white overflow-hidden flex items-center justify-center p-4"
                          style={{ aspectRatio: '8 / 5' }}
                        >
                          <div className="w-full">
                            <MorphingSvgMaskSlider
                              images={CARD_IMAGES}
                              autoPlay
                              interval={3000}
                              showArrows={false}
                            />
                          </div>
                        </div>
                      ) : isBookDemo ? (
                        <div
                          className="w-full rounded shadow bg-white overflow-hidden"
                          style={{ aspectRatio: '8 / 5' }}
                        >
                          <BookDemoButtonDemo compact />
                        </div>
                      ) : isNextjsConfCta ? (
                        <div
                          className="w-full rounded shadow bg-white overflow-hidden"
                          style={{ aspectRatio: '8 / 5' }}
                        >
                          <NextjsConfCTADemo compact />
                        </div>
                      ) : rVideo ? (
                        <video
                          src={rVideo}
                          className="w-full rounded shadow bg-white"
                          style={{ aspectRatio: '8 / 5', objectFit: 'cover' }}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : rGif ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rGif}
                          alt={p.title}
                          className="w-full rounded shadow bg-white"
                          style={{ aspectRatio: '8 / 5', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="w-full rounded shadow bg-white"
                          style={{ aspectRatio: '8 / 5' }}
                        />
                      )}
                    </div>
                    <Text
                      tag="h3"
                      variant="textSM"
                      className="text-base-600 capitalize mt-2"
                    >
                      {p.title}
                    </Text>
                  </Link>
                );
              })}
            </div>
          </Wrapper>
        </section>
      )}
    </SiteShell>
  );
}
