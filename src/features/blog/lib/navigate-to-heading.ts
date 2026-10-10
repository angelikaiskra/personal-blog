import type { MouseEvent } from 'react';

// Preserves native modified clicks; enhance ordinary fragment navigation with smooth scrolling.
export function navigateToHeading(event: MouseEvent<HTMLAnchorElement>, id: string, onNavigate?: () => void) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const heading = document.getElementById(id);
  if (!heading) return;

  event.preventDefault();
  onNavigate?.();

  const hash = `#${encodeURIComponent(id)}`;
  if (window.location.hash !== hash) window.history.pushState(null, '', hash);
  heading.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    block: 'start',
  });
}
