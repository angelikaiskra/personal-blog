'use client';

import { type LinkProps } from 'next/link';
import { type AnchorHTMLAttributes, type ReactNode, useState } from 'react';
import { useReducedMotion } from 'motion/react';

import { ReadMoreArrowIcon } from '@/components/icons/read-more-arrow-icon';
import { cn } from '@/lib/utils';
import { Link } from './link';

export type LinkAnimation = 'underline' | 'arrowMarquee';

type AnimatedLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
    hoverAnimation?: LinkAnimation;
  };

export function AnimatedLink({
  children,
  hoverAnimation = 'underline',
  className,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: AnimatedLinkProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const isArrowAnimated = hoverAnimation === 'arrowMarquee' && !prefersReducedMotion && (isHovered || isFocused);

  return (
    <Link
      className={cn('group relative', hoverAnimation === 'arrowMarquee' && 'items-center gap-x-2', className)}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        setIsHovered(true);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        setIsHovered(false);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        setIsFocused(true);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        setIsFocused(false);
      }}
      {...props}
    >
      {children}

      {hoverAnimation === 'underline' && (
        <span className="bg-foreground absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
      )}

      {hoverAnimation === 'arrowMarquee' && (
        <ReadMoreArrowIcon className="text-link-accent" isAnimated={isArrowAnimated} />
      )}
    </Link>
  );
}
