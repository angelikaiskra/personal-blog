import Image, { type ImageProps } from 'next/image';

import { cn } from '@/lib/utils';

type SupportedImageExtension = 'avif' | 'jpeg' | 'jpg' | 'png' | 'webp';

type PostImageProps = Pick<ImageProps, 'alt' | 'className' | 'sizes'> & {
  src: `${string}/assets/${string}.${SupportedImageExtension}`;
};

export async function PostImage({ src, alt, className, sizes }: PostImageProps) {
  const [postPath, imageFilename] = src.split('/assets/');
  const { default: image } = await import(`@content/posts/${postPath}/assets/${imageFilename}`);

  return (
    <Image
      src={image}
      alt={alt}
      sizes={sizes ?? '(max-width: 672px) 100vw, 672px'}
      placeholder="blur"
      className={cn('rounded-lg', className)}
    />
  );
}
