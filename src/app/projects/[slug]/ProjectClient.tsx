'use client';
import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import Text from '@/components/fundations/elements/Text';
import Button from '@/components/fundations/elements/Button';
import Wrapper from '@/components/fundations/containers/Wrapper';
import { ArrowUpRight } from '@/components/fundations/icons/Icons';
import MorphingSvgMaskSlider from '@/components/morphing/MorphingSvgMaskSlider';
import LiquidRevealHero from '@/components/liquid-reveal/LiquidRevealHero';
import PerspectiveHighlightDemo from '@/components/perspective/PerspectiveHighlight';
import BookDemoButtonDemo from '@/components/book-demo/BookDemoButtonDemo';
import type { Project } from '@/lib/types';

// Live demo renderers keyed by slug. When a slug matches, the project
// detail page renders the actual React component from the prompt instead
// of the recorded reference video/GIF.
const LIVE_DEMOS: Record<string, () => ReactNode> = {
  'morphing-svg-mask-slider': () => (
    <MorphingSvgMaskSlider
      images={[
        'https://picsum.photos/seed/morph1/1200/750',
        'https://picsum.photos/seed/morph2/1200/750',
        'https://picsum.photos/seed/morph3/1200/750',
        'https://picsum.photos/seed/morph4/1200/750',
        'https://picsum.photos/seed/morph5/1200/750',
      ]}
    />
  ),
  'liquid-reveal-hero': () => (
    <div className="aspect-[16/9] w-full">
      <LiquidRevealHero
        portraitSrc="/images/projects/lando/portrait.webp"
        revealSrc="/images/projects/lando/helmet.webp"
        revealScale={0.75}
      />
    </div>
  ),
  '3d-perspective-highlight': () => <PerspectiveHighlightDemo />,
  'book-demo-button': () => <BookDemoButtonDemo />,
};

type Props = {
  project: Project;
  videoSrc: string | null;
  gifSrc: string | null;
};

export default function ProjectClient({ project, videoSrc, gifSrc }: Props) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [showFade, setShowFade] = useState(true);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;
    const updateFade = () => {
      const atBottom = pre.scrollTop + pre.clientHeight >= pre.scrollHeight - 4;
      const hasOverflow = pre.scrollHeight > pre.clientHeight;
      setShowFade(!atBottom && hasOverflow);
    };
    pre.addEventListener('scroll', updateFade);
    updateFade();
    return () => pre.removeEventListener('scroll', updateFade);
  }, []);

  const fallbackCopy = (text: string): boolean => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {}
    document.body.removeChild(ta);
    return ok;
  };

  const copyPrompt = async () => {
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(project.copyPrompt);
        copied = true;
      } catch {
        copied = fallbackCopy(project.copyPrompt);
      }
    } else {
      copied = fallbackCopy(project.copyPrompt);
    }
    setCopyState(copied ? 'copied' : 'error');
    setTimeout(() => setCopyState('idle'), 2800);
  };

  return (
    <>
      <section>
        <Wrapper variant="standard" className="pb-16">
          <div className="flex flex-col gap-10 items-stretch">
            <div className="flex flex-col gap-6 order-2">
              <div>
                <Text
                  tag="h1"
                  variant="displayMD"
                  className="text-base-900 font-display font-light text-balance leading-tight"
                >
                  {project.title}
                </Text>
                <Text
                  tag="p"
                  variant="textBase"
                  className="text-base-600 mt-4 text-balance"
                >
                  {project.description}
                </Text>
              </div>

              {project.technologies && project.technologies.length > 0 && (
                <div>
                  <Text
                    tag="h3"
                    variant="textXS"
                    className="text-base-500 uppercase tracking-wide font-medium mb-2"
                  >
                    Technologies
                  </Text>
                  <div className="flex flex-wrap gap-1.5">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-base-100 text-base-700 capitalize"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-baseline justify-between gap-4 mb-2">
                  <Text
                    tag="h3"
                    variant="textXS"
                    className="text-base-500 uppercase tracking-wide font-medium"
                  >
                    The Prompt
                  </Text>
                  <button
                    type="button"
                    onClick={copyPrompt}
                    className="text-xs text-base-500 hover:text-base-900 transition-colors inline-flex items-center gap-1 font-medium"
                    aria-label="Copy prompt"
                  >
                    {copyState === 'copied' ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
                <div className="relative bg-base-50 rounded-lg border border-base-100 overflow-hidden">
                  <pre
                    ref={preRef}
                    className="font-mono text-xs text-base-700 whitespace-pre-wrap break-words max-h-80 overflow-y-auto scrollbar-hide p-4 leading-relaxed"
                  >
                    {project.copyPrompt}
                  </pre>
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-16 transition-opacity duration-200"
                    style={{
                      background:
                        'linear-gradient(to top, var(--color-base-50) 0%, transparent 100%)',
                      opacity: showFade ? 1 : 0,
                    }}
                  />
                </div>
                <Text tag="p" variant="textXS" className="text-base-500 mt-2">
                  Paste into Claude Code, Cursor, v0, or Lovable.
                </Text>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  size="base"
                  variant="accent"
                  onClick={copyPrompt}
                  className="w-full justify-center"
                >
                  {copyState === 'copied' ? 'Copied ✓' : 'Copy Prompt'}
                </Button>
                {project.viewCodeUrl && (
                  <Button
                    isLink
                    size="base"
                    variant="muted"
                    href={project.viewCodeUrl}
                    title="View Code"
                    className="w-full justify-center"
                    rightIcon={<ArrowUpRight className="size-3" />}
                  >
                    View Code
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-xl overflow-hidden bg-base-50 shadow-sm order-1 w-full">
              {LIVE_DEMOS[project.slug.current] ? (
                <div className="bg-white">
                  {LIVE_DEMOS[project.slug.current]()}
                  <Text
                    tag="p"
                    variant="textXS"
                    className="text-base-500 py-4 text-center"
                  >
                    Live demo — interact with it.
                  </Text>
                </div>
              ) : null}
              {!LIVE_DEMOS[project.slug.current] && videoSrc && (
                <video
                  src={videoSrc}
                  className="w-full block bg-base-100"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  disablePictureInPicture
                />
              )}
              {!LIVE_DEMOS[project.slug.current] && gifSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={gifSrc}
                  alt={project.title}
                  className="w-full block bg-base-100"
                  loading="lazy"
                />
              )}
              {!LIVE_DEMOS[project.slug.current] && !videoSrc && !gifSrc && (
                <div
                  className="w-full bg-base-100 flex items-center justify-center"
                  style={{ aspectRatio: '16 / 9' }}
                >
                  <Text tag="span" variant="textSM" className="text-base-400">
                    No preview available
                  </Text>
                </div>
              )}
            </div>
          </div>
        </Wrapper>
      </section>

      {copyState !== 'idle' && (
        <div
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 ${
            copyState === 'error' ? 'bg-red-600' : 'bg-base-900'
          } text-white px-6 py-3 rounded-lg shadow-lg text-sm`}
          role="status"
          aria-live="polite"
        >
          {copyState === 'copied'
            ? 'Prompt copied — paste into Claude Code, Cursor, v0, or Lovable'
            : "Couldn't copy — please select and copy manually"}
        </div>
      )}
    </>
  );
}
