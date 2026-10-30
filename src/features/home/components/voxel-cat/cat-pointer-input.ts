export const CAT_TOUCH = {
  /** How near the cat's face on screen a tap has to land, in CSS pixels. */
  radius: 400,
  /** How long a tap holds the cat's attention afterwards, in milliseconds. */
  duration: 3000,
  /** Past this much travel, in CSS pixels, the gesture is a drag rather than a tap. */
  maxTapMovement: 10,
} as const;

export type CatTouchTarget = {
  /** Document coordinates keep the target anchored to the tapped place while scrolling. */
  pageX: number;
  pageY: number;
  /** Remounts the sparkle animation even when tapping the same spot again. */
  id: number;
};

/** Somewhere on screen for the cat to look, in viewport coordinates. */
export type CatLook = { clientX: number; clientY: number };

const interactiveSelector = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'label',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="option"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role^="menuitem"]',
  '[role="tab"]',
  '[role="treeitem"]',
  // Opt out custom clickable containers that have no native control semantics.
  '[data-cat-ignore]',
].join(',');

const isInteractive = (event: PointerEvent) =>
  event.composedPath().some((node) => node instanceof Element && node.closest(interactiveSelector));

/**
 * Everything the cat watches, from one place: a mouse or pen is followed while it is in the
 * window, and a tap near the cat holds its attention for a few seconds after the finger has
 * gone. The hero is `pointer-events-none`, so the window is the only source of events, and
 * `read()` is the single answer the frame loop asks for.
 */
export function createCatPointerInput({
  acceptTap,
  onTargetChange,
}: {
  /** Whether a tap landed near enough to the cat's face; the scene owns that decision. */
  acceptTap: (target: CatTouchTarget) => boolean;
  onTargetChange: (target: CatTouchTarget | null) => void;
}) {
  /** A mouse or pen in the window. Null once it leaves, releases or the page loses focus. */
  let hover: CatLook | null = null;
  /** An accepted tap, which outlives both the gesture and any scrolling that follows it. */
  let target: CatTouchTarget | null = null;
  /** A touch in progress, still eligible to become a tap. */
  let gesture: { pointerId: number; clientX: number; clientY: number } | null = null;
  let timeout: number | undefined;
  let nextId = 0;

  function clearTarget() {
    window.clearTimeout(timeout);
    if (target) {
      target = null;
      onTargetChange(null);
    }
  }

  /** Nothing left to watch: used when the pointer goes away and when the scene pauses. */
  function clear() {
    hover = null;
    gesture = null;
    clearTarget();
  }

  /** A mouse or pen takes over from any held tap. */
  function hoverAt(event: PointerEvent) {
    clear();
    hover = { clientX: event.clientX, clientY: event.clientY };
  }

  /** Enough travel turns the touch into a scroll, and a scroll is not a tap. */
  function trackGesture(event: PointerEvent) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    if (Math.hypot(event.clientX - gesture.clientX, event.clientY - gesture.clientY) > CAT_TOUCH.maxTapMovement) {
      gesture = null;
    }
  }

  const onDown = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') return hoverAt(event);
    gesture = null;
    if (!event.isPrimary || isInteractive(event)) return;
    gesture = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY };
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') trackGesture(event);
    else hoverAt(event);
  };

  const onUp = (event: PointerEvent) => {
    // A pen leaves nothing behind on release; the mouse stays where it was last seen.
    if (event.pointerType !== 'touch') {
      if (event.pointerType !== 'mouse') clear();
      return;
    }
    trackGesture(event);
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    gesture = null;
    if (event.defaultPrevented || isInteractive(event)) return;
    const tap = { pageX: event.clientX + window.scrollX, pageY: event.clientY + window.scrollY, id: nextId++ };
    if (!acceptTap(tap)) return;
    // Expiring the previous target must not cancel a new tap that is still being held.
    window.clearTimeout(timeout);
    target = tap;
    onTargetChange(target);
    timeout = window.setTimeout(clearTarget, CAT_TOUCH.duration);
  };

  const onCancel = (event: PointerEvent) => {
    // Browsers cancel the gesture when scrolling starts; the held target survives that.
    if (event.pointerType === 'touch') gesture = null;
    else clear();
  };

  // Touch `pointerleave` follows every `pointerup` and must not cancel a fresh tap.
  const onLeave = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') clear();
  };

  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointercancel', onCancel, { passive: true });
  window.addEventListener('blur', clear);
  document.addEventListener('pointerleave', onLeave);

  return {
    /** A held tap wins over the cursor; null when there is nothing to watch. */
    read: (): CatLook | null =>
      target ? { clientX: target.pageX - window.scrollX, clientY: target.pageY - window.scrollY } : hover,
    clear,
    dispose: () => {
      clear();
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('blur', clear);
      document.removeEventListener('pointerleave', onLeave);
    },
  };
}
