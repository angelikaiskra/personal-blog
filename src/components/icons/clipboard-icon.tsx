import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

type ClipboardIconProps = ComponentPropsWithoutRef<'svg'> & {
  checked?: boolean;
};

export function ClipboardIcon({ className, checked = false, ...props }: ClipboardIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 384 512"
      fill="currentColor"
      className={cn('size-6 transition-colors duration-300 ease-out motion-reduce:transition-none', className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M232 96l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l80 0c13.3 0 24 10.7 24 24s-10.7 24-24 24zm0 48c37.1 0 67.6-28 71.6-64L320 80c8.8 0 16 7.2 16 16l0 352c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16L48 96c0-8.8 7.2-16 16-16l16.4 0c4 36 34.5 64 71.6 64l80 0zM291.9 32C279 12.7 257 0 232 0L152 0c-25 0-47 12.7-59.9 32L64 32C28.7 32 0 60.7 0 96L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-352c0-35.3-28.7-64-64-64l-28.1 0z" />
      <path
        d="M104 288l64 64 112-128"
        fill="none"
        stroke="currentColor"
        strokeWidth="32"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={checked ? 0 : 1}
        opacity={checked ? 1 : 0}
        className="transition-[stroke-dashoffset,opacity] duration-300 ease-out motion-reduce:transition-none"
      />
    </svg>
  );
}
