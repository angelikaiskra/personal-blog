import { format, parseISO } from 'date-fns';
import type { Post } from 'content-collections';

import { Heading } from '@/components/ui/heading';
import { MaxWidthContainer } from '@/components/ui/max-width-container';
import { MdxContent } from '@/features/blog/components/mdx/mdx-content';
import { TableOfContents } from '@/features/blog/components/table-of-contents';
import { getTableOfContents } from '@/features/blog/lib/get-table-of-contents';
import { cn } from '@/lib/utils';

type PostViewProps = {
  post: Post;
};

export async function PostView({ post }: PostViewProps) {
  const tableOfContents = getTableOfContents(post.content);
  const showTableOfContents = post.showTableOfContents && tableOfContents.length > 0;

  return (
    <MaxWidthContainer className="mt-15 pb-20 sm:mt-20">
      <div className={cn('flex justify-center gap-x-16', { 'lg:justify-between': showTableOfContents })}>
        <main className="max-w-2xl">
          <header>
            <Heading as="h1" variant="h1" className="leading-tight">
              {post.title}
            </Heading>

            <div className="text-muted-fg mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <time dateTime={post.lastUpdated}>{format(parseISO(post.lastUpdated), 'MMM d, yyyy')}</time>
              <span className="bg-foreground size-1 rounded-full" aria-hidden="true" />
              <span>{post.readingTime}</span>
            </div>
          </header>

          <MdxContent source={post.content} />
        </main>

        {showTableOfContents && <TableOfContents items={tableOfContents} />}
      </div>
    </MaxWidthContainer>
  );
}
