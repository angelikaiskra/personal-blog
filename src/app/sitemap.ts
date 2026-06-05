import type { MetadataRoute } from "next";
import { allPosts } from "content-collections";

const BASE_URL = "https://angela-iskra.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = allPosts
    .filter((p) => p.published)
    .map((p) => ({
      url: `${BASE_URL}/blog/${p._meta.path}`,
      lastModified: new Date(p.lastUpdated),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [
    { url: BASE_URL, lastModified: new Date(), priority: 1 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), priority: 0.9 },
    // { url: `${BASE_URL}/projects`, lastModified: new Date(), priority: 0.7 },
    // { url: `${BASE_URL}/about`, lastModified: new Date(), priority: 0.6 },
    ...posts,
  ];
}
