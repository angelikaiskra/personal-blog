import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import { prettyCodeOptions } from './code/pretty-code-options';
import { mdxComponents } from './mdx-component-map';

import './code/code-highlighting.css';

type MdxContentProps = {
  source: string;
};

export function MdxContent({ source }: MdxContentProps) {
  return (
    <article className="prose prose-zinc dark:prose-invert prose-lg prose-a:decoration-link-accent prose-a:decoration-2 prose-a:underline-offset-2 prose-headings:font-heading prose-headings:tracking-tight prose-h2:text-[32px] prose-h2:leading-[1.15] prose-h2:font-bold prose-h2:mt-20 prose-code:rounded-md prose-code:bg-inline-code-bg prose-code:box-decoration-clone prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.8em] prose-code:font-medium prose-code:before:content-none prose-code:after:content-none text-foreground mt-8 max-w-none leading-normal">
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
