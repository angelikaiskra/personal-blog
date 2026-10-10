import type { MDXRemoteProps } from 'next-mdx-remote/rsc';

import { CodeBlock } from './mdx/code-block';
import { linkedHeadingComponents } from './mdx/linked-heading';
import { Link } from './mdx/link';
import { PostImage } from './mdx/post-image';
import { Separator } from './mdx/separator';
import { Strike, Wave } from './mdx/text-effects';
import { Tip } from './mdx/tip';

export const mdxComponents = {
  ...linkedHeadingComponents,
  a: Link,
  pre: CodeBlock,
  PostImage,
  Separator,
  Strike,
  Tip,
  Wave,
} satisfies NonNullable<MDXRemoteProps['components']>;
