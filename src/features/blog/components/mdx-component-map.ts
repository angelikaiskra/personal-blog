import type { MDXRemoteProps } from 'next-mdx-remote/rsc';

import { Link } from '@/components/ui/link';
import { VoxelCatHero } from '@/features/home/components/voxel-cat/voxel-cat-hero';

import { Aside } from './mdx/aside/aside';
import { CodeBlock } from './mdx/code-block/code-block';
import { CodeBlockPre } from './mdx/code-block/code-block-pre';
import { linkedHeadingComponents } from './mdx/linked-heading';
import { PostImage } from './mdx/post-image';
import { PostModel } from './mdx/post-model/post-model';
import { Separator } from './mdx/separator';
import { SprinkledText } from './mdx/sprinkled-text';
import { HighlightedText, Strike } from './mdx/text-effects';

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
} satisfies NonNullable<MDXRemoteProps['components']>;
