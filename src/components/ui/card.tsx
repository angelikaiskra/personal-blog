import { createElement, type ComponentPropsWithoutRef, type ElementType } from 'react';

import { cn } from '@/lib/utils';

type CardProps<T extends ElementType = 'div'> = {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, 'as'>;

export function Card<T extends ElementType = 'div'>({ as, className, ...props }: CardProps<T>) {
  const Component: ElementType = as ?? 'div';

  return createElement(Component, {
    className: cn(
      'rounded-xl border border-black bg-card p-5 shadow-brutalist-md sm:p-8 dark:border-card-border',
      className,
    ),
    ...props,
  });
}
