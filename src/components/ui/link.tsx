import NextLink, { type LinkProps as NextLinkProps } from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type LinkProps = NextLinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps> & {
    children: ReactNode;
    className: string;
  };

export function Link({ children, className, ...props }: LinkProps) {
  return (
    <NextLink className={cn('inline-flex text-[16px] leading-none font-medium text-foreground', className)} {...props}>
      {children}
    </NextLink>
  );
}
