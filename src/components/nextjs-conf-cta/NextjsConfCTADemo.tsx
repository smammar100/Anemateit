'use client';

import { cn } from '@/lib/utils';
import NextjsConfCTA from './NextjsConfCTA';

const FULL_W = 480;
const FULL_H = 120;

type Props = {
  compact?: boolean;
};

export default function NextjsConfCTADemo({ compact = false }: Props) {
  const scale = compact ? 0.3 : 1;

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center overflow-hidden',
        compact ? 'py-3 px-3' : 'py-8 px-6'
      )}
    >
      <div
        style={{
          width: FULL_W * scale,
          height: FULL_H * scale,
        }}
      >
        <div
          style={{
            width: FULL_W,
            height: FULL_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <NextjsConfCTA />
        </div>
      </div>
    </div>
  );
}
