import { notFound } from "next/navigation";
import { allPosts } from "content-collections";
import { MDXContent } from "@/components/mdx/MDXContent";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allPosts
    .filter((p) => p.published)
    .map((p) => ({ slug: p._meta.path }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = allPosts.find((p) => p._meta.path === slug && p.published);

  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      {/* Header */}
      <header className="mb-12">
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-fg font-mono">
          <time dateTime={post.lastUpdated}>
            {new Date(post.lastUpdated).toLocaleDateString("pl-PL", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>

        <h1 className="mb-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {post.title}
        </h1>

        <p className="text-lg text-muted-fg leading-relaxed">
          {post.description}
        </p>

        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-fg"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Layout: content + optional sidebar */}
      <div>
        {/* Article body */}
        <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-code-bg prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.85em] prose-code:font-mono">
          <MDXContent source={post.content} />
        </article>
      </div>
    </div>
  );
}
