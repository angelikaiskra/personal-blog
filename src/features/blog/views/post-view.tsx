import { format, parseISO } from 'date-fns';
import type { Post } from 'content-collections';

import { Heading } from '@/components/ui/heading';
import { MaxWidthContainer } from '@/components/ui/max-width-container';
import { compileMdxContent } from '@/features/blog/components/mdx-content';
import { PostComments } from '@/features/blog/components/post-comments';
import { TableOfContents } from '@/features/blog/components/table-of-contents';
import { cn } from '@/lib/utils';

type PostViewProps = {
  post: Post;
};

export async function PostView({ post }: PostViewProps) {
  const { content, tableOfContents } = await compileMdxContent(post.content);
  const showTableOfContents = post.showTableOfContents && tableOfContents.length > 0;

  return (
    <MaxWidthContainer className="mt-15 pb-20 sm:mt-20">
      <div className={cn('flex justify-center gap-x-16', { 'lg:justify-between': showTableOfContents })}>
        <main className="max-w-2xl min-w-0 flex-1">
          <header>
            <Heading as="h1" variant="h1" className="leading-tight">
              {post.title}
            </Heading>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-fg">
              <time dateTime={post.lastUpdated}>{format(parseISO(post.lastUpdated), 'MMMM do, yyyy')}</time>
              <span className="size-1 rounded-full bg-foreground" aria-hidden="true" />
              <span>{post.readingTime}</span>
            </div>
          </header>

          {content}

          <section aria-label="Comments" className="mt-16 border-t-2 border-border pt-8">
            <PostComments slug={post.slug} />
          </section>
        </main>

        {showTableOfContents && <TableOfContents items={tableOfContents} />}
      </div>
    </MaxWidthContainer>
  );
}
