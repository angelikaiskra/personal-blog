import NextLink from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

import { ExternalLinkIcon } from '@/components/icons/external-link-icon';
import { cn } from '@/lib/utils';

type LinkProps = ComponentPropsWithoutRef<'a'>;

export function Link({ href, children, target, rel, style, className, ...props }: LinkProps) {
  const isExternal = /^https?:\/\//i.test(href ?? '');
  const linkProps = {
    className: cn('underline decoration-link-accent decoration-2 underline-offset-2', className),
    style: { fontWeight: 'inherit', ...style },
    ...props,
  };

  if (href?.startsWith('/') && !href.startsWith('//')) {
    return (
      <NextLink href={href} target={target} rel={rel} {...linkProps}>
        {children}
      </NextLink>
    );
  }

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : target}
      rel={isExternal ? 'noopener noreferrer' : rel}
      {...linkProps}
    >
      {children}
      {isExternal && (
        <>
          <span className="sr-only"> (opens in a new tab)</span>
          &nbsp;
          <span className="relative inline-block size-[0.65em] align-baseline after:absolute after:inset-x-0 after:top-[calc(100%+0.11em)] after:h-[0.11em] after:bg-link-accent">
            <ExternalLinkIcon className="size-full" />
          </span>
        </>
      )}
    </a>
  );
}
