import { createElement, type ComponentPropsWithoutRef, type ElementType } from 'react';

import { cn } from '@/lib/utils';

type CardProps<T extends ElementType = 'div'> = {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, 'as'>;

export function Card<T extends ElementType = 'div'>({ as, className, ...props }: CardProps<T>) {
  const Component: ElementType = as ?? 'div';

  return createElement(Component, {
    className: cn(
      'dark:border-border bg-card shadow-brutalist-md rounded-xl border border-black p-5 sm:p-8',
      className,
    ),
    ...props,
  });
}
