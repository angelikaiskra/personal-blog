import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

type LinkedinIconProps = ComponentPropsWithoutRef<'svg'>;

export function LinkedinIcon({ className, ...props }: LinkedinIconProps) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={cn('size-5', className)}
      aria-hidden="true"
      {...props}
    >
      <circle cx="14" cy="14" r="14" fill="currentColor" />
      <path
        d="M9.40722 7.648C9.40698 8.12932 9.21554 8.59083 8.87503 8.931C8.53451 9.27117 8.07281 9.46215 7.5915 9.46191C7.11018 9.46166 6.64867 9.27023 6.30849 8.92972C5.96832 8.5892 5.77735 8.1275 5.77759 7.64618C5.77783 7.16486 5.96926 6.70335 6.30978 6.36318C6.65029 6.02301 7.11199 5.83203 7.59331 5.83228C8.07463 5.83252 8.53614 6.02395 8.87631 6.36446C9.21649 6.70498 9.40746 7.16668 9.40722 7.648ZM9.46166 10.8058H5.83203V22.1665H9.46166V10.8058ZM15.1965 10.8058H11.585V22.1665H15.1602V16.2048C15.1602 12.8837 19.4885 12.5752 19.4885 16.2048V22.1665H23.0728V14.9708C23.0728 9.37207 16.6665 9.58078 15.1602 12.3302L15.1965 10.8058Z"
        fill="white"
      />
    </svg>
  );
}
