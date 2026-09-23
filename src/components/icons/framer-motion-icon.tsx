import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

type FramerMotionIconProps = ComponentPropsWithoutRef<'svg'>;

export function FramerMotionIcon({ className, ...props }: FramerMotionIconProps) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 21 21"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-6', className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M10.3333 10.3333L1 1V19.6667L19.6667 1V19.6667L15 15" />
      <path d="M19.6667 10.3335L10.3334 19.6668L5.66669 15.0002" />
    </svg>
  );
}
