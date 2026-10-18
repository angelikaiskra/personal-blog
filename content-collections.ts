import { postCategoryKeys } from '@/config/categories';
import { defineCollection, defineConfig } from '@content-collections/core';
import readingTime from 'reading-time';
import { z } from 'zod';

const posts = defineCollection({
  name: 'posts',
  directory: 'content/posts',
  include: '**/*.mdx',
  exclude: '_template.mdx',
  schema: z.object({
    title: z.string().trim().min(1, 'Article title must not be empty'),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens for the slug'),
    excerpt: z.string().trim().min(1, 'Article excerpt must not be empty'),
    created: z.iso.date(),
    lastUpdated: z.iso.date(),
    categories: z.array(z.enum(postCategoryKeys)),
    published: z.boolean().default(false),
    showTableOfContents: z.boolean().default(true),
    content: z.string(),
  }),
  transform: (document) => {
    const stats = readingTime(document.content);
    return {
      ...document,
      readingTime: stats.text,
      readingMinutes: Math.ceil(stats.minutes),
    };
  },
  onSuccess: (documents) => {
    const slugPaths = new Map<string, string>();

    for (const post of documents) {
      const filePath = `content/posts/${post._meta.filePath}`;
      const existingPath = slugPaths.get(post.slug);

      if (existingPath) {
        throw new Error(`Duplicate article slug "${post.slug}": ${existingPath} and ${filePath}`);
      }

      slugPaths.set(post.slug, filePath);
    }
  },
});

export default defineConfig({
  content: [posts],
});
