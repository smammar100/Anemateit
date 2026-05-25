'use client';
import { useEffect, useRef } from 'react';

type PerspectiveProps = React.HTMLAttributes<HTMLDivElement> & {
  maxRotateX?: number;
  maxRotateY?: number;
  smoothing?: number;
};

export function Perspective({
  maxRotateX = 14,
  maxRotateY = 30,
  smoothing = 0.12,
  className = '',
  children,
  ...props
}: PerspectiveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let targetX = 0,
      targetY = 0,
      rotX = 0,
      rotY = 0,
      raf = 0;

    const onMove = (e: MouseEvent) => {
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const dist = Math.hypot(dx, dy);
      const falloff = dist <= 1 ? 1 : Math.max(0, 1 - (dist - 1) / 2);
      targetX = clamp(dy, -1, 1) * maxRotateX * falloff;
      targetY = -clamp(dx, -1, 1) * maxRotateY * falloff;
    };
    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const tick = () => {
      rotX += (targetX - rotX) * smoothing;
      rotY += (targetY - rotY) * smoothing;
      const lift = Math.min(
        1,
        Math.hypot(rotX / maxRotateX, rotY / maxRotateY),
      );
      container.style.setProperty('--rx', `${rotX.toFixed(2)}deg`);
      container.style.setProperty('--ry', `${rotY.toFixed(2)}deg`);
      container.style.setProperty('--lift', lift.toFixed(3));
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    tick();
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [maxRotateX, maxRotateY, smoothing]);

  return (
    <div ref={containerRef} className={`[perspective:1200px] ${className}`} {...props}>
      <div className="[transform-style:preserve-3d]">
        <div
          ref={cardRef}
          className="max-w-[480px] p-10 will-change-transform"
          style={{ transform: 'rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

type HighlightColor = 'red' | 'purple' | 'green';

export function Highlight({
  color = 'green',
  className = '',
  style,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { color?: HighlightColor }) {
  const palette = {
    red: { bg: '#e89c9c', ring: '220, 130, 130' },
    purple: { bg: '#b8a0db', ring: '160, 120, 220' },
    green: { bg: '#9fd68d', ring: '120, 200, 100' },
  }[color];

  return (
    <span
      className={`inline-block rounded-[3px] px-1 text-white ${className}`}
      style={{
        background: palette.bg,
        transform:
          'translate(calc(-8px * var(--lift,0)), calc(-6px * var(--lift,0)))',
        boxShadow:
          `rgba(${palette.ring}, calc(0.8 * var(--lift,0))) 2px 1.5px 0px 0.75px, ` +
          `rgba(${palette.ring}, calc(0.3 * var(--lift,0))) 8px 4px 4px 0px`,
        willChange: 'transform, box-shadow',
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Self-contained demo wrapper used on the project detail / homepage card. */
export default function PerspectiveHighlightDemo() {
  return (
    <div className="grid w-full place-items-center bg-zinc-50 p-6 min-h-[420px]">
      <Perspective>
        <article className="text-[15px] leading-[1.75] text-zinc-600">
          <p className="mb-[1.1em]">
            <Highlight color="red">Three nested wrappers</Highlight>, each with one job.
            Strip any of them out and the whole illusion collapses back into a flat rectangle
            on a page.
          </p>
          <p className="mb-[1.1em]">
            <Highlight color="purple">
              The whole effect rides on CSS&apos;s perspective property.
            </Highlight>{' '}
            The outer wrapper defines the 3D space, the middle one preserves it, and only the
            inner card actually rotates.
          </p>
          <p>
            <Highlight color="green">The card tilts toward wherever your cursor goes.</Highlight>{' '}
            Move closer and it leans in; pull away and it settles flat.
          </p>
        </article>
      </Perspective>
    </div>
  );
}
