import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

type NextjsIconProps = ComponentPropsWithoutRef<'svg'>;

export function NextjsIcon({ className, ...props }: NextjsIconProps) {
  return (
    <svg
      width="39"
      height="39"
      viewBox="0 0 39 39"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={cn('size-6', className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M19.4902 0C8.73163 0 0 8.736 0 19.5C0 30.264 8.73163 39 19.4902 39C23.4857 39 27.1889 37.791 30.2878 35.7435L14.1499 14.8785V27.5535H11.4408V11.427H14.8321L32.4318 34.1055C34.5006 32.2774 36.1564 30.0293 37.2889 27.5109C38.4215 24.9925 39.0048 22.2616 39 19.5C39 8.736 30.2683 0 19.5097 0H19.4902ZM27.7736 23.6535L25.0839 20.1825V11.427H27.7736V23.6535Z" />
    </svg>
  );
}
