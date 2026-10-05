'use client';

import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react';

import { ClipboardIcon } from '@/components/icons/clipboard-icon';
import { cn } from '@/lib/utils';

type CopyStatus = 'idle' | 'copied' | 'error';

export function CodeBlock({ children, className, tabIndex = 0, ...props }: ComponentPropsWithoutRef<'pre'>) {
  const preRef = useRef<HTMLPreElement>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<CopyStatus>('idle');

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
    <div
      data-code-block
      className="not-prose border-border relative min-w-0 overflow-hidden rounded-xl border [--code-padding:1rem] sm:[--code-padding:1.25rem]"
    >
      <button
        type="button"
        className="border-border text-muted-fg bg-background hover:text-foreground hover:bg-muted focus-visible:outline-link-accent absolute top-1.5 right-2 inline-flex min-h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border p-1.5 focus-visible:outline-2 focus-visible:-outline-offset-3"
        onClick={copyCode}
        aria-label="Copy code"
        title={status === 'copied' ? 'Copied' : status === 'error' ? 'Could not copy. Try again.' : 'Copy'}
        data-copy-status={status}
      >
        <ClipboardIcon
          checked={status === 'copied'}
          className={cn('size-4', status === 'copied' && 'text-green-600 dark:text-green-400')}
        />
      </button>
      <span className="sr-only" role="status">
        {status === 'copied'
          ? 'Code copied to clipboard.'
          : status === 'error'
            ? 'Could not copy code. Select the code and copy it manually, or try again.'
            : ''}
      </span>
      <pre
        ref={preRef}
        className={cn(
          'focus-visible:outline-link-accent m-0 overflow-x-auto py-(--code-padding) font-mono text-sm leading-[1.65] tab-2 focus-visible:outline-2 focus-visible:-outline-offset-3',
          className,
        )}
        tabIndex={tabIndex}
        {...props}
      >
        {children}
      </pre>
    </div>
  );
}
