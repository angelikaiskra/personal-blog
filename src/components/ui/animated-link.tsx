import { type LinkProps } from 'next/link';
import { type AnchorHTMLAttributes, type ReactNode } from 'react';

import { ArrowRightIcon } from '@/components/icons/arrow-right-icon';
import { cn } from '@/lib/utils';
import { Link } from './link';

export type LinkAnimation = 'underline' | 'arrowSlide';

type AnimatedLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
    hoverAnimation?: LinkAnimation;
  };

export function AnimatedLink({ children, hoverAnimation = 'underline', className, ...props }: AnimatedLinkProps) {
  return (
    <Link
      className={cn('group relative', hoverAnimation === 'arrowSlide' && 'items-center gap-x-1.5', className)}
      {...props}
    >
      {children}

      {hoverAnimation === 'underline' && (
        <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-foreground transition-transform duration-300 ease-out group-hover:scale-x-100" />
      )}

      {hoverAnimation === 'arrowSlide' && (
        <ArrowRightIcon className="size-5 shrink-0 text-link-accent motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-in-out motion-safe:group-hover:translate-x-1.5 motion-safe:group-focus-visible:translate-x-1.5" />
      )}
    </Link>
  );
}
