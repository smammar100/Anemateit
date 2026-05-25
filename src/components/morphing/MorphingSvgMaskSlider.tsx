'use client';
import { useId, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { interpolate } from 'flubber';

// ── 5 organic mask shapes (normalized to viewBox 0 0 1000 625) ─────────────
// Flubber handles interpolation between any two paths — they don't need to
// share command structure or segment counts.

const SHAPES = [
  // Wavy pillow — gentle organic rectangle
  'M956.88 624.8C653.09 592.47 346.9 592.47 43.11 624.8 37.67 625.37 32.17 624.77 26.97 623.02S16.98 618.41 12.91 614.64C8.86 610.86 5.62 606.25 3.4 601.1 1.18 595.95 0.04 590.38 0.04 584.74V40.26C0.05 31.62 2.74 23.2 7.74 16.26 12.73 9.32 19.75 4.23 27.76 1.73 33.09 0.07 38.7-0.4 44.22 0.35 346.77 41.55 653.24 41.55 955.79 0.35 964.1-0.79 972.54 0.86 979.88 5.05 987.21 9.24 993.05 15.76 996.52 23.64 998.82 28.86 1000.01 34.53 1000.01 40.26V584.74C1000 593.24 997.38 601.52 992.53 608.4 987.69 615.27 980.87 620.39 973.04 623.02 967.83 624.76 962.33 625.37 956.88 624.8Z',
  // Arched rectangle
  'M48.29 53.81C345.22-17.93 654.83-17.93 951.76 53.81 980 59.79 1000 75.56 1000 102.31V589.16C1000 598.68 996.24 607.81 989.55 614.54 982.86 621.27 973.78 625.05 964.32 625.05H35.61C30.93 625.05 26.29 624.12 21.97 622.32S13.71 617.87 10.41 614.54C7.1 611.2 4.48 607.25 2.69 602.89 0.91 598.54-0.01 593.87 0 589.16V102.31C0 75.52 16.2 60.39 48.29 53.81Z',
  // Four-lobed blob
  'M992.99 156.42C959.96 35.29 804.5-29.04 645.76 12.75L644.04 13.2C549.6 38.56 449.61 38.56 355.17 13.2L353.45 12.75C194.71-29.04 39.22 35.28 6.22 156.42-8.14 209.06 2.98 263.76 33.18 312.2 2.98 360.66-8.14 415.35 6.22 467.98 39.25 589.11 194.71 653.44 353.45 611.66L355.17 611.2C449.61 585.85 549.6 585.85 644.04 611.2L645.76 611.66C804.5 653.44 959.99 589.13 992.99 467.98 1007.35 415.34 996.22 360.65 966.03 312.2 996.22 263.76 1007.35 209.06 992.99 156.42Z',
  // Dome with bumps
  'M1000 312.5C1000 139.91 776.62 0 501.09 0S2.19 139.91 2.19 312.5C2.19 352.07 13.92 389.91 35.34 424.74 11.98 474.35-0.08 528.3 0 582.88 0 594.06 4.55 604.77 12.66 612.67 20.77 620.57 31.76 625.01 43.23 625.01H956.76C968.23 625.01 979.22 620.57 987.33 612.67 995.44 604.77 999.99 594.06 999.99 582.88 1000.06 529.06 988.33 475.85 965.6 426.8 987.8 391.37 1000 352.83 1000 312.5Z',
  // Barrel / screen
  'M71.13 28.35C72.2 20.48 75.96 13.28 81.7 8.07 87.45 2.87 94.79 0 102.4 0 364.68 55.1 634.84 55.1 897.13 0 904.73 0 912.08 2.87 917.82 8.07 923.56 13.28 927.32 20.48 928.39 28.35L964.43 291.66 999.19 545.61C999.83 550.29 999.5 555.06 998.22 559.6 996.95 564.14 994.75 568.35 991.79 571.92 988.82 575.5 985.16 578.36 981.04 580.33 976.92 582.3 972.45 583.31 967.92 583.32 658.05 638.56 341.47 638.56 31.6 583.32 27.07 583.32 22.6 582.3 18.48 580.33 14.36 578.37 10.69 575.5 7.73 571.92 4.76 568.35 2.57 564.15 1.29 559.61 0.02 555.07-0.31 550.29 0.33 545.61L35.09 291.66Z',
];

type Props = {
  images: string[];
  shapes?: string[];
  duration?: number;
  autoPlay?: boolean;
  interval?: number;
  /** Hide prev/next nav arrows. Useful when embedded as a thumbnail. */
  showArrows?: boolean;
};

export default function MorphingSvgMaskSlider({
  images,
  shapes = SHAPES,
  duration = 0.65,
  autoPlay = false,
  interval = 4000,
  showArrows = true,
}: Props) {
  const clipId = useId();
  const [index, setIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const prevIndex = useRef(0);
  const pathString = useMotionValue(shapes[0]);

  const goTo = useCallback(
    (dir: 1 | -1) => {
      setIndex((prev) => {
        prevIndex.current = prev;
        const next = prev + dir;
        if (next < 0) return images.length - 1;
        if (next >= images.length) return 0;
        return next;
      });
    },
    [images.length],
  );

  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(() => goTo(1), interval);
    return () => clearInterval(id);
  }, [autoPlay, goTo, interval]);

  // Morph the clip-path via flubber whenever index changes
  useEffect(() => {
    if (prevIndex.current === index) return;
    const fromShape = shapes[prevIndex.current % shapes.length];
    const toShape = shapes[index % shapes.length];
    const interpolator = interpolate(fromShape, toShape, { maxSegmentLength: 8 });

    const controls = animate(0, 1, {
      duration,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (latest) => pathString.set(interpolator(latest)),
    });

    return () => controls.stop();
  }, [index, shapes, duration, pathString]);

  // Scale breathing — a single smooth dip-and-recover driven by framer-motion
  // for buttery-smooth synchronization with the path morph.
  const mounted = useRef(false);
  const scale = useMotionValue(1);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const controls = animate(scale, [1, 0.96, 1], {
      duration,
      ease: [0.4, 0, 0.2, 1],
      times: [0, 0.45, 1],
    });
    return () => controls.stop();
  }, [index, duration, scale]);

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <motion.div ref={wrapRef} className="w-full" style={{ scale }}>
        <svg
          viewBox="0 0 1000 625"
          className="w-full"
          role="img"
          aria-label="Image slider"
        >
          <defs>
            <clipPath id={clipId}>
              <motion.path d={pathString} />
            </clipPath>
          </defs>

          <g clipPath={`url(#${clipId})`}>
            <AnimatePresence mode="sync" initial={false}>
              <motion.image
                key={index}
                href={images[index]}
                x={0}
                y={0}
                width={1000}
                height={625}
                preserveAspectRatio="xMidYMid slice"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration * 0.65, ease: 'easeInOut' }}
              />
            </AnimatePresence>
          </g>
        </svg>
      </motion.div>

      {showArrows && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => goTo(-1)}
            className="grid place-items-center w-12 h-12 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-shadow text-gray-800"
            aria-label="Previous slide"
          >
            <Arrow direction="left" />
          </button>
          <button
            onClick={() => goTo(1)}
            className="grid place-items-center w-12 h-12 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-shadow text-gray-800"
            aria-label="Next slide"
          >
            <Arrow direction="right" />
          </button>
        </div>
      )}
    </div>
  );
}

function Arrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={direction === 'left' ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
