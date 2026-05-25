'use client';
import { useEffect, useId, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useTime,
} from 'framer-motion';

type Props = {
  portraitSrc: string;
  revealSrc: string;
  firstName?: string;
  lastName?: string;
  backdrop?: string;
  blobSize?: number;
};

export default function LiquidRevealHero({
  portraitSrc,
  revealSrc,
  firstName = 'LANDO',
  lastName = 'NORRIS',
  backdrop = '04',
  blobSize = 140,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const r = wrapRef.current?.getBoundingClientRect();
      if (!r) return;
      const inside =
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom;
      setHovering(inside);
      if (inside) {
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mx, my]);

  const head = {
    x: useSpring(mx, { stiffness: 250, damping: 30 }),
    y: useSpring(my, { stiffness: 250, damping: 30 }),
  };
  const body1 = {
    x: useSpring(mx, { stiffness: 220, damping: 34 }),
    y: useSpring(my, { stiffness: 220, damping: 34 }),
  };
  const body2 = {
    x: useSpring(mx, { stiffness: 190, damping: 38 }),
    y: useSpring(my, { stiffness: 190, damping: 38 }),
  };

  const time = useTime();
  const wobble = blobSize * 0.35;
  const satX = useTransform(
    time,
    (t) => head.x.get() + Math.sin(t * 0.002) * wobble,
  );
  const satY = useTransform(
    time,
    (t) => head.y.get() + Math.cos(t * 0.002) * wobble,
  );

  const headR = useTransform(
    time,
    (t) => blobSize * 0.8 * (1 + Math.sin(t * 0.0017) * 0.06),
  );
  const body1R = useTransform(
    time,
    (t) => blobSize * 0.6 * (1 + Math.sin(t * 0.0017 + 0.5) * 0.06),
  );
  const body2R = useTransform(
    time,
    (t) => blobSize * 0.45 * (1 + Math.sin(t * 0.0017 + 1.0) * 0.06),
  );
  const satR = useTransform(
    time,
    (t) => blobSize * 0.6 * (1 + Math.sin(t * 0.0017 + 1.5) * 0.06),
  );

  const maskId = useId();
  const filterId = useId();

  return (
    <section
      ref={wrapRef}
      className="relative w-full h-full overflow-hidden bg-black text-white cursor-crosshair"
    >
      <div className="absolute inset-0 grid place-items-center pointer-events-none select-none z-0">
        <span
          aria-hidden
          className="font-black italic leading-[0.85] tracking-[-0.05em] text-transparent"
          style={{
            WebkitTextStroke: '2.5px #d2ff00',
            fontSize: 'clamp(120px, 22vw, 420px)',
            filter:
              'drop-shadow(0 0 24px rgba(210,255,0,0.4)) drop-shadow(0 0 48px rgba(210,255,0,0.2))',
          }}
        >
          {backdrop}
        </span>
      </div>

      <svg width={0} height={0} className="absolute">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
          <mask id={maskId}>
            <g filter={`url(#${filterId})`}>
              {hovering && (
                <>
                  <motion.circle cx={satX} cy={satY} r={satR} fill="white" />
                  <motion.circle cx={head.x} cy={head.y} r={headR} fill="white" />
                  <motion.circle cx={body1.x} cy={body1.y} r={body1R} fill="white" />
                  <motion.circle cx={body2.x} cy={body2.y} r={body2R} fill="white" />
                </>
              )}
            </g>
          </mask>
        </defs>
      </svg>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={portraitSrc}
        alt=""
        className="absolute inset-0 w-full h-full object-contain object-bottom select-none pointer-events-none z-10"
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={revealSrc}
        alt=""
        className="absolute inset-0 w-full h-full object-contain object-bottom select-none pointer-events-none z-10"
        style={{ mask: `url(#${maskId})`, WebkitMask: `url(#${maskId})` }}
      />

      <motion.h1
        initial={{ opacity: 0, filter: 'blur(28px)', scale: 1.06 }}
        animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute m-0 font-black uppercase tracking-[-0.03em] text-white z-20"
        style={{
          top: 'clamp(20px, 3.5vw, 56px)',
          left: 'clamp(16px, 3vw, 40px)',
          fontSize: 'clamp(32px, 5vw, 82px)',
          lineHeight: 0.92,
        }}
      >
        {firstName}
      </motion.h1>

      <motion.h2
        initial={{ opacity: 0, filter: 'blur(28px)', scale: 1.06 }}
        animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
        transition={{ duration: 1.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="absolute m-0 font-black uppercase tracking-[-0.03em] text-white z-20"
        style={{
          bottom: 'clamp(20px, 3.5vw, 56px)',
          right: 'clamp(16px, 3vw, 40px)',
          fontSize: 'clamp(32px, 5vw, 82px)',
          lineHeight: 0.92,
        }}
      >
        {lastName}
      </motion.h2>

      <motion.span
        initial={{ opacity: 0, filter: 'blur(6px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.9, delay: 0.5 }}
        className="absolute uppercase font-medium z-20 text-white/60"
        style={{
          left: 'clamp(16px, 3vw, 40px)',
          bottom: 'clamp(20px, 3vw, 40px)',
          fontSize: 11,
          letterSpacing: '0.22em',
        }}
      >
        Hover to reveal
      </motion.span>
    </section>
  );
}
