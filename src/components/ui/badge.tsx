import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'dark:border-border dark:shadow-[2px_3px_0_0_#494042] inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border border-black dark:border-[#6F6265] border-2 shadow-brutalist-sm px-2.5 py-0.5 font-semibold font-sans whitespace-nowrap transition-colors ease-out focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3',
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
