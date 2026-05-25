'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const DURATION = 1;
const BLUR = 5;

type Props = {
  children: ReactNode;
};

export default function PageTransition({ children }: Props) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, filter: `blur(${BLUR}px)` }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, filter: `blur(${BLUR}px)` }}
        transition={{ duration: DURATION, ease: EASE }}
        className="flex grow flex-col bg-white"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
