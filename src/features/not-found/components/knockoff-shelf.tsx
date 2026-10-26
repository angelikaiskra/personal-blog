'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { KnockoffScene, KnockoffStatus } from './knockoff-scene';

const isDark = (resolvedTheme: string | undefined) =>
  resolvedTheme ? resolvedTheme === 'dark' : document.documentElement.classList.contains('dark');

/** The 404 hero: the voxel cat clearing "404" off a shelf. Three.js loads only in the browser. */
export function KnockoffShelf() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<KnockoffScene | null>(null);
  const [status, setStatus] = useState<KnockoffStatus>('playing');
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => {
      setReduced(motion.matches);
      sceneRef.current?.setReducedMotion(motion.matches);
    };
    onMotion();
    motion.addEventListener('change', onMotion);
    let cancelled = false;

    import('./knockoff-scene')
      .then(({ createKnockoffScene }) => {
        if (cancelled) return;
        sceneRef.current = createKnockoffScene({
          canvas,
          theme: isDark(undefined) ? 'dark' : 'light',
          reducedMotion: motion.matches,
          onStatusChange: setStatus,
        });
      })
      // No WebGL (or a failed chunk): the copy below still does the job.
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      motion.removeEventListener('change', onMotion);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setTheme(isDark(resolvedTheme) ? 'dark' : 'light');
  }, [resolvedTheme]);

  if (failed) return null;

  return (
    <div className="relative isolate">
      <div
        className="absolute inset-x-[4%] top-[6%] bottom-[26%] -z-10 rounded-[45%] bg-cat-halo/10 dark:bg-cat-halo/5"
        aria-hidden="true"
      />
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="An orange voxel cat sitting on a yellow shelf next to the blocks 4, 0, 4, knocking them off one by one"
        className="block aspect-2/1 w-full touch-pan-y mask-b-from-72% mask-b-to-98%"
      />
      <div
        className="-mt-[4%] flex min-h-10 flex-wrap items-center justify-center gap-3.5 text-center font-code text-[13px] text-muted-fg"
        aria-live="polite"
      >
        {status === 'playing' && !reduced && <p>Click a block to help. Click the cat to hurry it up.</p>}
        {status === 'empty' && (
          <>
            <p>Shelf cleared. The cat is very proud.</p>
            <Button variant="secondary" size="sm" onClick={() => sceneRef.current?.rebuild()}>
              Put it back
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
