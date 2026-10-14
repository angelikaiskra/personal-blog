'use client';

import { useId, useState, type ReactNode } from 'react';

import { ArrowRightIcon } from '@/components/icons/arrow-right-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CollapsibleAsideContent({ children, className }: { children: ReactNode; className: string }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  return (
    <>
      <div id={contentId} className={cn(className, !expanded && 'max-h-60 overflow-hidden')} inert={!expanded}>
        {children}
      </div>
      {!expanded && (
        <div
          className="pointer-events-none absolute right-0 bottom-0 -left-1 h-60 bg-linear-to-t from-background via-background/80 to-transparent"
          aria-hidden="true"
        />
      )}
      <div className={cn('relative z-10 mt-4 flex justify-center', expanded && 'mt-8')}>
        <Button
          type="button"
          variant="green"
          size="sm"
          className="max-w-full"
          aria-expanded={expanded}
          aria-controls={contentId}
          icon={<ArrowRightIcon className={cn('size-4', expanded ? '-rotate-90' : 'rotate-90')} />}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      </div>
    </>
  );
}
