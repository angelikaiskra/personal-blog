import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

import { mdxComponents } from './mdx-component-map';
import { prettyCodeOptions } from './pretty-code-options';

const mdxContentStyles = cn(
  // Article
  'prose prose-zinc prose-lg dark:prose-invert',
  'text-foreground mt-8 max-w-none leading-normal',

  // Headings
  'prose-headings:font-heading prose-headings:tracking-tight',
  'prose-h2:mt-12 prose-h2:mb-8 prose-h2:text-3xl prose-h2:font-bold prose-h2:leading-[1.15]',
  'prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-2xl prose-h3:leading-normal',
  'prose-h4:mt-8 prose-h4:mb-2 prose-h4:text-lg prose-h4:leading-[calc(1.75/1.125)]',

  // Paragraphs
  'prose-p:my-6 prose-p:[&:is(h2+p,h3+p,h4+p)]:mt-0',

  // Links
  'prose-a:decoration-link-accent prose-a:decoration-2 prose-a:underline-offset-2',

  // Inline code
  'prose-code:bg-inline-code-bg prose-code:rounded-md prose-code:px-1.5 prose-code:py-0.5',
  'prose-code:font-code prose-code:text-[15px] prose-code:font-medium prose-code:box-decoration-clone',
  'prose-code:before:content-none prose-code:after:content-none',

  // Code figures
  '[&_[data-rehype-pretty-code-figure]]:my-12 [&_[data-rehype-pretty-code-figure]]:min-w-0 [&_[data-rehype-pretty-code-figure]]:max-w-none',
  'sm:[&_[data-rehype-pretty-code-figure]]:-mx-8',
);

type MdxContentProps = {
  source: string;
};

export function MdxContent({ source }: MdxContentProps) {
  return (
    <article className={mdxContentStyles}>
      <MDXRemote
        source={source}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCodeOptions]],
          },
        }}
        components={mdxComponents}
      />
    </article>
  );
}
