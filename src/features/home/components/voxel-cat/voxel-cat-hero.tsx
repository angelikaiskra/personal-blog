'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Component, useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { CatTouchTarget } from './cat-pointer-input';
import { CatTouchSparkles } from './cat-touch-sparkles';

const VoxelCatCanvas = dynamic(() => import('./voxel-cat-canvas').then((module) => module.VoxelCatCanvas), {
  ssr: false,
});

class CatCanvasBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function CatPoster() {
  return (
    <>
      <Image
        src="/cat-light-fallback.webp"
        alt=""
        fill
        unoptimized
        loading="eager"
        fetchPriority="high"
        className="object-contain dark:hidden"
      />
      <Image
        src="/cat-dark-fallback.webp"
        alt=""
        fill
        unoptimized
        loading="eager"
        fetchPriority="high"
        className="hidden object-contain dark:block"
      />
    </>
  );
}

export function VoxelCatHero() {
  const [touchTarget, setTouchTarget] = useState<CatTouchTarget | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  return (
    <div className="pointer-events-none relative isolate h-72 w-full min-w-0 md:h-90" aria-hidden="true">
      <div className="absolute inset-x-8 top-4 bottom-3 -z-10 rounded-[45%] bg-cat-halo/10 sm:inset-x-16 md:inset-x-3 dark:bg-cat-halo/20" />
      <div className={cn('absolute inset-0', isCanvasReady && 'invisible')}>
        <CatPoster />
      </div>
      <div className={cn('absolute inset-0', !isCanvasReady && 'opacity-0')}>
        <CatCanvasBoundary onError={() => setIsCanvasReady(false)}>
          <VoxelCatCanvas onTouchTargetChange={setTouchTarget} onReadyChange={setIsCanvasReady} />
        </CatCanvasBoundary>
      </div>
      <CatTouchSparkles target={touchTarget} />
    </div>
  );
}
