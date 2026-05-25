import type { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';

type Variant = 'default' | 'accent' | 'muted' | 'none';
type Size = 'xxs' | 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl';
type Gap = 'xs' | 'sm' | 'base' | 'md' | 'lg';

type CommonProps = {
  variant?: Variant;
  size?: Size;
  iconOnly?: boolean;
  gap?: Gap;
  className?: string;
  children?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  icon?: ReactNode;
};

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
    isLink?: false;
  };

type LinkProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> & {
    isLink: true;
    href: string;
  };

type Props = ButtonProps | LinkProps;

const defaultClass = ['text-white', 'bg-base-800', 'hover:bg-base-700', 'focus:outline-base-700'];
const accentClass = ['text-white', 'bg-accent-600', 'hover:bg-accent-500', 'focus:outline-accent-500'];
const mutedClass = ['text-base-900', 'bg-base-50', 'hover:bg-base-100', 'focus:outline-base-300'];

const sizes: Record<Size, string[]> = {
  xxs: ['h-7.5', 'px-4', 'py-2', 'text-xs', 'rounded-lg'],
  xs: ['h-8', 'px-4', 'py-3', 'text-xs', 'rounded-lg'],
  sm: ['h-9', 'px-4', 'py-3', 'text-sm', 'rounded-lg'],
  base: ['h-10', 'px-5', 'py-4', 'text-sm', 'rounded-lg'],
  md: ['h-11', 'px-5', 'py-4', 'text-base', 'rounded-lg'],
  lg: ['h-12', 'px-5', 'py-4', 'text-lg', 'rounded-lg'],
  xl: ['h-13', 'px-5', 'py-4', 'text-lg', 'rounded-xl'],
};

const iconSizes: Record<Size, string[]> = {
  xxs: ['size-7.5', 'py-2', 'text-xs', 'rounded-lg'],
  xs: ['size-8', 'text-xs', 'rounded-lg'],
  sm: ['size-9', 'text-sm', 'rounded-lg'],
  base: ['size-10', 'text-sm', 'rounded-lg'],
  md: ['size-11', 'text-base', 'rounded-lg'],
  lg: ['size-12', 'text-lg', 'rounded-lg'],
  xl: ['size-13', 'text-lg', 'rounded-xl'],
};

const gapMap: Record<Gap, string[]> = {
  xs: ['gap-2'],
  sm: ['gap-4'],
  base: ['gap-8'],
  md: ['gap-10'],
  lg: ['gap-12'],
};

const variantClass: Record<Variant, string[]> = {
  default: defaultClass,
  accent: accentClass,
  muted: mutedClass,
  none: [],
};

const baseClass = [
  'flex',
  'justify-center',
  'text-center',
  'font-medium',
  'items-center',
  'duration-500',
  'ease-in-out',
  'transition-colors',
  'focus:outline-2',
  'focus:outline-inset',
];

export default function Button(props: Props) {
  const {
    variant = 'default',
    size = 'base',
    iconOnly = false,
    gap,
    className = '',
    children,
    leftIcon,
    rightIcon,
    icon,
    ...rest
  } = props;

  const sizeClass = iconOnly ? iconSizes[size] : sizes[size] ?? [];
  const gapClass = !iconOnly && gap ? gapMap[gap] : [];
  const additionalClasses = className ? className.split(' ') : [];

  const classes = [
    ...baseClass,
    ...(variantClass[variant] ?? []),
    ...sizeClass,
    ...gapClass,
    ...additionalClasses,
  ].join(' ');

  const inner = iconOnly ? (
    icon
  ) : (
    <>
      {leftIcon}
      {children}
      {rightIcon}
    </>
  );

  if ('isLink' in props && props.isLink) {
    const { isLink: _isLink, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & { isLink?: boolean };
    return (
      <a className={classes} {...anchorRest}>
        {inner}
      </a>
    );
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classes} {...buttonRest}>
      {inner}
    </button>
  );
}
