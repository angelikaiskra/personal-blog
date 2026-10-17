'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

import './code-block.css';

type CodeExample = {
  label: string;
  content: ReactNode;
};

export function CodeBlockTabs({ examples }: { examples: CodeExample[] }) {
  const id = useId();
  const [selectedTab, setSelectedTab] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number;

    switch (event.key) {
      case 'ArrowLeft':
        nextIndex = (index - 1 + examples.length) % examples.length;
        break;
      case 'ArrowRight':
        nextIndex = (index + 1) % examples.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = examples.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    setSelectedTab(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div data-code-block-tabs className="not-prose code-block code-block-tabs">
      <div role="tablist" aria-label="Code examples" className="flex overflow-x-auto border-b border-border bg-muted">
        {examples.map(({ label }, index) => (
          <button
            key={label}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={selectedTab === index}
            tabIndex={selectedTab === index ? 0 : -1}
            className={cn(
              'shrink-0 cursor-pointer border-b-2 border-transparent px-(--code-padding) py-2.5',
              'text-sm/normal font-semibold text-muted-fg',
              'aria-selected:border-link-accent aria-selected:text-foreground dark:aria-selected:border-accent',
              'focus-visible:outline-2 focus-visible:-outline-offset-3 focus-visible:outline-link-accent',
            )}
            onClick={() => setSelectedTab(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {label}
          </button>
        ))}
      </div>

      {examples.map(({ label, content }, index) => (
        <div
          key={label}
          role="tabpanel"
          id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          hidden={selectedTab !== index}
        >
          {content}
        </div>
      ))}
    </div>
  );
}
