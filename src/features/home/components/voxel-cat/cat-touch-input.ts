export const CAT_TOUCH = {
  radius: 400,
  duration: 3000,
  maxTapMovement: 10,
} as const;

export type CatTouchTarget = {
  /** Document coordinates keep the target anchored to the tapped place while scrolling. */
  pageX: number;
  pageY: number;
  /** Remounts the sparkle animation even when tapping the same spot again. */
  id: number;
};

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

/** Owns touch gestures and their lifetime; the scene decides whether a tap is near enough. */
export function createCatTouchInput({
  acceptTap,
  onTargetChange,
}: {
  acceptTap: (target: CatTouchTarget) => boolean;
  onTargetChange: (target: CatTouchTarget | null) => void;
}) {
  let gesture: { pointerId: number; clientX: number; clientY: number } | null = null;
  let target: CatTouchTarget | null = null;
  let timeout: number | undefined;
  let nextId = 0;

  function clearTarget() {
    window.clearTimeout(timeout);
    if (target) {
      target = null;
      onTargetChange(null);
    }
  }

  function clear() {
    gesture = null;
    clearTarget();
  }

  function onDown(event: PointerEvent) {
    if (event.pointerType !== 'touch') return;
    gesture = null;
    if (!event.isPrimary || isInteractive(event)) return;
    gesture = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY };
  }

  function onMove(event: PointerEvent) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    if (Math.hypot(event.clientX - gesture.clientX, event.clientY - gesture.clientY) > CAT_TOUCH.maxTapMovement) {
      gesture = null;
    }
  }

  function onUp(event: PointerEvent) {
    onMove(event);
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    gesture = null;
    if (event.defaultPrevented || isInteractive(event)) return;
    const point = {
      pageX: event.clientX + window.scrollX,
      pageY: event.clientY + window.scrollY,
      id: nextId++,
    };
    if (!acceptTap(point)) return;

    window.clearTimeout(timeout);
    target = point;
    onTargetChange(target);
    // Expiring the previous target must not cancel a new tap that is still being held.
    timeout = window.setTimeout(clearTarget, CAT_TOUCH.duration);
  }

  function onCancel(event: PointerEvent) {
    // Browsers cancel the current gesture when scrolling starts, not the existing target.
    if (event.pointerType === 'touch') gesture = null;
  }

  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointercancel', onCancel, { passive: true });

  function dispose() {
    clear();
    window.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
  }

  return { clear, dispose };
}
