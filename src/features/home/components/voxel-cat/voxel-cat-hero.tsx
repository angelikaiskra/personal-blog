'use client';

import dynamic from 'next/dynamic';

const VoxelCatCanvas = dynamic(() => import('./voxel-cat-canvas').then((module) => module.VoxelCatCanvas), {
  ssr: false,
});

export function VoxelCatHero() {
  return (
    <div className="pointer-events-none relative isolate h-72 w-full min-w-0 md:h-90" aria-hidden="true">
      <div className="bg-cat-halo/10 dark:bg-cat-halo/20 absolute inset-x-8 top-4 bottom-3 -z-10 rounded-[45%] sm:inset-x-16 md:inset-x-3" />
      <VoxelCatCanvas />
    </div>
  );
}
