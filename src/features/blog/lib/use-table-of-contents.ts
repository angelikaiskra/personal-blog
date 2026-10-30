'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';

import { navigateToHeading } from './navigate-to-heading';
import type { TableOfContentsItem } from './rehype-table-of-contents';

const SCROLL_SETTLE_DELAY = 180;

export function useTableOfContents(items: TableOfContentsItem[]) {
  const [activeId, setActiveId] = useState(items[0]?.id);
  const startNavigationRef = useRef<((id: string) => void) | null>(null);

  useEffect(() => {
    const headings = items.map(({ id }) => document.getElementById(id)).filter((heading) => heading !== null);
    if (!headings.length) return;

    const controller = new AbortController();
    const { signal } = controller;
    let frame = 0;
    let pendingId: string | null = null;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    function updateActiveSection() {
      frame = 0;
      if (pendingId) return;

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

    function interruptScroll() {
      if (!pendingId) return;
      window.scrollTo({ top: window.scrollY, behavior: 'instant' });
      finishScroll();
    }

    startNavigationRef.current = (id) => {
      pendingId = id;
      setActiveId(id);
      // Release even when the destination is already at its scroll position.
      waitForScrollToSettle();
    };

    const observer = new ResizeObserver(scheduleUpdate);
    const article = headings[0].closest('article');
    if (article) observer.observe(article);
    scheduleUpdate();

    function onScroll() {
      // A quiet period also handles browsers without scrollend support.
      if (pendingId) waitForScrollToSettle();
      scheduleUpdate();
    }

    window.addEventListener('scroll', onScroll, { passive: true, signal });
    window.addEventListener('resize', scheduleUpdate, { signal });
    for (const type of ['scrollend', 'hashchange', 'popstate']) window.addEventListener(type, finishScroll, { signal });
    for (const type of ['wheel', 'touchstart'])
      window.addEventListener(type, interruptScroll, { passive: true, signal });

    return () => {
      controller.abort();
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
      startNavigationRef.current = null;
      observer.disconnect();
    };
  }, [items]);

  function navigateToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
    navigateToHeading(event, id, () => startNavigationRef.current?.(id));
  }

  return { activeId, navigateToSection };
}
