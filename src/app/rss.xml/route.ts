import { Feed } from 'feed';
import { postCategories } from '@/config/categories';
import { siteConfig } from '@/config/site';
import { getPublishedPosts } from '@/features/blog/lib/posts';

export const dynamic = 'force-static';

export function GET() {
  const posts = getPublishedPosts();
  const lastUpdated = posts.length
    ? new Date(Math.max(...posts.map((post) => new Date(post.lastUpdated).getTime())))
    : undefined;
  const feed = new Feed({
    title: siteConfig.name,
    id: `${siteConfig.url}/blog`,
    link: `${siteConfig.url}/blog`,
    description: siteConfig.description,
    language: 'en',
    feedLinks: { rss: `${siteConfig.url}/rss.xml` },
    updated: lastUpdated,
    generator: false,
  });

  for (const post of posts) {
    feed.addItem({
      title: post.title,
      link: `${siteConfig.url}/blog/${post.slug}`,
      description: post.excerpt,
      date: new Date(post.lastUpdated),
      published: new Date(post.created),
      category: post.categories.map((key) => ({
        name: postCategories.find((category) => category.key === key)?.label ?? key,
      })),
    });
  }

  return new Response(feed.rss2(), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
