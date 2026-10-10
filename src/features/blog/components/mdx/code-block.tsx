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

export function CodeBlock({ children, className, tabIndex = 0, ...props }: ComponentPropsWithoutRef<'pre'>) {
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
        className="code-block-copy-button"
        onClick={copyCode}
        aria-label="Copy code"
        title={feedback.title}
        data-copy-status={status}
      >
        <ClipboardIcon checked={status === 'copied'} className="code-block-copy-icon" />
      </button>
      <span className="code-block-announcement" role="status">
        {feedback.announcement}
      </span>
    </>
  );
}
