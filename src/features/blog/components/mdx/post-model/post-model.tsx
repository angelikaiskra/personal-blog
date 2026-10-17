'use client';

import dynamic from 'next/dynamic';
import { Component, type ReactNode } from 'react';

const PostModelCanvas = dynamic(() => import('./post-model-canvas').then((module) => module.PostModelCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-fg" role="status">
      Loading model…
    </div>
  ),
});

class ModelErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-fg" role="status">
          The preview could not load. You can download the model below.
        </div>
      );
    }
    return this.props.children;
  }
}

type PostModelProps = {
  src: string;
  alt: string;
};

export function PostModel({ src, alt }: PostModelProps) {
  return (
    <figure className="not-prose mx-auto my-10 w-full max-w-[422px]">
      <div
        className="h-80 overflow-hidden rounded-lg bg-cat-halo/10 sm:h-96 dark:bg-cat-halo/20"
        role="group"
        aria-label={alt}
      >
        <ModelErrorBoundary key={src}>
          <PostModelCanvas src={src} />
        </ModelErrorBoundary>
      </div>
      <figcaption className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-muted-fg">
        <span>Drag to rotate.</span>
      </figcaption>
    </figure>
  );
}
