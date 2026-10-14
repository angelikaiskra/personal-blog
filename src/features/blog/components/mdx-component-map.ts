import type { MDXRemoteProps } from 'next-mdx-remote/rsc';

import { VoxelCatHero } from '@/features/home/components/voxel-cat/voxel-cat-hero';

import { Aside } from './mdx/aside';
import { CodeBlock } from './mdx/code-block';
import { linkedHeadingComponents } from './mdx/linked-heading';
import { Link } from './mdx/link';
import { PostImage } from './mdx/post-image';
import { PostModel } from './mdx/post-model';
import { Separator } from './mdx/separator';
import { SprinkledText } from './mdx/sprinkled-text';
import { Strike, Wave } from './mdx/text-effects';

export const mdxComponents = {
  ...linkedHeadingComponents,
  a: Link,
  pre: CodeBlock,
  Animated3dCat: VoxelCatHero,
  Aside,
  PostImage,
  PostModel,
  Separator,
  SprinkledText,
  Strike,
  Wave,
} satisfies NonNullable<MDXRemoteProps['components']>;
