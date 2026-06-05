import Link from "next/link";
import { allPosts } from "content-collections";

export function HomeView() {
    const recentPosts = allPosts
        .filter((p) => p.published)
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
        .slice(0, 5);

    return (
        <div className="mx-auto max-w-3xl px-4 py-20">
            {/* Hero */}
            <section className="mb-20">
                <p className="mb-3 font-mono text-sm text-accent">cześć, jestem</p>
                <h1 className="mb-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                    Angela Iskra
                </h1>
                <p className="max-w-lg text-lg text-muted-fg leading-relaxed">
                    Frontend developer zakochana w React i TypeScript. Tu wrzucam notatki,
                    triki i odkrycia — żeby nie zapomnieć i może komuś się przydać.
                </p>
                <div className="mt-8 flex gap-3">
                    <Link
                        href="/blog"
                        className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-5 text-sm font-medium text-accent-fg hover:opacity-90 transition-opacity"
                    >
                        Czytaj blog
                    </Link>
                    <Link
                        href="/about"
                        className="inline-flex h-10 items-center justify-center rounded-md border border-border px-5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                        O mnie
                    </Link>
                </div>
            </section>

            {/* Recent posts */}
            {recentPosts.length > 0 && (
                <section>
                    <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-muted-fg">
                        Ostatnie posty
                    </h2>
                    <ul className="space-y-6">
                        {recentPosts.map((post) => (
                            <li key={post._meta.path}>
                                <Link
                                    href={`/blog/${post._meta.path}`}
                                    className="group block"
                                >
                                    <p className="mb-1 text-xs font-mono text-muted-fg">
                                        {new Date(post.lastUpdated).toLocaleDateString("pl-PL", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                    <h3 className="text-base font-medium text-foreground group-hover:text-accent transition-colors">
                                        {post.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-fg line-clamp-2">
                                        {post.description}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <Link
                        href="/blog"
                        className="mt-8 inline-flex text-sm text-accent hover:underline"
                    >
                        Wszystkie posty →
                    </Link>
                </section>
            )}
        </div>
    );
};