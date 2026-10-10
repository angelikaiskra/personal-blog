'use client';

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type RefObject } from 'react';

import { ClipboardIcon } from '@/components/icons/clipboard-icon';
import { cn } from '@/lib/utils';

const focusStyles = 'focus-visible:outline-link-accent focus-visible:outline-2 focus-visible:-outline-offset-3';

const codeBlockStyles = {
  container: cn(
    'not-prose border-border relative min-w-0 overflow-hidden rounded-xl border dark:border-card-border',
    '[--code-padding:1rem] sm:[--code-padding:1.25rem]',
    '[[data-rehype-pretty-code-title]+&]:rounded-t-none',
  ),
  pre: cn(
    'bg-code-bg font-code m-0 overflow-x-auto py-(--code-padding) text-[15px] leading-[1.65] [tab-size:2]',
    'text-[color:var(--shiki-light,var(--foreground))] dark:text-[color:var(--shiki-dark,var(--foreground))]',
    '[&_span]:text-[color:var(--shiki-light)] dark:[&_span]:text-[color:var(--shiki-dark,var(--foreground))]',
    '[&_code]:grid [&_code]:w-max [&_code]:min-w-full [&_code]:whitespace-pre [&_code]:[font:inherit]',
    '[&_[data-line]]:min-h-[1lh] [&_[data-line]]:px-(--code-padding)',
    focusStyles,
  ),
  copyButton: cn(
    'border-border bg-background text-muted-fg absolute top-1.5 right-2 inline-flex min-h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border p-1.5',
    'hover:bg-muted hover:text-foreground',
    focusStyles,
  ),
  copyIcon: 'size-4',
  copiedIcon: 'text-green-600 dark:text-green-400',
};

type CopyStatus = 'idle' | 'copied' | 'error';

const copyFeedback = {
  idle: { title: 'Copy', announcement: '' },
  copied: { title: 'Copied', announcement: 'Code copied to clipboard.' },
  error: {
    title: 'Could not copy. Try again.',
    announcement: 'Could not copy code. Select the code and copy it manually, or try again.',
  },
} satisfies Record<CopyStatus, { title: string; announcement: string }>;

export function CodeBlock({ children, className, tabIndex = 0, ...props }: ComponentPropsWithoutRef<'pre'>) {
  const preRef = useRef<HTMLPreElement>(null);

  return (
    <div data-code-block className={codeBlockStyles.container}>
      <CopyCodeButton preRef={preRef} />

      <pre ref={preRef} className={cn(codeBlockStyles.pre, className)} tabIndex={tabIndex} {...props}>
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
        className={codeBlockStyles.copyButton}
        onClick={copyCode}
        aria-label="Copy code"
        title={feedback.title}
        data-copy-status={status}
      >
        <ClipboardIcon
          checked={status === 'copied'}
          className={cn(codeBlockStyles.copyIcon, status === 'copied' && codeBlockStyles.copiedIcon)}
        />
      </button>
      <span className="sr-only" role="status">
        {feedback.announcement}
      </span>
    </>
  );
}
