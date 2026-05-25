'use client';

import { useEffect, useRef } from 'react';

const COLS = 32;
const ROWS = 8;
const TOTAL = COLS * ROWS;
const BTN_WIDTH = 480;
const BTN_HEIGHT = 120;

const SHOW_WINDOW_MS = 160;
const VISIBLE_MIN_MS = 70;
const VISIBLE_MAX_MS = 150;
const DIRECTION_BIAS_MS = 340;

function ArrowRightCircle() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ marginTop: -3 }}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 16 16 12 12 8" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

export default function NextjsConfCTA() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const btn = btnRef.current;
    const bg = bgRef.current;
    if (!btn || !bg) return;

    const pixels = Array.from(bg.querySelectorAll<HTMLSpanElement>('span'));
    let timeouts: ReturnType<typeof setTimeout>[] = [];
    let isActive = false;
    const centerX = (COLS - 1) / 2;

    const animatePixels = (activate: boolean) => {
      isActive = activate;
      timeouts.forEach(clearTimeout);
      timeouts = [];

      pixels.forEach((p) => {
        p.style.display = 'none';
      });

      pixels.forEach((p, idx) => {
        const col = idx % COLS;
        const distFromCenter = Math.abs(col - centerX) / centerX;
        const bias = activate ? distFromCenter : 1 - distFromCenter;

        const showAt = bias * DIRECTION_BIAS_MS + Math.random() * SHOW_WINDOW_MS;
        const visibleFor =
          VISIBLE_MIN_MS + Math.random() * (VISIBLE_MAX_MS - VISIBLE_MIN_MS);

        timeouts.push(
          setTimeout(() => {
            p.style.display = 'block';
          }, showAt)
        );
        timeouts.push(
          setTimeout(() => {
            p.style.display = 'none';
          }, showAt + visibleFor)
        );
      });
    };

    const onEnter = () => {
      if (!isActive) animatePixels(true);
    };
    const onLeave = () => {
      if (isActive) animatePixels(false);
    };

    const trigger =
      (btn.closest('[data-cta-trigger]') as HTMLElement | null) ?? btn;
    trigger.addEventListener('mouseenter', onEnter);
    trigger.addEventListener('mouseleave', onLeave);

    return () => {
      timeouts.forEach(clearTimeout);
      trigger.removeEventListener('mouseenter', onEnter);
      trigger.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <button
      ref={btnRef}
      type="button"
      className="relative overflow-hidden cursor-pointer"
      style={{
        width: BTN_WIDTH,
        height: BTN_HEIGHT,
        background: '#1a62ff',
        border: 'none',
        outline: 'none',
        padding: 0,
        fontFamily: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      }}
    >
      <div
        ref={bgRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      >
        {Array.from({ length: TOTAL }).map((_, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const pxW = 100 / COLS;
          const pxH = 100 / ROWS;
          return (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: `${col * pxW}%`,
                top: `${row * pxH}%`,
                width: `${pxW}%`,
                height: `${pxH}%`,
                backgroundColor: '#ffffff',
                display: 'none',
              }}
            />
          );
        })}
      </div>

      <div
        className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center pointer-events-none"
        style={{ zIndex: 2, color: '#ffffff' }}
      >
        <div
          className="flex items-center"
          style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: '3px',
            gap: 12,
            marginBottom: 6,
          }}
        >
          GET TICKETS
          <ArrowRightCircle />
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 400,
            letterSpacing: '2.25px',
            color: 'rgba(255, 255, 255, 0.9)',
          }}
        >
          IN PERSON &amp; VIRTUAL
        </div>
      </div>
    </button>
  );
}
