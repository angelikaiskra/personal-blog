import { allPosts } from 'content-collections';
import { Feed } from 'feed';
import { postCategories } from '@/config/categories';

const BASE_URL = 'https://angelaiskra.com';

export const dynamic = 'force-static';

export function GET() {
  const posts = allPosts
    .filter((post) => post.published)
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  const lastUpdated = posts.length
    ? new Date(Math.max(...posts.map((post) => new Date(post.lastUpdated).getTime())))
    : undefined;
  const feed = new Feed({
    title: 'Angela Iskra',
    id: `${BASE_URL}/blog`,
    link: `${BASE_URL}/blog`,
    description: 'Blog about React, TypeScript and frontend development.',
    language: 'en',
    feedLinks: { rss: `${BASE_URL}/rss.xml` },
    updated: lastUpdated,
    generator: false,
  });

  for (const post of posts) {
    feed.addItem({
      title: post.title,
      link: `${BASE_URL}/blog/${post.slug}`,
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
