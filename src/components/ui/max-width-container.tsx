import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

type MaxWidthContainerProps = ComponentPropsWithoutRef<'div'>;

export function MaxWidthContainer({ children, className, ...props }: MaxWidthContainerProps) {
  return (
    <div className={cn('mx-auto max-w-[var(--max-width)] px-4', className)} {...props}>
      {children}
    </div>
  );
}
