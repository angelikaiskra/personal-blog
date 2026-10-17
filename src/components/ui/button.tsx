import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'group/button relative isolate mb-2 inline-flex w-fit shrink-0 items-center justify-center overflow-visible rounded-lg border border-transparent',
    'font-heading font-bold whitespace-nowrap select-none',
    'transition-transform duration-150 ease-out active:duration-75 motion-reduce:transition-none',
    'motion-safe:hover:translate-y-px motion-safe:active:translate-y-1',
    'outline-none disabled:pointer-events-none disabled:opacity-50',
    'after:pointer-events-none after:absolute after:inset-0 after:-bottom-2 after:z-50 after:rounded-[inherit] dark:after:-bottom-1',
    'focus-visible:after:ring-3 focus-visible:after:ring-black focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-background dark:focus-visible:after:ring-white',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
    'dark:[&>.darkest]:hidden',
  ],
  {
    variants: {
      variant: {
        default: [
          'text-primary-fg',
          '[&>.base]:bg-primary hover:[&>.base]:bg-primary-hover',
          '[&>.darker]:bg-[#86662D]',
        ],
        secondary: [
          'text-secondary-fg',
          '[&>.base]:border-2 [&>.base]:border-black [&>.base]:bg-secondary hover:[&>.base]:bg-[#383D51] dark:[&>.base]:border-secondary',
          '[&>.darker]:bg-[#131520] dark:[&>.darker]:bg-[#232638]',
          '[&>.darkest]:bg-black',
        ],
        green: [
          'text-white after:-bottom-1',
          '[&>.base]:bg-[#15803d] hover:[&>.base]:bg-[#166534]',
          '[&>.darker]:bg-[#14532d]',
          '[&>.darkest]:bg-transparent',
        ],
      },
      size: {
        default: 'h-11 gap-3 px-6 sm:h-10',
        sm: 'h-8 gap-2 px-4 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const layerClasses = cn(
  'pointer-events-none absolute size-full rounded-[inherit]',
  'duration-150 ease-out group-active/button:duration-75 motion-reduce:transition-none',
);

const contentClasses = cn(
  'relative z-40 transition-transform duration-150 ease-out motion-reduce:transition-none',
  'motion-safe:group-hover/button:translate-y-px motion-safe:group-active/button:translate-y-px motion-safe:group-active/button:scale-y-95',
);

type ButtonProps<T extends React.ElementType = 'button'> = {
  as?: T;
  icon?: React.ReactNode;
  fullWidth?: boolean;
} & VariantProps<typeof buttonVariants> &
  Omit<React.ComponentProps<T>, 'as' | 'icon' | 'fullWidth' | keyof VariantProps<typeof buttonVariants>>;

function Button<T extends React.ElementType = 'button'>({
  as,
  className,
  variant = 'default',
  size = 'default',
  fullWidth = false,
  icon,
  children,
  ...props
}: ButtonProps<T>) {
  const Component: React.ElementType = as ?? 'button';

  return React.createElement(
    Component,
    {
      'data-slot': 'button',
      'data-variant': variant,
      'data-size': size,
      className: cn(buttonVariants({ variant, size, className }), { 'w-full': fullWidth }),
      ...props,
      ...(Component === 'button' && { type: props.type ?? 'button' }),
    },
    <>
      <span
        className={cn(
          layerClasses,
          'darkest top-2 z-10 bg-foreground transition-transform',
          'motion-safe:group-hover/button:-translate-y-px motion-safe:group-active/button:-translate-y-1',
        )}
      />

      <span
        className={cn(
          layerClasses,
          'darker top-1 z-20 transition-transform',
          'motion-safe:group-active/button:-translate-y-0.75',
        )}
      />

      <span
        className={cn(
          layerClasses,
          'base z-30 transition-[translate,background-color] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]',
          'motion-safe:group-hover/button:translate-y-px motion-safe:group-active/button:translate-y-px',
        )}
      />

      <span className={contentClasses}>{children}</span>

      {icon && (
        <span data-icon="inline-end" className={contentClasses}>
          {icon}
        </span>
      )}
    </>,
  );
}

export { Button };
