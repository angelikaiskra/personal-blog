'use client';

import type { ReactNode, SyntheticEvent } from 'react';

import { useDeviceType } from '@/lib/use-device-type';
import { cn } from '@/lib/utils';

type CodeRefProps = {
  target: string;
  children: ReactNode;
};

export function CodeRef({ target, children }: CodeRefProps) {
  const isMobile = useDeviceType() === 'mobile';

  function showHighlight(event: SyntheticEvent<HTMLSpanElement>) {
    if (isMobile) return;
    highlightCodeLines(event.currentTarget, target, true);
  }

  function hideHighlight(event: SyntheticEvent<HTMLSpanElement>) {
    highlightCodeLines(event.currentTarget, target, false);
  }

  return (
    <span
      tabIndex={0}
      onMouseEnter={showHighlight}
      onMouseLeave={(event) => {
        if (!event.currentTarget.matches(':focus')) hideHighlight(event);
      }}
      onFocus={showHighlight}
      onBlur={hideHighlight}
      className={cn(
        'cursor-help rounded-sm underline decoration-link-accent decoration-dotted underline-offset-4',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link-accent',
        'dark:decoration-accent',
      )}
    >
      {children}
    </span>
  );
}

function highlightCodeLines(codeRef: HTMLElement, target: string, isActive: boolean) {
  const article = codeRef.closest('.prose') ?? document;
  const lines = article.querySelectorAll(`[data-code-refs~="${CSS.escape(target)}"]`);

  for (const line of lines) {
    line.toggleAttribute('data-code-ref-active', isActive);
  }
}
