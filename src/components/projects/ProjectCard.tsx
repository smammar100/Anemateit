import Link from 'next/link';
import Text from '@/components/fundations/elements/Text';
import { urlFor, fileUrl } from '@/lib/sanity';
import MorphingSvgMaskSlider from '@/components/morphing/MorphingSvgMaskSlider';
import BookDemoButtonDemo from '@/components/book-demo/BookDemoButtonDemo';
import NextjsConfCTADemo from '@/components/nextjs-conf-cta/NextjsConfCTADemo';
import PhantomLabGridThumbnail from '@/components/phantom-lab-grid/PhantomLabGridThumbnail';
import type { Project } from '@/lib/types';

const CARD_IMAGES = [
  'https://picsum.photos/seed/morph1/1200/750',
  'https://picsum.photos/seed/morph2/1200/750',
  'https://picsum.photos/seed/morph3/1200/750',
  'https://picsum.photos/seed/morph4/1200/750',
  'https://picsum.photos/seed/morph5/1200/750',
];

export default function ProjectCard({ project }: { project: Project }) {
  const isMorphingSlider = project.slug.current === 'morphing-svg-mask-slider';
  const isBookDemo = project.slug.current === 'book-demo-button';
  const isNextjsConfCta = project.slug.current === 'nextjs-conf-cta';
  const isPhantomLabGrid = project.slug.current === 'phantom-lab-grid';
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
      <div
        className="relative p-4 bg-base-50 rounded-lg overflow-hidden"
        {...(isNextjsConfCta ? { 'data-cta-trigger': '' } : {})}
      >
        {isPhantomLabGrid ? (
          <PhantomLabGridThumbnail />
        ) : isMorphingSlider ? (
          <div className="aspect-[8/5] w-full rounded shadow bg-white overflow-hidden flex items-center justify-center p-4">
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
          <div className="aspect-[8/5] w-full rounded shadow bg-white overflow-hidden">
            <BookDemoButtonDemo compact />
          </div>
        ) : isNextjsConfCta ? (
          <div className="aspect-[8/5] w-full rounded shadow bg-white overflow-hidden">
            <NextjsConfCTADemo compact />
          </div>
        ) : videoSrc ? (
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
        ) : gifSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gifSrc}
            alt={project.title}
            className="object-cover aspect-[8/5] w-full object-top rounded shadow bg-base-100"
            loading="lazy"
          />
        ) : (
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
