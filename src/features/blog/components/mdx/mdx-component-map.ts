import type { MDXRemoteProps } from 'next-mdx-remote/rsc';

import { PostImage } from './components/post-image';
import { Separator } from './components/separator';
import { Strike, Wave } from './components/text-effects';
import { Tip } from './components/tip';

export const mdxComponents = {
  PostImage,
  Separator,
  Strike,
  Tip,
  Wave,
} satisfies NonNullable<MDXRemoteProps['components']>;
