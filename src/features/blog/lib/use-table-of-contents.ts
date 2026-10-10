'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';

import { navigateToHeading } from './navigate-to-heading';
import type { TableOfContentsItem } from './rehype-table-of-contents';

const SCROLL_SETTLE_DELAY = 180;
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

export function useTableOfContents(items: TableOfContentsItem[]) {
  const [activeId, setActiveId] = useState(items[0]?.id);
  const startNavigationRef = useRef<((id: string) => void) | null>(null);

  useEffect(() => {
    const headings = items.map(({ id }) => document.getElementById(id)).filter((heading) => heading !== null);
    let frame = 0;
    let pendingId: string | null = null;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    function updateActiveSection() {
      frame = 0;
      if (pendingId || !headings.length) return;

      let activeHeading = headings[0];
      for (const heading of headings) {
        const offset = parseFloat(getComputedStyle(heading).scrollMarginTop) || 0;
        if (heading.getBoundingClientRect().top > offset + 1) break;
        activeHeading = heading;
      }

      const atBottom =
        window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      setActiveId((atBottom ? headings[headings.length - 1] : activeHeading).id);
    }

    function scheduleUpdate() {
      if (!frame) frame = requestAnimationFrame(updateActiveSection);
    }

    function finishScroll() {
      clearTimeout(settleTimer);
      pendingId = null;
      scheduleUpdate();
    }

    function waitForScrollToSettle() {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(finishScroll, SCROLL_SETTLE_DELAY);
    }

    startNavigationRef.current = (id) => {
      pendingId = id;
      setActiveId(id);
      // Release even when the destination is already at its scroll position.
      waitForScrollToSettle();
    };

    function onScroll() {
      // A quiet period also handles browsers without scrollend support.
      if (pendingId) waitForScrollToSettle();
      scheduleUpdate();
    }

    function interruptScroll() {
      if (!pendingId) return;
      window.scrollTo({ top: window.scrollY, behavior: 'instant' });
      finishScroll();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('input, textarea, select, [contenteditable="true"]')
      )
        return;
      if (SCROLL_KEYS.has(event.key)) interruptScroll();
    }

    const observer = new ResizeObserver(scheduleUpdate);
    const article = headings[0]?.closest('article');
    if (article) observer.observe(article);
    scheduleUpdate();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scrollend', finishScroll);
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('hashchange', finishScroll);
    window.addEventListener('popstate', finishScroll);
    window.addEventListener('wheel', interruptScroll, { passive: true });
    window.addEventListener('touchstart', interruptScroll, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
      startNavigationRef.current = null;
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scrollend', finishScroll);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('hashchange', finishScroll);
      window.removeEventListener('popstate', finishScroll);
      window.removeEventListener('wheel', interruptScroll);
      window.removeEventListener('touchstart', interruptScroll);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [items]);

  function navigateToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
    navigateToHeading(event, id, () => startNavigationRef.current?.(id));
  }

  return { activeId, navigateToSection };
}
