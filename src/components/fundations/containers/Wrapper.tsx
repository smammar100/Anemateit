import type { ReactNode } from 'react';

type Variant = 'heroNarrow' | 'narrow' | 'standard' | 'prose';

type Props = {
  variant?: Variant;
  className?: string;
  children?: ReactNode;
};

const variantClasses: Record<Variant, string> = {
  heroNarrow: 'mx-auto px-8 max-w-3xl',
  standard: 'mx-auto px-8 max-w-7xl 2xl:max-w-[110rem]',
  narrow: 'mx-auto px-8 max-w-xl',
  prose:
    'prose ext-base-600 prose-headings:text-base-900 prose-pre:border-0 prose-blockquote:text-accent-600 prose-a:text-accent-600 prose-a:hover:text-accent-500 prose-a:duration-200 max-w-none prose-pre:text-sm prose-strong:text-base-900 prose-pre:rounded-2xl',
};

export default function Wrapper({
  variant = 'standard',
  className = '',
  children,
}: Props) {
  return (
    <div className={`${variantClasses[variant]} ${className}`.trim()}>
      {children}
    </div>
  );
}
