import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'focus-visible:border-ring focus-visible:ring-ring/50 inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border border-2 border-black px-2.5 py-0.5 font-sans font-semibold whitespace-nowrap shadow-brutalist-sm transition-colors ease-out focus-visible:ring-[3px] dark:border-[#6F6265] dark:shadow-[2px_3px_0_0_#494042] [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      color: {
        default: 'bg-[#F3F3F3] hover:bg-muted-hover dark:bg-muted',
      },
      hoverColor: {
        gray: 'hover:bg-[#F3F3F3] dark:hover:bg-muted',
      },
    },
    defaultVariants: {
      color: 'default',
    },
  },
);

type BadgeProps<T extends React.ElementType = 'span'> = {
  as?: T;
} & VariantProps<typeof badgeVariants> &
  Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'color' | 'hoverColor'>;

function Badge<T extends React.ElementType = 'span'>({
  className,
  as,
  color,
  hoverColor,
  children,
  ...props
}: BadgeProps<T>) {
  const Component: React.ElementType = as ?? 'span';

  return React.createElement(
    Component,
    { className: cn(badgeVariants({ color, hoverColor, className })), ...props },
    children,
  );
}

export { Badge, badgeVariants };
