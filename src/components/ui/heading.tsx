import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const headingVariants = cva('font-heading tracking-tight', {
  variants: {
    variant: {
      h1: 'text-[32px] leading-[1.15] font-bold',
      h2: 'text-[22px] leading-[1.25] font-semibold',
      h3: 'text-[18px] leading-[1.35] font-semibold',
      body: 'text-[18px] leading-[1.15] font-medium'
    },
    color: {
      default: 'text-foreground',
      muted: 'text-muted-fg',
    },
  },
  defaultVariants: {
    variant: 'body',
    color: 'default',
  },
});

type HeadingProps<T extends ElementType = 'span'> = {
  as?: T;
} & VariantProps<typeof headingVariants> &
  Omit<ComponentPropsWithoutRef<T>, 'as' | 'variant' | 'color'>;

export function Heading<T extends ElementType = 'span'>({ as, color, variant, className, ...props }: HeadingProps<T>) {
  const Component = as ?? 'span';
  const classes = cn(headingVariants({ variant, color }), className);

  return <Component className={classes} {...props} />;
}
