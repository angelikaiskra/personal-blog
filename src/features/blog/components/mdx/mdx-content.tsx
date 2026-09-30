import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import { mdxComponents } from './mdx-component-map';

type MdxContentProps = {
  source: string;
};

export function MdxContent({ source }: MdxContentProps) {
  return (
    <article className="prose prose-zinc dark:prose-invert prose-lg prose-a:decoration-link-accent prose-a:decoration-2 prose-a:underline-offset-2 prose-headings:font-heading prose-headings:tracking-tight prose-h2:text-[32px] prose-h2:leading-[1.15] prose-h2:font-bold prose-h2:mt-20 text-foreground mt-8 max-w-none leading-normal">
      <MDXRemote
        source={source}
        options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } }}
        components={mdxComponents}
      />
    </article>
  );
}
