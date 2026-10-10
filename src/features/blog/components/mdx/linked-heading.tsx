import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

import { HeadingLink } from './heading-link';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type HeadingProps = ComponentPropsWithoutRef<'h2'>;

function createLinkedHeading(Heading: HeadingLevel) {
  return function LinkedHeading({ id, children, className, ...props }: HeadingProps) {
    return (
      <Heading id={id} className={cn('relative scroll-mt-32', className)} {...props}>
        {id ? <HeadingLink id={id}>{children}</HeadingLink> : children}
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
