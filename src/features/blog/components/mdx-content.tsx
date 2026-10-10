import { compileMDX } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';
import { rehypeTableOfContents, type TableOfContentsItem } from '../lib/rehype-table-of-contents';

import { mdxComponents } from './mdx-component-map';
import { prettyCodeOptions } from './pretty-code-options';

const mdxContentStyles = cn(
  // Article
  'prose prose-zinc prose-lg dark:prose-invert',
  'text-foreground mt-8 max-w-none leading-normal',

  // Headings
  'prose-headings:font-heading prose-headings:tracking-tight',
  'prose-h2:mt-16 prose-h2:mb-8 prose-h2:text-[24px] prose-h2:font-bold prose-h2:leading-[1.15]',
  'prose-h3:mt-12 prose-h3:mb-4 prose-h3:text-[20px] prose-h3:leading-normal',
  'prose-h4:mt-12 prose-h4:mb-2 prose-h4:text-[20px] prose-h4:leading-[calc(1.75/1.125)]',

  // Paragraphs
  'prose-p:my-6 prose-p:[&:is(h2+p,h3+p,h4+p)]:mt-0',

  // Links
  'prose-a:decoration-link-accent prose-a:decoration-2 prose-a:underline-offset-2',

  // Inline code
  'prose-code:bg-inline-code-bg prose-code:rounded-md prose-code:px-1.5 prose-code:py-0.5',
  'prose-code:font-code prose-code:text-[15px] prose-code:font-medium prose-code:box-decoration-clone',
  'prose-code:before:content-none prose-code:after:content-none',
);

export async function compileMdxContent(source: string) {
  const tableOfContents: TableOfContentsItem[] = [];
  const { content } = await compileMDX({
    source,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeTableOfContents, { items: tableOfContents }],
          [rehypePrettyCode, prettyCodeOptions],
        ],
      },
    },
    components: mdxComponents,
  });
  return { content: <article className={mdxContentStyles}>{content}</article>, tableOfContents };
}
