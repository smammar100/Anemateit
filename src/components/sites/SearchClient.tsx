'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import Link from 'next/link';
import { Close, Command } from '@/components/fundations/icons/Icons';

type SearchableAnimation = {
  title: string;
  description: string;
  slug: string;
  thumbnailUrl: string | null;
  thumbnailType: 'video' | 'gif' | null;
};

type Props = {
  items: SearchableAnimation[];
};

export default function SearchClient({ items }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ['title', 'description'],
        threshold: 0.3,
        includeMatches: true,
      }),
    [items],
  );

  const results = query.trim() ? fuse.search(query) : [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      if (modKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
  }, [open]);

  return (
    <>
      <div className="fixed bottom-6 left-1/2 w-fit max-w-xl justify-center -translate-x-1/2 z-50 flex bg-base-100 max-w-xs p-2 rounded-xl">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mx-auto flex gap-2 items-center w-full px-4 py-2 text-xs text-left leading-tight align-middle bg-white border border-transparent transition duration-300 ease-in-out focus:z-10 h-9 rounded-md text-base-500 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none shadow-sm"
          aria-label="Search animations"
        >
          <span className="sr-only">Search</span>
          Search animations
          <span className="flex gap-0.5 items-center ml-auto">
            <Command className="size-4" />K
          </span>
        </button>
      </div>
      {open && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="min-h-screen px-4 text-center">
            <div
              className="fixed inset-0 bg-base-950/50 backdrop-blur transition-opacity"
              onClick={() => setOpen(false)}
            />
            <div className="inline-block w-full max-w-2xl p-8 mb-8 mt-12 lg:mt-48 bg-base-50 rounded-lg text-left align-middle transition-all transform relative">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-2 right-2 text-base-400 hover:text-base-500 cursor-pointer"
                aria-label="Close search"
              >
                <Close className="size-4" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search animations..."
                className="block w-full px-4 py-2 text-xs leading-tight align-middle bg-white border border-transparent transition duration-300 ease-in-out focus:z-10 h-9 rounded-md text-base-500 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none shadow-sm"
              />
              {query.trim() && (
                <div className="max-h-100 rounded-lg mt-2 overflow-y-auto bg-base-50 overflow-hidden w-full space-y-2 scrollbar-hide">
                  {results.length === 0 ? (
                    <div className="p-8">
                      <h3 className="font-medium text-base text-base-500">
                        No animations match &ldquo;{query}&rdquo;.
                      </h3>
                    </div>
                  ) : (
                    results.map((result) => (
                      <Link
                        key={result.item.slug}
                        href={`/projects/${result.item.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-4 bg-white rounded-lg p-4 hover:bg-base-100 duration-300 group text-left"
                      >
                        <div className="shrink-0 w-28 aspect-[8/5] rounded overflow-hidden bg-base-100">
                          {result.item.thumbnailUrl && result.item.thumbnailType === 'video' ? (
                            <video
                              src={result.item.thumbnailUrl}
                              className="w-full h-full object-cover object-top"
                              autoPlay
                              loop
                              muted
                              playsInline
                              preload="metadata"
                              disablePictureInPicture
                            />
                          ) : result.item.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={result.item.thumbnailUrl}
                              alt=""
                              className="w-full h-full object-cover object-top"
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-base uppercase text-base-900 group-hover:text-accent-600">
                            {result.item.title}
                          </h3>
                          <p className="text-base-600 text-sm line-clamp-2">
                            {result.item.description}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
