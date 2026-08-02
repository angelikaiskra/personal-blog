import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

type ArrowRightIconProps = ComponentPropsWithoutRef<'svg'>;

export function ArrowRightIcon({ className, ...props }: ArrowRightIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('size-6', className)}
      aria-hidden="true"
      transform="translate(0 1)"
      {...props}
    >
      <path d="M0 0h24v24H0z" fill="none" />
      <path
        fill="currentColor"
        d="M13.884 6.116a1.25 1.25 0 0 0-1.768 1.768l2.866 2.866H6a1.25 1.25 0 1 0 0 2.5h8.982l-2.866 2.866a1.25 1.25 0 0 0 1.768 1.768l5-5a1.25 1.25 0 0 0 0-1.768z"
      />
    </svg>
  );
}
