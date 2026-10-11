import type { MetadataRoute } from 'next';
import { allPosts } from 'content-collections';
import { postCategories } from '@/config/categories';

const BASE_URL = 'https://angelaiskra.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const publishedPosts = allPosts
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  const posts = publishedPosts.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.lastUpdated),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  const lastModified = posts[0]?.lastModified;
  const categories = postCategories.flatMap(({ key }) => {
    const latestPost = publishedPosts.find((post) => post.categories.includes(key));

    return latestPost
      ? [{ url: `${BASE_URL}/category/${key}`, lastModified: new Date(latestPost.lastUpdated), priority: 0.7 }]
      : [];
  });

  return [
    { url: BASE_URL, lastModified, priority: 1 },
    { url: `${BASE_URL}/blog`, lastModified, priority: 0.9 },
    { url: `${BASE_URL}/about`, priority: 0.6 },
    ...categories,
    ...posts,
  ];
}
