import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textVariants = cva('font-sans tracking-normal', {
  variants: {
    variant: {
      small: 'text-[14px] leading-[1.15]',
      base: 'text-[16px] leading-[1.25]',
      body: 'text-[18px] leading-[1.5]',
    },
    color: {
      default: 'text-foreground',
      muted: 'text-muted-fg',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
});

type TextProps<T extends ElementType = 'span'> = {
  as?: T;
} & VariantProps<typeof textVariants> &
  Omit<ComponentPropsWithoutRef<T>, 'as' | 'variant' | 'color'>;

export function Text<T extends ElementType = 'span'>({ as, color, variant, className, ...props }: TextProps<T>) {
  const Component = as ?? 'span';
  const classes = cn(textVariants({ variant, color }), className);

  return <Component className={classes} {...props} />;
}
