import type { ReactNode } from 'react';
import { format, parseISO } from 'date-fns';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import type { Post } from 'content-collections';

import { Heading } from '@/components/ui/heading';
import { MaxWidthContainer } from '@/components/ui/max-width-container';
import { Text } from '@/components/ui/text';

type PostViewProps = {
  post: Post;
};

type TableOfContentsItem = {
  id: string;
  title: string;
};

export async function PostView({ post }: PostViewProps) {
  const tableOfContents = getTableOfContents(post.content);

  return (
    <MaxWidthContainer className="mt-15 pb-20 sm:mt-20">
      <div className="flex justify-center gap-x-16 lg:justify-between">
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

          <article className="prose prose-zinc dark:prose-invert prose-lg prose-headings:font-heading prose-headings:tracking-tight prose-h2:text-[32px] prose-h2:leading-[1.15] prose-h2:font-bold prose-h2:mt-20 text-foreground mt-8 max-w-none leading-normal">
            <MDXRemote
              source={post.content}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } }}
              components={{
                Strike: ({ children }: { children: ReactNode }) => <s>{children}</s>,
                Tip: ({ children }: { children: ReactNode }) => (
                  <aside className="border-foreground/30 text-muted-fg my-6 border-l-2 pl-4">{children}</aside>
                ),
                Wave: ({ children }: { children: ReactNode }) => <span>{children}</span>,
              }}
            />
          </article>
        </main>

        {tableOfContents.length > 0 && <TableOfContents items={tableOfContents} />}
      </div>
    </MaxWidthContainer>
  );
}

function TableOfContents({ items }: { items: TableOfContentsItem[] }) {
  return (
    <aside className="hidden max-w-62.5 lg:block">
      <nav aria-label="Table Of Contents" className="lg:sticky lg:top-41">
        <Heading variant="h2" as="h2" className="text-sm font-semibold tracking-wide uppercase">
          Table Of Contents
        </Heading>
        <ol className="border-border mt-3 space-y-2 border-l pl-4 text-sm">
          {items.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-muted-fg hover:text-foreground transition-colors">
                {item.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}

function getTableOfContents(content: string): TableOfContentsItem[] {
  const headings = [...content.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].replace(/[*_`]/g, '').trim());
  const ids = new Map<string, number>();

  return headings.map((title) => {
    const baseId = slugify(title);
    const occurrence = ids.get(baseId) ?? 0;
    ids.set(baseId, occurrence + 1);

    return { id: occurrence === 0 ? baseId : `${baseId}-${occurrence}`, title };
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
