'use client';

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type RefObject } from 'react';

import { ClipboardIcon } from '@/components/icons/clipboard-icon';
import { cn } from '@/lib/utils';

import './code-block.css';

type CopyStatus = 'idle' | 'copied' | 'error';

const copyFeedback = {
  idle: { title: 'Copy', announcement: '' },
  copied: { title: 'Copied', announcement: 'Code copied to clipboard.' },
  error: {
    title: 'Could not copy. Try again.',
    announcement: 'Could not copy code. Select the code and copy it manually, or try again.',
  },
} satisfies Record<CopyStatus, { title: string; announcement: string }>;

export function CodeBlockPre({ children, className, tabIndex = 0, ...props }: ComponentPropsWithoutRef<'pre'>) {
  const preRef = useRef<HTMLPreElement>(null);

  return (
    <div data-code-block className="not-prose code-block">
      <CopyCodeButton preRef={preRef} />

      <pre ref={preRef} className={cn('code-block-pre', className)} tabIndex={tabIndex} {...props}>
        {children}
      </pre>
    </div>
  );
}

function CopyCodeButton({ preRef }: { preRef: RefObject<HTMLPreElement | null> }) {
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<CopyStatus>('idle');
  const feedback = copyFeedback[status];

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current !== null) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  async function copyCode() {
    const code = preRef.current?.querySelector('code')?.textContent;
    if (code === undefined || code === null) return;

    if (resetTimeoutRef.current !== null) clearTimeout(resetTimeoutRef.current);

    try {
      await navigator.clipboard.writeText(code);
      setStatus('copied');
    } catch {
      setStatus('error');
    }

    resetTimeoutRef.current = setTimeout(() => setStatus('idle'), 2000);
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          'absolute top-1.5 right-2 inline-flex min-h-8 min-w-8 cursor-pointer items-center justify-center',
          'rounded-md border border-border bg-background p-1.5 text-muted-fg',
          'hover:bg-muted hover:text-foreground',
          'focus-visible:outline-2 focus-visible:-outline-offset-3 focus-visible:outline-link-accent',
        )}
        onClick={copyCode}
        aria-label="Copy code"
        title={feedback.title}
      >
        <ClipboardIcon
          checked={status === 'copied'}
          className={cn('size-4', status === 'copied' && 'text-green-600 dark:text-green-400')}
        />
      </button>
      <span className="sr-only" role="status">
        {feedback.announcement}
      </span>
    </>
  );
}
