import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

type EnvelopeIconProps = ComponentPropsWithoutRef<'svg'>;

export function EnvelopeIcon({ className, ...props }: EnvelopeIconProps) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={cn('size-6', className)}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M14 0C21.732 0 28 6.26801 28 14C28 21.732 21.732 28 14 28C6.26801 28 0 21.732 0 14C0 6.26801 6.26801 0 14 0ZM6.23007 10.0127C6.27922 9.40386 6.55579 8.83588 7.00473 8.42175C7.45366 8.00761 8.04207 7.77768 8.65285 7.77771H19.3473C19.9635 7.77768 20.5568 8.01173 21.007 8.43249C21.4572 8.85326 21.7308 9.42933 21.7724 10.0442L14.0008 14.136L6.23007 10.0127ZM6.22229 11.1093V17.7916C6.22229 18.4362 6.47837 19.0544 6.93418 19.5103C7.39 19.9661 8.00822 20.2222 8.65285 20.2222H19.3473C19.9919 20.2222 20.6101 19.9661 21.066 19.5103C21.5218 19.0544 21.7778 18.4362 21.7778 17.7916V11.14L14.2264 15.116C14.1563 15.1529 14.0784 15.1721 13.9992 15.172C13.92 15.1718 13.8421 15.1524 13.7722 15.1153L6.22229 11.1093Z"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}
