import Link from "next/link";
import { allPosts } from "content-collections";
import { PostTag } from "@/config/tags";

interface Props {
  searchParams: Promise<{ tag?: string }>;
}

export default async function BlogPage({ searchParams }: Props) {
  const { tag } = await searchParams;

  const posts = allPosts
    .filter((p) => p.published)
    .filter((p) => (tag ? p.tags.includes(tag as PostTag) : true))
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  const allTags = Array.from(
    new Set(allPosts.flatMap((p) => p.tags))
  ).sort();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Blog</h1>
      <p className="mb-10 text-muted-fg">
        Notatki, odkrycia i przemyślenia z frontendu.
      </p>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${!tag
              ? "border-accent bg-accent text-accent-fg"
              : "border-border text-muted-fg hover:border-foreground hover:text-foreground"
              }`}
          >
            Wszystkie
          </Link>
          {allTags.map((t) => (
            <Link
              key={t}
              href={`/blog?tag=${t}`}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${tag === t
                ? "border-accent bg-accent text-accent-fg"
                : "border-border text-muted-fg hover:border-foreground hover:text-foreground"
                }`}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {/* Post list */}
      {posts.length === 0 ? (
        <p className="text-muted-fg">
          Brak postów{tag ? ` z tagiem "${tag}"` : ""}.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {posts.map((post) => (
            <li key={post._meta.path} className="py-8 first:pt-0">
              <Link href={`/blog/${post._meta.path}`} className="group block">
                <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <time
                    dateTime={post.lastUpdated}
                    className="font-mono text-xs text-muted-fg"
                  >
                    {new Date(post.lastUpdated).toLocaleDateString("pl-PL", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <span className="text-xs text-muted-fg">·</span>
                  <span className="text-xs text-muted-fg">
                    {post.readingTime}
                  </span>
                </div>
                <h2 className="mb-2 text-xl font-semibold text-foreground group-hover:text-accent transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-fg leading-relaxed">
                  {post.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-fg"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
