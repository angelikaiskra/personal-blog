import Image, { type ImageProps } from 'next/image';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type SupportedImageExtension = 'avif' | 'gif' | 'jpeg' | 'jpg' | 'png' | 'webp';

type PostImageProps = Pick<ImageProps, 'alt' | 'className' | 'sizes'> & {
  src: `${string}/assets/${string}.${SupportedImageExtension}`;
  children?: ReactNode;
};

export async function PostImage({
  src,
  alt,
  className,
  sizes = '(max-width: 672px) 100vw, 672px',
  children,
}: PostImageProps) {
  const [postPath, imageFilename] = src.split('/assets/');
  const { default: image } = await import(`@content/posts/${postPath}/assets/${imageFilename}`);

  const imageElement = (
    <Image
      src={image}
      alt={alt}
      sizes={sizes}
      placeholder={image.blurDataURL ? 'blur' : 'empty'}
      className={cn('h-auto w-full rounded-lg', className)}
    />
  );

  if (!children) return imageElement;

  return (
    <figure className="not-prose my-8">
      {imageElement}
      <figcaption className="mt-2 text-center text-sm text-muted-fg [&_a]:underline [&_a]:decoration-link-accent [&_a]:decoration-2 [&_a]:underline-offset-2">
        {children}
      </figcaption>
    </figure>
  );
}
