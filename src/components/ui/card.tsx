import type { ComponentPropsWithoutRef, ElementType } from 'react';

import { cn } from '@/lib/utils';

type CardProps<T extends ElementType = 'div'> = {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, 'as'>;

export function Card<T extends ElementType = 'div'>({ as, className, ...props }: CardProps<T>) {
  const Component = as ?? 'div';

  return (
    <Component
      className={cn('rounded-xl border border-black bg-card p-5 shadow-brutalist-md sm:p-8', className)}
      {...props}
    />
  );
}
