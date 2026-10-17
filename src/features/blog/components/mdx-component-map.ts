import type { MDXRemoteProps } from 'next-mdx-remote/rsc';

import { VoxelCatHero } from '@/features/home/components/voxel-cat/voxel-cat-hero';

import { Aside } from './mdx/aside/aside';
import { CodeBlock } from './mdx/code-block/code-block';
import { CodeBlockPre } from './mdx/code-block/code-block-pre';
import { linkedHeadingComponents } from './mdx/linked-heading';
import { Link } from './mdx/link';
import { PostImage } from './mdx/post-image';
import { PostModel } from './mdx/post-model/post-model';
import { Separator } from './mdx/separator';
import { SprinkledText } from './mdx/sprinkled-text';
import { HighlightedText, Strike, Wave } from './mdx/text-effects';

export const mdxComponents = {
  ...linkedHeadingComponents,
  a: Link,
  pre: CodeBlockPre,
  Animated3dCat: VoxelCatHero,
  Aside,
  CodeBlock,
  HighlightedText,
  PostImage,
  PostModel,
  Separator,
  SprinkledText,
  Strike,
  Wave,
} satisfies NonNullable<MDXRemoteProps['components']>;
