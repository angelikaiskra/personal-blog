'use client';

import Giscus from '@giscus/react';
import { useTheme } from 'next-themes';

type PostCommentsProps = {
  slug: string;
};

export function PostComments({ slug }: PostCommentsProps) {
  const { resolvedTheme } = useTheme();

  if (!resolvedTheme) return null;

  return (
    <Giscus
      key={slug}
      id="post-comments"
      repo="angelikaiskra/personal-blog"
      repoId="R_kgDOTrga-g"
      category="Blog comments"
      categoryId="DIC_kwDOTrga-s4DHkra"
      mapping="specific"
      term={`post:${slug}`}
      strict="1"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="top"
      theme={resolvedTheme === 'dark' ? 'transparent_dark' : 'light'}
      lang="en"
      loading="lazy"
    />
  );
}
