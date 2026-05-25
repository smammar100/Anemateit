import type { SVGProps } from 'react';

const PATHS = [
  'M65.5229 0.259766H59.4784V125.26H65.5229V0.259766Z',
  'M125 59.7375H0V65.782H125V59.7375Z',
  'M20.4323 16.4249L16.1583 20.699L104.546 109.087L108.82 104.812L20.4323 16.4249Z',
  'M104.546 16.4237L16.1583 104.811L20.4323 109.085L108.82 20.6978L104.546 16.4237Z',
  'M5.77668 36.3997L3.49609 41.9974L119.259 89.1604L121.539 83.5622L5.77668 36.3997Z',
  'M83.3021 3.76453L36.1396 119.527L41.7374 121.807L88.8998 6.04511L83.3021 3.76453Z',
  'M119.396 36.6102L3.43384 83.2852L5.69084 88.8926L121.653 42.2176L119.396 36.6102Z',
  'M41.9322 3.69574L36.3247 5.95215L82.9871 121.914L88.5944 119.659L41.9322 3.69574Z',
];

export default function Symbol({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      viewBox="0 0 125 126"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      {PATHS.flatMap((d, i) => [
        <path key={`a-${i}`} d={d} fill="currentColor" />,
        <path key={`b-${i}`} d={d} fill="currentColor" />,
      ])}
    </svg>
  );
}
