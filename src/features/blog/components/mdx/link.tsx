import type { ComponentPropsWithoutRef } from 'react';

import { ExternalLinkIcon } from '@/components/icons/external-link-icon';

type LinkProps = ComponentPropsWithoutRef<'a'>;

export function Link({ href, children, target, rel, style, ...props }: LinkProps) {
  const isExternal = /^https?:\/\//i.test(href ?? '');

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : target}
      rel={isExternal ? 'noopener noreferrer' : rel}
      style={{ fontWeight: 'inherit', ...style }}
      {...props}
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
