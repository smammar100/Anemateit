import type { SVGProps } from 'react';

export default function Logo({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      viewBox="0 0 360 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Animate"
      {...rest}
    >
      <text
        x="0"
        y="68"
        fontSize="84"
        fontFamily="'Hedvig Letters Serif', serif"
        fontWeight="400"
        letterSpacing="-2"
        fill="currentColor"
      >
        Animate
      </text>
    </svg>
  );
}
