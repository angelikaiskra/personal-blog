import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type HeadingProps = ComponentPropsWithoutRef<'h2'>;

function createLinkedHeading(Heading: HeadingLevel) {
  return function LinkedHeading({ id, children, className, ...props }: HeadingProps) {
    return (
      <Heading id={id} className={cn('relative scroll-mt-32', className)} {...props}>
        {id ? (
          <a
            href={`#${id}`}
            className="group/heading decoration-link-accent relative inline-block text-inherit no-underline decoration-2 underline-offset-2 [font:inherit] before:absolute before:top-1/2 before:right-full before:h-8 before:w-2 before:-translate-y-1/2 before:content-[''] hover:underline focus-visible:rounded-sm focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
          >
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-0 flex size-8 translate-x-[-120%] -translate-y-1/2 items-center justify-center rounded-full font-medium opacity-0 group-hover/heading:opacity-100 group-focus-visible/heading:opacity-100 motion-safe:transition-opacity motion-safe:duration-400 motion-safe:ease-in-out"
            >
              #
            </span>
            {children}
          </a>
        ) : (
          children
        )}
      </Heading>
    );
  };
}

export const linkedHeadingComponents = {
  h1: createLinkedHeading('h1'),
  h2: createLinkedHeading('h2'),
  h3: createLinkedHeading('h3'),
  h4: createLinkedHeading('h4'),
  h5: createLinkedHeading('h5'),
  h6: createLinkedHeading('h6'),
};
