import type { MDXRemoteProps } from 'next-mdx-remote/rsc';

import { linkedHeadingComponents } from './components/linked-heading';
import { Link } from './components/link';
import { PostImage } from './components/post-image';
import { Separator } from './components/separator';
import { Strike, Wave } from './components/text-effects';
import { Tip } from './components/tip';

export const mdxComponents = {
  ...linkedHeadingComponents,
  a: Link,
  PostImage,
  Separator,
  Strike,
  Tip,
  Wave,
} satisfies NonNullable<MDXRemoteProps['components']>;
