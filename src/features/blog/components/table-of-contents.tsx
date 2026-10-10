'use client';

import { useLayoutEffect, useRef } from 'react';

import { Heading } from '@/components/ui/heading';
import type { TableOfContentsItem } from '@/features/blog/lib/rehype-table-of-contents';
import { useTableOfContents } from '@/features/blog/lib/use-table-of-contents';
import { cn } from '@/lib/utils';

type TableOfContentsProps = {
  items: TableOfContentsItem[];
};

function measureIndicator(list: HTMLOListElement, indicator: HTMLSpanElement, nav: HTMLElement) {
  const activeLink = list.querySelector<HTMLAnchorElement>('[aria-current="location"]');
  if (!activeLink || !activeLink.getClientRects().length) return;

  indicator.style.transform = `translateY(${activeLink.offsetTop}px)`;
  indicator.style.height = `${activeLink.offsetHeight}px`;
  indicator.style.opacity = '1';

  // Commit the initial position before enabling transitions.
  if (!indicator.dataset.ready) {
    indicator.getBoundingClientRect();
    indicator.dataset.ready = 'true';
  }

  // Long lists can overflow the sticky sidebar; keep the active entry visible.
  const linkBounds = activeLink.getBoundingClientRect();
  const navBounds = nav.getBoundingClientRect();
  if (linkBounds.top < navBounds.top) nav.scrollTop += linkBounds.top - navBounds.top;
  else if (linkBounds.bottom > navBounds.bottom) nav.scrollTop += linkBounds.bottom - navBounds.bottom;
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const { activeId, navigateToSection } = useTableOfContents(items);
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;
    const nav = navRef.current;
    if (list && indicator && nav) measureIndicator(list, indicator, nav);
  }, [activeId, items]);

  useLayoutEffect(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;
    const nav = navRef.current;
    if (!list || !indicator || !nav) return;

    const observer = new ResizeObserver(() => measureIndicator(list, indicator, nav));
    observer.observe(nav);
    observer.observe(list);
    list.querySelectorAll('a').forEach((link) => observer.observe(link));
    return () => observer.disconnect();
  }, [items]);

  return (
    <aside className="hidden w-62.5 shrink-0 lg:block">
      <nav
        ref={navRef}
        aria-label="On this page"
        className="sticky top-41 max-h-[calc(100dvh-11rem)] overflow-y-auto pr-2 pb-1"
      >
        <Heading variant="h2" as="h2" className="font-heading mt-1.5 text-[20px] font-bold tracking-tight">
          On this page
        </Heading>
        <div className="relative mt-4">
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className="bg-accent pointer-events-none absolute top-0 left-0 w-1 opacity-0 motion-safe:data-[ready]:transition-[transform,height] motion-safe:data-[ready]:duration-250 motion-safe:data-[ready]:ease-out"
          />
          <ol ref={listRef} className="space-y-3 pl-5 font-sans text-[16px] leading-normal font-normal">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${encodeURIComponent(item.id)}`}
                  aria-current={activeId === item.id ? 'location' : undefined}
                  onClick={(event) => navigateToSection(event, item.id)}
                  className={cn(
                    'hover:text-foreground block focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current motion-safe:transition-colors',
                    activeId === item.id ? 'text-foreground' : 'text-muted-fg',
                    item.level === 3 && 'pl-4',
                  )}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </aside>
  );
}
