'use client';

import type { ReactNode } from 'react';

import { navigateToHeading } from '@/features/blog/lib/navigate-to-heading';

type HeadingLinkProps = {
  id: string;
  children: ReactNode;
};

export function HeadingLink({ id, children }: HeadingLinkProps) {
  return (
    <a
      href={`#${encodeURIComponent(id)}`}
      onClick={(event) => navigateToHeading(event, id)}
      className="group/heading relative inline-block text-inherit no-underline decoration-link-accent decoration-2 underline-offset-2 [font:inherit] before:absolute before:top-1/2 before:right-full before:h-8 before:w-2 before:-translate-y-1/2 before:content-[''] hover:underline focus-visible:rounded-sm focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
    >
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-0 flex size-8 translate-x-[-120%] -translate-y-1/2 items-center justify-center rounded-full font-medium opacity-0 group-hover/heading:opacity-100 group-focus-visible/heading:opacity-100 motion-safe:transition-opacity motion-safe:duration-400 motion-safe:ease-in-out"
      >
        #
      </span>
      {children}
    </a>
  );
}
