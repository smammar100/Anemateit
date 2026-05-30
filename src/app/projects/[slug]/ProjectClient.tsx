'use client';
import Link from 'next/link';
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
import NextjsConfCTADemo from '@/components/nextjs-conf-cta/NextjsConfCTADemo';
import PhantomLabGridClient from '@/components/phantom-lab-grid/PhantomLabGridClient';
import TextVideoDemo from '@/components/text-video/TextVideoDemo';
import DiaSpectrumFooterDemo from '@/components/dia-spectrum/DiaSpectrumFooterDemo';
import type { CardData } from '@/components/phantom-lab-grid/grid-engine/types';
import type { Project } from '@/lib/types';

type Props = {
  project: Project;
  videoSrc: string | null;
  gifSrc: string | null;
  phantomLabCards?: CardData[];
};

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export default function ProjectClient({
  project,
  videoSrc,
  gifSrc,
  phantomLabCards,
}: Props) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [showFade, setShowFade] = useState(true);
  const preRef = useRef<HTMLPreElement>(null);

  const liveDemos: Record<string, () => ReactNode> = {
    'text-video': () => (
      <div className="w-full h-full flex items-center justify-center">
        <TextVideoDemo />
      </div>
    ),
    'dia-browser-footer-color-spectrum': () => (
      <div className="relative w-full h-full min-h-[26rem]">
        <DiaSpectrumFooterDemo />
      </div>
    ),
    'morphing-svg-mask-slider': () => (
      <div className="w-full max-w-4xl mx-auto">
        <MorphingSvgMaskSlider
          images={[
            'https://picsum.photos/seed/morph1/1200/750',
            'https://picsum.photos/seed/morph2/1200/750',
            'https://picsum.photos/seed/morph3/1200/750',
            'https://picsum.photos/seed/morph4/1200/750',
            'https://picsum.photos/seed/morph5/1200/750',
          ]}
        />
      </div>
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
    'nextjs-conf-cta': () => <NextjsConfCTADemo />,
    'phantom-lab-grid': () =>
      phantomLabCards && phantomLabCards.length > 0 ? (
        <div className="relative w-full h-full min-h-[24rem]">
          <PhantomLabGridClient cards={phantomLabCards} />
        </div>
      ) : null,
  };
  const hasLiveDemo = Boolean(liveDemos[project.slug.current]);

  const demoCaptions: Record<string, string> = {
    'dia-browser-footer-color-spectrum': 'Scroll to see the magic.',
  };
  const demoCaption =
    demoCaptions[project.slug.current] ?? 'Live demo — interact with it.';

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

  const downloadCode = async () => {
    if (!project.codeFiles?.length) return;
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    for (const f of project.codeFiles) zip.file(f.filename, f.content);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.slug.current}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      <header className="fixed w-full top-0 z-20 bg-white border-b border-base-100 py-3">
        <Wrapper variant="standard">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-base-500 hover:text-base-900 transition-colors"
            >
              <span aria-hidden="true">←</span>
              <span>Components</span>
              <span className="text-base-300">/</span>
              <span className="text-base-900 font-medium capitalize">{project.title}</span>
            </Link>

            <div className="flex items-center gap-2">
              {project.viewCodeUrl && (
                <a
                  href={project.viewCodeUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs text-base-700 hover:text-base-900 hover:bg-base-100 transition-colors"
                >
                  <CodeIcon className="size-3" />
                  View code
                </a>
              )}
              <Button
                type="button"
                size="xs"
                variant="default"
                onClick={copyPrompt}
                leftIcon={<CopyIcon className="size-3" />}
              >
                {copyState === 'copied' ? 'Copied ✓' : 'Copy Prompt'}
              </Button>
              {project.codeFiles && project.codeFiles.length > 0 && (
                <Button
                  type="button"
                  size="xs"
                  variant="muted"
                  onClick={downloadCode}
                  leftIcon={<DownloadIcon className="size-3" />}
                >
                  Download Code
                </Button>
              )}
            </div>
          </div>
        </Wrapper>
      </header>

      <section className="pt-20">
        <Wrapper variant="standard" className="pb-16">
          <div className="flex w-full flex-col lg:flex-row lg:gap-8">
            <div className="order-1 lg:order-2 lg:flex-1 lg:sticky lg:top-20 lg:self-start lg:h-[calc(100dvh-11rem)]">
              <div className="rounded-xl overflow-hidden bg-base-50 border border-base-100 w-full h-full flex flex-col">
                {hasLiveDemo ? (
                  <div className="bg-white flex flex-col flex-1 min-h-0">
                    <div className="flex-1 flex items-center justify-center min-h-[24rem] p-6 overflow-auto">
                      {liveDemos[project.slug.current]()}
                    </div>
                    <div className="border-t border-base-100 py-3 px-4 shrink-0">
                      <Text tag="p" variant="textXS" className="text-base-500 text-center">
                        {demoCaption}
                      </Text>
                    </div>
                  </div>
                ) : null}
                {!hasLiveDemo && videoSrc && (
                  <div className="flex-1 flex items-center justify-center bg-base-100 min-h-0">
                    <video
                      src={videoSrc}
                      className="w-full h-full max-h-full object-contain"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      disablePictureInPicture
                    />
                  </div>
                )}
                {!hasLiveDemo && gifSrc && (
                  <div className="flex-1 flex items-center justify-center bg-base-100 min-h-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gifSrc}
                      alt={project.title}
                      className="w-full h-full max-h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                )}
                {!hasLiveDemo && !videoSrc && !gifSrc && (
                  <div className="flex-1 w-full bg-base-100 flex items-center justify-center min-h-[24rem]">
                    <Text tag="span" variant="textSM" className="text-base-400">
                      No preview available
                    </Text>
                  </div>
                )}
              </div>
            </div>

            <div className="order-2 lg:order-1 lg:w-[30%] lg:shrink-0 flex flex-col gap-6 pt-8 lg:pt-0 lg:h-[calc(100dvh-11rem)]">
              <div>
                <Text
                  tag="h1"
                  variant="displaySM"
                  className="text-base-900 font-display font-light text-balance leading-tight"
                >
                  {project.title}
                </Text>
                <Text
                  tag="p"
                  variant="textBase"
                  className="text-base-500 mt-2 text-balance"
                >
                  {project.description}
                </Text>
              </div>

              {project.technologies && project.technologies.length > 0 && (
                <div>
                  <Text
                    tag="h3"
                    variant="textSM"
                    className="text-base-900 font-semibold mb-2"
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

              <div className="flex flex-col min-h-0 lg:flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <Text
                    tag="h3"
                    variant="textSM"
                    className="text-base-900 font-semibold"
                  >
                    How to use
                  </Text>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={copyPrompt}
                      className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs text-base-700 bg-base-100 hover:bg-base-200 transition-colors font-medium"
                    >
                      <CopyIcon className="size-3" />
                      {copyState === 'copied' ? 'Copied' : 'Copy prompt'}
                    </button>
                    {project.viewCodeUrl && (
                      <a
                        href={project.viewCodeUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs text-base-700 bg-base-100 hover:bg-base-200 transition-colors font-medium"
                      >
                        <CodeIcon className="size-3" />
                        View code
                        <ArrowUpRight className="size-2.5" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="relative bg-base-50 rounded-lg border border-base-100 overflow-hidden lg:flex-1 lg:min-h-0">
                  <pre
                    ref={preRef}
                    className="font-mono text-xs text-base-700 whitespace-pre-wrap break-words max-h-72 lg:max-h-none lg:h-full overflow-y-auto scrollbar-hide p-4 leading-relaxed"
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
                <Text tag="p" variant="textXS" className="text-base-500 mt-2 shrink-0">
                  Paste into Claude Code, Cursor, v0, or Lovable.
                </Text>
              </div>
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
