import type { MetadataRoute } from 'next';
import { postCategories } from '@/config/categories';
import { siteConfig } from '@/config/site';
import { getPublishedPosts } from '@/features/blog/lib/posts';

export default function sitemap(): MetadataRoute.Sitemap {
  const publishedPosts = getPublishedPosts();
  const posts = publishedPosts.map((p) => ({
    url: `${siteConfig.url}/blog/${p.slug}`,
    lastModified: new Date(p.lastUpdated),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  const lastModified = posts[0]?.lastModified;
  const categories = postCategories.flatMap(({ key }) => {
    const latestPost = publishedPosts.find((post) => post.categories.includes(key));

    return latestPost
      ? [{ url: `${siteConfig.url}/category/${key}`, lastModified: new Date(latestPost.lastUpdated), priority: 0.7 }]
      : [];
  });

  return [
    { url: siteConfig.url, lastModified, priority: 1 },
    { url: `${siteConfig.url}/blog`, lastModified, priority: 0.9 },
    { url: `${siteConfig.url}/about`, priority: 0.6 },
    ...categories,
    ...posts,
  ];
}
