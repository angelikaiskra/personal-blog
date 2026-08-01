import NextLink, { type LinkProps } from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type LinkAnimation = 'underline';

type AnimatedLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
    hoverAnimation?: LinkAnimation;
  };

export function AnimatedLink({ children, hoverAnimation = 'underline', className, ...props }: AnimatedLinkProps) {
  return (
    <NextLink
      className={cn('group text-foreground relative inline-flex text-[16px] leading-none font-medium', className)}
      {...props}
    >
      {children}

      {hoverAnimation === 'underline' && (
        <span className="bg-foreground absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
      )}
    </NextLink>
  );
}
